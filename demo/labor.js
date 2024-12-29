importScripts('./wasm_exec.js')

self.labor = {
  http: {},
  fs: {},
}

function registerLaborListener(wasm, { base, args = [] } = {}) {
  let path = new URL(registration.scope).pathname
  if (base && base !== '') path = `${trimEnd(path, '/')}/${trimStart(base, '/')}`

  const handlerPromise = new Promise(setHandler => {
    self.labor.path = path
    self.labor.setHandler = setHandler
  })

  addEventListener('fetch', e => {
    const { pathname } = new URL(e.request.url)
    if (!pathname.startsWith(path)) return
    e.respondWith(handlerPromise.then(handler => handler(e.request)))
  })

  return new Promise((resolve) => {
    const go = new Go()
    go.argv = [wasm, ...args]
    WebAssembly.instantiateStreaming(fetch(wasm), go.importObject).then(({ instance }) => {
      go.run(instance)
      resolve(self.labor)
    })
  })
}

function excute(script){
  new Function('labor', `with(labor){${script}}`)(self.labor)
}

function trimStart(s, c) {
  let r = s
  while (r.startsWith(c)) r = r.slice(c.length)
  return r
}

function trimEnd(s, c) {
  let r = s
  while (r.endsWith(c)) r = r.slice(0, -c.length)
  return r
}

// 添加模块缓存
self.labor._moduleCache = new Map();

// 预加载所有模块
self.labor._preloadedModules = new Map();

// 预加载函数
self.labor.preloadModule = async (path) => {
    const filePath = path.endsWith('.js') ? path : path + '.js';
    const response = await fetch(filePath);
    const content = await response.text();
    self.labor._preloadedModules.set(path, content);
};

// 同步 require 实现
self.labor.require = (path) => {
    console.log('Requiring module:', path);

    // 检查是否是内置模块
    if (path in self.labor) {
        console.log('Found built-in module:', path);
        return self.labor[path];
    }

    // 检查缓存
    if (self.labor._moduleCache.has(path)) {
        console.log('Found cached module:', path);
        return self.labor._moduleCache.get(path);
    }

    // 检查预加载的模块
    if (!self.labor._preloadedModules.has(path)) {
        throw new Error(`Module ${path} not preloaded`);
    }

    try {
        const content = self.labor._preloadedModules.get(path);
        console.log('Executing module:', path);
        
        // 创建模块对象
        const module = { exports: {} };
        
        // 将模块添加到缓存（防止循环依赖）
        self.labor._moduleCache.set(path, module.exports);
        
        // 执行模块代码
        const moduleFunction = new Function('module', 'exports', 'require', content);
        moduleFunction(module, module.exports, self.labor.require);
        
        console.log('Module loaded:', path, 'exports:', module.exports);
        
        // 更新缓存
        self.labor._moduleCache.set(path, module.exports);
        
        return module.exports;
    } catch (error) {
        console.error(`Error executing module ${path}:`, error);
        throw error;
    }
};