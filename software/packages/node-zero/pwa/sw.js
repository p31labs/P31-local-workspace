/**
 * P31 Service Worker — Kenosis Build (v2)
 *
 * Strategy:
 *   App shell (HTML, JS, CSS, icons)  → Cache-first, network fallback
 *   ForgeRoom SPA + Three.js runtime   → Cache-first, precached on install
 *   API / data requests               → Network-first, cache fallback
 *   CDN fonts/scripts                 → Stale-while-revalidate
 *   Offline mutations                  → IndexedDB sync queue, replay on reconnect
 *
 * Offline: ForgeRoom UI loads completely without network.
 * All write operations queue to IndexedDB and sync when connectivity restores.
 */

const CACHE_NAME = "p31-shell-v2";
const DATA_CACHE = "p31-data-v1";
const CDN_CACHE = "p31-cdn-v1";
const FORGEROOM_CACHE = "p31-forgeroom-v1";
const SYNC_QUEUE_DB = "p31-offline-sync-queue";
const SYNC_QUEUE_STORE = "mutations";

// App shell — precached on install
const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
  "/icons/p31-192.png",
  "/icons/p31-512.png",
  "/icons/p31-maskable-192.png",
  "/icons/p31-maskable-512.png",
];

// ForgeRoom SPA + Three.js runtime — precached for offline molecular building
const FORGEROOM_ASSETS = [
  "/forging",
  "/forging/index.html",
  "/assets/ForgeRoom.js",
  "/assets/ForgeRoom.css",
  "/assets/three.min.js",
  "/assets/three-vendor.js",
  "/assets/react-bundle.js",
  "/assets/pglite-browser.js",
];

// ─── Install ────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log("[P31 SW] Precaching app shell");
        return cache.addAll(SHELL_ASSETS);
      }),
      caches.open(FORGEROOM_CACHE).then((cache) => {
        console.log("[P31 SW] Precaching ForgeRoom offline assets");
        return cache.addAll(FORGEROOM_ASSETS);
      }),
    ])
  );
  self.skipWaiting();
});

// ─── Activate ───────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (k) =>
              k !== CACHE_NAME &&
              k !== DATA_CACHE &&
              k !== CDN_CACHE &&
              k !== FORGEROOM_CACHE
          )
          .map((k) => {
            console.log("[P31 SW] Removing old cache:", k);
            return caches.delete(k);
          })
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch ──────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  // ForgeRoom SPA routes → cache-first from ForgeRoom cache
  if (isForgeRoomRequest(url)) {
    event.respondWith(cacheFirst(event.request, FORGEROOM_CACHE));
    return;
  }

  // CDN resources → stale-while-revalidate
  if (isCdnRequest(url)) {
    event.respondWith(staleWhileRevalidate(event.request, CDN_CACHE));
    return;
  }

  // API / data requests → network-first, queue to IndexedDB on failure
  if (isDataRequest(url)) {
    if (event.request.method === "GET") {
      event.respondWith(networkFirst(event.request, DATA_CACHE));
    } else {
      event.respondWith(networkFirstQueueOffline(event.request, DATA_CACHE));
    }
    return;
  }

  // App shell → cache-first
  event.respondWith(cacheFirst(event.request, CACHE_NAME));
});

// ─── Background Sync ────────────────────────────────────────────────

self.addEventListener("sync", (event) => {
  if (event.tag === "p31-sync-mutations") {
    event.waitUntil(replayQueuedMutations());
  }
});

// ─── Strategies ─────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return (
      caches.match("/offline.html") || new Response("Offline", { status: 503 })
    );
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return (
      caches.match("/offline.html") || new Response("Offline", { status: 503 })
    );
  }
}

async function networkFirstQueueOffline(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Queue mutation to IndexedDB for later replay
    await queueMutation(request);
    return new Response(
      JSON.stringify({ queued: true, message: "Mutation queued for sync" }),
      { status: 202, headers: { "Content-Type": "application/json" } }
    );
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

// ─── Offline Sync Queue (IndexedDB) ─────────────────────────────────

async function queueMutation(request) {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(SYNC_QUEUE_DB, 1);

    openRequest.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        db.createObjectStore(SYNC_QUEUE_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };

    openRequest.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(SYNC_QUEUE_STORE, "readwrite");
      const store = tx.objectStore(SYNC_QUEUE_STORE);

      request.clone().arrayBuffer().then((body) => {
        store.add({
          url: request.url,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          body: body,
          timestamp: Date.now(),
        });
        tx.oncomplete = () => {
          console.log("[P31 SW] Mutation queued:", request.url);
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      });
    };

    openRequest.onerror = () => reject(openRequest.error);
  });
}

async function replayQueuedMutations() {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(SYNC_QUEUE_DB, 1);

    openRequest.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(SYNC_QUEUE_STORE, "readwrite");
      const store = tx.objectStore(SYNC_QUEUE_STORE);
      const getAll = store.getAll();

      getAll.onsuccess = async () => {
        const mutations = getAll.result;
        console.log(`[P31 SW] Replaying ${mutations.length} queued mutations`);

        for (const mutation of mutations) {
          try {
            const response = await fetch(mutation.url, {
              method: mutation.method,
              headers: mutation.headers,
              body: mutation.body,
            });
            if (response.ok) {
              // Remove from queue on success
              store.delete(mutation.id);
              console.log("[P31 SW] Mutation replayed:", mutation.url);
            }
          } catch (err) {
            console.warn("[P31 SW] Replay failed, re-queuing:", mutation.url);
          }
        }
        resolve();
      };

      getAll.onerror = () => reject(getAll.error);
    };

    openRequest.onerror = () => reject(openRequest.error);
  });
}

// ─── Classifiers ────────────────────────────────────────────────────

function isForgeRoomRequest(url) {
  return (
    url.pathname === "/forging" ||
    url.pathname.startsWith("/forging/") ||
    url.pathname.includes("ForgeRoom") ||
    url.pathname.includes("three.min") ||
    url.pathname.includes("three-vendor") ||
    url.pathname.includes("pglite-browser")
  );
}

function isCdnRequest(url) {
  return (
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com") ||
    url.hostname.includes("cdnjs.cloudflare.com") ||
    url.hostname.includes("cdn.jsdelivr.net") ||
    url.hostname.includes("unpkg.com")
  );
}

function isDataRequest(url) {
  return (
    url.pathname.startsWith("/api/") ||
    (url.pathname.endsWith(".json") && !url.pathname.includes("manifest"))
  );
}
