const VERSION = 'v2.0.0';
const CACHE = `phos-${VERSION}`;
const ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k.startsWith('phos-') && k !== CACHE).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
  }
});

self.addEventListener('sync', (e) => {
  if (e.tag === 'sync-spoons') {
    e.waitUntil(flushQueueFromSW());
  }
});

async function flushQueueFromSW() {
  try {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('phos-store', 1);
      req.onupgradeneeded = (ev) => {
        const db = ev.target.result;
        if (!db.objectStoreNames.contains('queue')) db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const items = await new Promise((resolve) => {
      const tx = db.transaction('queue', 'readonly');
      const r = tx.objectStore('queue').getAll();
      r.onsuccess = () => resolve(r.result || []);
      r.onerror = () => resolve([]);
    });
    for (const item of items) {
      try {
        const resp = await fetch('https://k4-cage.trimtab-signal.workers.dev/api/spoon/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload),
        });
        if (resp.ok) {
          const tx = db.transaction('queue', 'readwrite');
          tx.objectStore('queue').delete(item.id);
        }
      } catch { break; }
    }
  } catch {}
}
