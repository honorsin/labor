importScripts('./labor.js')

addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(skipWaiting());
})

addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(clients.claim());
})

// 处理模块文件的请求
addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.pathname.endsWith('.js')) {
    console.log('Fetching module:', url.pathname);
    event.respondWith(fetch(event.request));
  }
});

// 初始化 WASM
registerLaborListener('out.wasm', { base: 'api' })
  .then(async (labor) => {
    console.log('Labor initialized');
    
    try {
      // 预加载所有需要的模块
      console.log('Preloading modules...');
      await labor.preloadModule('./main');
      await labor.preloadModule('./utils');
      console.log('Modules preloaded');
      
      // 现在可以同步加载模块
      console.log('Loading main module...');
      const mainModule = labor.require('./main');
      console.log('Main module loaded:', mainModule);
      
      console.log('Main module exports:', Object.keys(mainModule));
      console.log('Init function:', mainModule.init);
      
      const result = mainModule.init();
      console.log('Main module initialized with result:', result);
    } catch (error) {
      console.error('Error in main module:', error);
      console.error('Stack:', error.stack);
    }
  })
  .catch(error => {
    console.error('Labor initialization error:', error);
  });
