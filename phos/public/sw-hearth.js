const PAIN_THRESHOLD = 7;
const CACHE_NAME = 'hearth-shell-v1';
const SHELL_URLS = ['/', '/index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/_astro/')) {
    e.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
          cache.put(e.request, res.clone());
          return res;
        }))
      )
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});

function notifyClients(data) {
  self.clients.matchAll({ type: 'window' }).then((clients) => {
    for (const client of clients) {
      client.postMessage(data);
    }
  });
}

self.addEventListener('message', (e) => {
  if (e.data?.type === 'PAIN_ALERT') {
    const alert = e.data;
    notifyClients({ type: 'PAIN_ALERT', ...alert });
    if (alert.level >= PAIN_THRESHOLD) {
      self.registration.showNotification('⚠ Pain Alert', {
        body: `Pain level ${alert.level} detected. Spoon capacity reduced.`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'pain-alert',
        requireInteraction: true,
        data: alert,
      });
    }
    try {
      caches.open('hearth-alerts').then((cache) => {
        cache.put(
          new Request('/hearth-alerts/last-pain'),
          new Response(JSON.stringify(alert), { headers: { 'Content-Type': 'application/json' } })
        );
      });
    } catch { /* */ }
  }
});

self.addEventListener('sync', (e) => {
  if (e.tag === 'sync-actions') {
    e.waitUntil(
      (async () => {
        const clients = await self.clients.matchAll({ type: 'window' });
        for (const client of clients) {
          client.postMessage({ type: 'SYNC_ACTIONS' });
        }
      })()
    );
  }
});

self.addEventListener('push', (e) => {
  try {
    const data = e.data?.json();
    if (!data) return;
    const title = data.title || '🧸 Hearth Alert';
    const body = data.level !== undefined
      ? (data.level >= PAIN_THRESHOLD
        ? `High pain detected (${data.level}/10). Spoons reduced.`
        : `Pain check: level ${data.level}`)
      : (data.body || 'PHOS notification');
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'hearth-push',
      data: data.data || data,
      requireInteraction: data.requireInteraction || false,
    });
  } catch { /* */ }
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url)) {
          client.focus();
          return;
        }
      }
      self.clients.openWindow(url);
    })
  );
});
