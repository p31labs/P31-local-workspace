/// <reference lib="webworker" />

const PAIN_THRESHOLD = 7;

interface PainNotification {
  level: number;
  timestamp: number;
  source: string;
}

self.addEventListener('message', (e: MessageEvent) => {
  if (e.data?.type === 'PAIN_ALERT') {
    const alert = e.data as PainNotification;

    // Broadcast to all clients
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        client.postMessage({ type: 'PAIN_ALERT', ...alert });
      }
    });

    // If pain level exceeds threshold, force spoon drop notification
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

    // Store for persistence
    try {
      (self as any).caches?.open('hearth-alerts').then((cache: Cache) => {
        cache.put(
          'last-pain',
          new Response(JSON.stringify(alert), { headers: { 'Content-Type': 'application/json' } }),
        );
      });
    } catch { /* */ }
  }
});

self.addEventListener('push', (e: PushEvent) => {
  try {
    const data = e.data?.json() as PainNotification | undefined;
    if (!data) return;

    self.registration.showNotification('🧸 Hearth Alert', {
      body: data.level >= PAIN_THRESHOLD
        ? `High pain detected (${data.level}/10). Spoons reduced.`
        : `Pain check: level ${data.level}`,
      icon: '/icon-192.png',
      tag: 'hearth-push',
      data,
    });
  } catch { /* */ }
});

self.addEventListener('notificationclick', (e: NotificationEvent) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('/hearth')) {
          client.focus();
          return;
        }
      }
      self.clients.openWindow('/');
    }),
  );
});

export {};
