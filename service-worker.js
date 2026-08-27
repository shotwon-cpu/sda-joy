// service-worker.js
const CACHE_NAME = 'sabbath-cache-v3';

// 1. 설치 시 즉시 활성화
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2. 활성화 시 클라이언트 즉시 제어
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 네트워크 우선 요청 + 성공한 모든 응답을 로컬에 자동 영구 복사
self.addEventListener('fetch', (event) => {
  // GET 요청만 캐싱
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // 정상 응답이면 로컬 캐시 DB에 저장
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // 💡 오프라인(비행기 모드) 발생 시
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // 페이지 탐색(HTML) 요청일 경우 메인 페이지 캐시 반환
        if (event.request.mode === 'navigate') {
          return (
            (await caches.match('./index.html')) ||
            (await caches.match('./')) ||
            (await caches.match(event.request.url))
          );
        }
      })
  );
});
