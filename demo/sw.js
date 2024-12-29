importScripts('./labor.js')

let laborInstance = null;

// 首先注册 fetch 事件处理程序
addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    console.log('Fetch event:', url.pathname);
    
    if (url.pathname.startsWith('/api/')) {
        event.respondWith((async () => {
            console.log('Handling API request');
            try {
                // 等待 labor 实例初始化
                if (!laborInstance) {
                    console.log('Waiting for labor initialization...');
                    return new Response(JSON.stringify({ error: 'System initializing' }), {
                        status: 503,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    });
                }

                console.log('Calling labor.http.get');
                const response = await laborInstance.http.get(url.pathname);
                console.log('Got response from WASM:', response);
                
                const data = await response.json();
                console.log('Parsed JSON:', data);
                
                return new Response(JSON.stringify(data), {
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            } catch (error) {
                console.error('Error in fetch handler:', error);
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }
        })());
    }
});

addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    event.waitUntil(skipWaiting());
});

addEventListener('activate', event => {
    console.log('Service Worker activating...');
    event.waitUntil(clients.claim());
});

// 然后初始化 labor
registerLaborListener('out.wasm', { base: 'api' })
    .then((labor) => {
        console.log('Labor initialized');
        laborInstance = labor;
        
        console.log('Executing labor setup');
        excute(`
            const http = require('http')
            http.get('/hello')
        `);
        console.log('Labor setup complete');
    })
    .catch(error => {
        console.error('Labor initialization error:', error);
    });
