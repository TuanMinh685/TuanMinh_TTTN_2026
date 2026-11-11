const CACHE_NAME = 'hunghau-it-support-v3';
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin) return;
  if (requestUrl.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok && (requestUrl.pathname.startsWith('/assets/') || APP_SHELL.includes(requestUrl.pathname))) {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseCopy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') return caches.match('/');
        return Response.error();
      })
  );
});

// =============================================================================
// WEB PUSH & HARDWARE VIBRATION NOTIFICATION EVENT HANDLERS
// =============================================================================

self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    data = { title: 'Thông báo tiến độ CSKH', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || '🔔 CSKH Công Ty Cổ Phần Lục Giác';
  const options = {
    body: data.body || 'Thiết bị của bạn đã hoàn tất sửa chữa và sẵn sàng bàn giao!',
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/icon-192.png',
    vibrate: data.vibrate || [300, 100, 300, 100, 450],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open_url', title: '🔍 Xem Sổ e-Warranty' }
    ],
    tag: data.tag || 'ticket-status-notification',
    renotify: true
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
