// P31 Warehouse Service Worker
// Offline-first cache strategy for warehouse scanner
// Version: 2.0.0

const CACHE_NAME = 'p31-warehouse-v2';
const STATIC_ASSETS = [
  '/warehouse',
  '/warehouse-manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install: Cache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Cache-first for static, network-first for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls: Network first, fallback to queue
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful responses
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Try cache, or return offline response
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return new Response(
              JSON.stringify({ offline: true, queued: true }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Static assets: Cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        // Cache new static assets
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

// Background sync for queued items
self.addEventListener('sync', (event) => {
  if (event.tag === 'warehouse-sync') {
    event.waitUntil(syncPendingItems());
  }
});

async function syncPendingItems() {
  // Triggered when connectivity returns
  // The app handles the actual sync logic; this just wakes it up
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_NOW' });
  });
}

// Push notifications (future: alert on sync completion)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Warehouse Update', {
      body: data.body || 'Sync completed',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    })
  );
});
