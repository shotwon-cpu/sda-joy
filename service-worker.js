const CACHE_NAME = 'sabbath-app-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // 네트워크 요청 기본 전달 (온라인 최우선)
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
