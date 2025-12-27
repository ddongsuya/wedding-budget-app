// 커스텀 Service Worker - 푸시 알림 및 캐싱 처리
// Requirements: 2.1 - 정적 자산 캐싱 전략 개선

const CACHE_VERSION = 'v2'; // 버전 업데이트
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

// 캐시할 정적 자산 목록
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// 설치 이벤트 - 정적 자산 프리캐싱
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // 즉시 활성화
  self.skipWaiting();
});

// 활성화 이벤트 - 오래된 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // 모든 클라이언트 제어
  self.clients.claim();
});

// 푸시 알림 수신
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  let data = {
    title: '웨딩 플래너',
    body: '새로운 알림이 있습니다',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    data: { url: '/' },
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        data: payload.data || data.data,
      };
    }
  } catch (e) {
    console.error('Error parsing push data:', e);
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag || 'wedding-planner',
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: data.data,
    actions: [
      { action: 'open', title: '열기' },
      { action: 'close', title: '닫기' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열린 창이 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // 열린 창이 없으면 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// 알림 닫기 처리
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});


// 백그라운드 동기화 이벤트 (오프라인 데이터 동기화)
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);
  
  if (event.tag === 'sync-expenses') {
    event.waitUntil(syncExpenses());
  } else if (event.tag === 'sync-events') {
    event.waitUntil(syncEvents());
  }
});

// 오프라인 지출 데이터 동기화
async function syncExpenses() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const pendingExpenses = await cache.match('pending-expenses');
    
    if (pendingExpenses) {
      const expenses = await pendingExpenses.json();
      
      for (const expense of expenses) {
        try {
          await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expense),
            credentials: 'include',
          });
        } catch (error) {
          console.error('Failed to sync expense:', error);
        }
      }
      
      // 동기화 완료 후 대기 데이터 삭제
      await cache.delete('pending-expenses');
    }
  } catch (error) {
    console.error('Sync expenses failed:', error);
  }
}

// 오프라인 일정 데이터 동기화
async function syncEvents() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const pendingEvents = await cache.match('pending-events');
    
    if (pendingEvents) {
      const events = await pendingEvents.json();
      
      for (const event of events) {
        try {
          await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
            credentials: 'include',
          });
        } catch (error) {
          console.error('Failed to sync event:', error);
        }
      }
      
      // 동기화 완료 후 대기 데이터 삭제
      await cache.delete('pending-events');
    }
  } catch (error) {
    console.error('Sync events failed:', error);
  }
}

// 메시지 이벤트 - 클라이언트와 통신
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }
});
