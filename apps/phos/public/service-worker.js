// P31 Service Worker — Offline-First Device Mesh
// P31 Labs, Inc. | EIN 42-1888158 | AGPL-3.0
//
// Cache strategy: Cache-First for static assets, Network-First for API.
// Installed once, works offline for all previously visited surfaces.

const CACHE_NAME = 'p31-phos-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/documents',
  '/artifact',
  '/multiplayer',
  '/verify',
  '/marge',
  '/bob',
  '/cognitive',
  '/forge',
  '/justice',
  '/vibe',
  '/cage',
  '/onboarding',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API requests: Network-first
  if (url.pathname.startsWith('/api/') || url.hostname.endsWith('workers.dev')) {
    return;
  }

  // Static assets: Cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      }).catch(() => {
        // Offline fallback: return cached index page for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});

// Listen for skip-waiting from new SW version
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
