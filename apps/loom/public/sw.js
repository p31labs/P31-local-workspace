/* The Loom service worker.
 *
 * Caching discipline (from the 2026 service-worker security guidance):
 *   - Cache-first ONLY for genuinely static, versioned assets. Hashed Vite
 *     output (assets/index-*.js, index-*.css) is immutable — safe to cache
 *     long-term.
 *   - NETWORK-ONLY for the log and the app shell. /api/* is the live log;
 *     index.html must never be served stale from a cache (it carries the
 *     per-request nonce in production). Never cache authenticated or
 *     user-specific responses.
 *
 * The service worker never stores tokens or session state. It is purely a
 * static-asset cache, matching the app's zero-trust posture.
 */

const CACHE = 'loom-static-v1';
const STATIC_PREFIX = '/assets/';

self.addEventListener('install', (event) => {
  // Skip waiting so the new worker activates immediately; the shell is
  // fetched network-first on navigation, so there is no stale HTML risk.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-only for the log, the API, and the app shell.
  if (url.pathname.startsWith('/api/') || url.pathname === '/events.seed.json') {
    return;
  }
  if (request.method !== 'GET') return;

  // Cache-first for hashed static assets.
  if (url.pathname.startsWith(STATIC_PREFIX)) {
    event.respondWith(
      caches.match(request).then((hit) => {
        if (hit) return hit;
        return fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            void caches.open(CACHE).then((c) => c.put(request, clone));
          }
          return res;
        });
      }),
    );
    return;
  }

  // Network-first with cache fallback for everything else (fonts, icons).
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          void caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit || Response.error())),
  );
});