// service-worker.js
const CACHE_NAME = 'sabbath-cache-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// 1. 서비스 워커 설치 시 핵심 파일들을 스마트폰 로컬 저장소에 자동 저장
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. 이전 구버전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 오프라인(비행기 모드) 요청 시 로컬 저장소에서 즉시 화면 제공 (네트워크 우선, 실패 시 캐시)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // 온라인일 때 최신 버전을 캐시에 자동 업데이트
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // 💡 오프라인(비행기 모드)일 때 캐시된 화면 반환
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // 페이지 이동(navigation) 요청일 경우 메인 index.html 반환
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./');
        }
      })
  );
});
