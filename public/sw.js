const CACHE_NAME = 'ebbinghaus-video-v2';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/index.html'
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
  console.log('SW: Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Caching app resources');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('SW: Failed to cache resources:', error);
      })
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  // 跳过非GET请求
  if (event.request.method !== 'GET') {
    return;
  }

  // 跳过blob URL和chrome-extension
  if (event.request.url.startsWith('blob:') || 
      event.request.url.startsWith('chrome-extension:')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果缓存中有，直接返回
        if (response) {
          console.log('SW: Serving from cache:', event.request.url);
          return response;
        }
        
        // 尝试网络请求
        return fetch(event.request)
          .then((response) => {
            // 检查是否是有效响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 缓存成功的响应
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('SW: Network request failed:', error);
            
            // 如果是HTML页面请求失败，返回缓存的index.html
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // 其他请求失败，尝试返回缓存
            return caches.match(event.request);
          });
      })
  );
});

// 更新 Service Worker
self.addEventListener('activate', (event) => {
  console.log('SW: Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 处理消息
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});