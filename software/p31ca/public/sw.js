/* P31 Constellation Hub Service Worker
   Caches the app shell for offline access.

   Strategy:
   - Network-first for HTML (fresh content when online)
   - Cache-first for static assets (CSS, JS, fonts, icons)
   - Stale-while-revalidate for API calls (background refresh)

   Cache naming: p31-hub-[type]-[version]
   Bumped on deploy via build process or manually.
*/
"use strict";

const CACHE_VERSION = "v2";
const CACHE_SHELL = `p31-hub-shell-${CACHE_VERSION}`;
const CACHE_ASSETS = `p31-hub-assets-${CACHE_VERSION}`;
const CACHE_IMAGES = `p31-hub-images-${CACHE_VERSION}`;
const CACHE_API = `p31-hub-api-${CACHE_VERSION}`;

// Core app shell - must be available offline
const SHELL_URLS = [
  "/",
  "/index.html",
  "/p31-style.css",
  "/p31-tailwind-extend.js",
  "/lib/p31-subject-prefs.js",
  "/lib/p31-theme-engine.mjs",
  "/offline.html" // Fallback page
];

// Static assets - cached on install
const ASSET_URLS = [
  "/favicon.svg",
  "/icons/p31-192.png",
  "/icons/p31-512.png"
];

// Install: cache shell and critical assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_SHELL)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => caches.open(CACHE_ASSETS))
      .then((cache) => cache.addAll(ASSET_URLS))
      .then(() => self.skipWaiting())
      .catch((err) => console.error("[P31 SW] Install failed:", err))
  );
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k.startsWith("p31-hub-") && !k.includes(CACHE_VERSION))
          .map((k) => {
            console.log("[P31 SW] Deleting old cache:", k);
            return caches.delete(k);
          })
      ))
      .then(() => self.clients.claim())
      .then(() => {
        // Notify all clients that SW is active
        return self.clients.matchAll({ type: "window" }).then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: "P31_SW_ACTIVATED", version: CACHE_VERSION });
          });
        });
      })
  );
});

// Fetch handler with different strategies per resource type
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip external origins
  if (url.origin !== self.location.origin) return;

  // Skip WebSocket upgrades
  if (request.headers.get("upgrade") === "websocket") return;

  // Strategy: Network-first for HTML documents (fresh content)
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(networkFirst(request, CACHE_SHELL));
    return;
  }

  // Strategy: Cache-first for CSS/JS (static assets)
  if (["style", "script", "worker"].includes(request.destination)) {
    event.respondWith(cacheFirst(request, CACHE_ASSETS));
    return;
  }

  // Strategy: Cache-first for fonts
  if (request.destination === "font") {
    event.respondWith(cacheFirst(request, CACHE_ASSETS));
    return;
  }

  // Strategy: Stale-while-revalidate for images
  if (["image", "icon"].includes(request.destination) || url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_IMAGES));
    return;
  }

  // Strategy: Network-first for API calls (with short cache backup)
  if (url.pathname.startsWith("/api/") || url.pathname.endsWith(".json")) {
    event.respondWith(networkFirst(request, CACHE_API));
    return;
  }
});

// Network-first strategy: try network, fall back to cache
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // If HTML request and no cache, show offline page
    if (request.mode === "navigate") {
      return caches.match("/offline.html");
    }

    throw error;
  }
}

// Cache-first strategy: serve from cache, update in background
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return a fallback if available
    if (request.destination === "image") {
      return caches.match("/icons/p31-192.png");
    }
    throw error;
  }
}

// Stale-while-revalidate: serve cache immediately, refresh in background
async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);

  const networkFetch = fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(cacheName);
      cache.then((c) => c.put(request, response.clone()));
    }
    return response;
  }).catch(() => null);

  // Return cached immediately, or wait for network if no cache
  return cached || networkFetch;
}

// Message handling from client
self.addEventListener("message", (event) => {
  if (!event.data) return;

  switch (event.data.type) {
    case "P31_SW_SKIP_WAITING":
      self.skipWaiting();
      break;

    case "P31_SW_CLEAR_CACHE":
      event.waitUntil(
        caches.keys().then((keys) =>
          Promise.all(keys.filter((k) => k.startsWith("p31-hub-")).map((k) => caches.delete(k)))
        ).then(() => {
          event.source.postMessage({ type: "P31_SW_CACHE_CLEARED" });
        })
      );
      break;

    case "P31_SW_CHECK_UPDATE":
      event.waitUntil(
        self.registration.update().then(() => {
          event.source.postMessage({ type: "P31_SW_UPDATE_CHECKED" });
        })
      );
      break;
  }
});

// Background sync for offline actions (if supported)
self.addEventListener("sync", (event) => {
  if (event.tag === "p31-sync") {
    event.waitUntil(
      // Could sync telemetry, preferences, etc.
      Promise.resolve()
    );
  }
});

// Push notification handling (placeholder for future)
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "P31 Constellation", {
      body: data.body || "",
      icon: "/icons/p31-192.png",
      badge: "/icons/p31-72.png",
      tag: data.tag || "p31-notification",
      data: data.url || "/"
    })
  );
});

// Notification click handling
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.notification.data || "/")
  );
});
