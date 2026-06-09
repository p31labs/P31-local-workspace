export const setupSovereignPWA = (setStatus: (s: string) => void) => {
  if (typeof window === 'undefined') return;
  const manifest = {
    name: "P31 Sovereign OS", short_name: "P31-OS", display: "standalone", start_url: ".",
    background_color: "#050510", theme_color: "#00FF88",
    icons: [{
      src: "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpolygon points='50,5 95,25 95,75 50,95 5,75 5,25' fill='none' stroke='%2300FF88' stroke-width='5'/%3E%3C/svg%3E",
      sizes: "512x512", type: "image/svg+xml", purpose: "any maskable"
    }]
  };
  const link = document.createElement('link');
  link.rel = 'manifest';
  // Use a data URI instead of a Blob URL so the browser can always fetch it —
  // a Blob URL revoked too early (before the browser fetches the manifest) causes
  // a silent install failure. Data URIs have no lifetime issue.
  link.href = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(manifest))}`;
  document.head.appendChild(link);

  const swCode = `
    const CACHE_NAME = 'p31-os-v4';
    self.addEventListener('install', (e) => self.skipWaiting());
    self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));
    self.addEventListener('fetch', (e) => {
      if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;
      e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request).catch(() => new Response('Offline', {status: 503}))));
    });
  `;
  if ('serviceWorker' in navigator) {
    const swUrl = URL.createObjectURL(new Blob([swCode], { type: 'application/javascript' }));
    navigator.serviceWorker.register(swUrl)
      .then(() => { URL.revokeObjectURL(swUrl); setStatus('ACTIVE (OFFLINE READY)'); })
      .catch(() => { URL.revokeObjectURL(swUrl); setStatus('BLOCKED BY SANDBOX'); });
  } else setStatus('UNSUPPORTED');
};
