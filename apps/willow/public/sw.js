// Unregister any stale service workers from previous deployments.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.registration.unregister()
    .then(() => self.clients.matchAll())
    .then(clients => clients.forEach(client => (client as any).navigate?.(client.url)))
    .catch(() => {});
});
