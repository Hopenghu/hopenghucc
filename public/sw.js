// Service Worker for HOPENGHU.CC
// Version: 1.0.0
const CACHE_NAME = 'hopenghu-v1';
const RUNTIME_CACHE = 'hopenghu-runtime-v1';

// 需要預緩存的資源
const PRECACHE_URLS = [
  '/',
  '/footprints',
  '/ai-chat'
];

// 安裝 Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching static assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        return self.skipWaiting(); // 立即激活新的 Service Worker
      })
      .catch((error) => {
        console.error('[Service Worker] Install failed:', error);
      })
  );
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 刪除舊的緩存
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      return self.clients.claim(); // 立即控制所有頁面
    })
  );
});

// 攔截請求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳過非 GET 請求
  if (request.method !== 'GET') {
    return;
  }

  // 跳過 API 請求（需要實時數據）
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 跳過外部資源
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // 如果有緩存，返回緩存
        if (cachedResponse) {
          console.log('[Service Worker] Serving from cache:', url.pathname);
          return cachedResponse;
        }

        // 否則從網絡獲取
        console.log('[Service Worker] Fetching from network:', url.pathname);
        return fetch(request)
          .then((response) => {
            // 只緩存成功的響應
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 克隆響應（因為響應只能使用一次）
            const responseToCache = response.clone();

            // 將響應添加到緩存
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch failed:', error);
            // 如果是頁面請求且失敗，返回離線頁面
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/');
            }
            throw error;
          });
      })
  );
});

