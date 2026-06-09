/* P31 universal service worker.
   Source of truth: pwa/sw.js. Mirrored to each PWA-installable surface
   (cognitive-passport/, demos/, social-cards/) by scripts/build-pwa.mjs.
   Verified by scripts/verify-pwa.mjs.

   Scope: this SW caches the document that registered it + its declared
   companions. It uses a network-first strategy so updates propagate the
   instant the device is online; cache acts purely as offline fallback.

   No telemetry, no analytics, no remote logging. P31 Labs · CC-BY 4.0.
*/
"use strict";

/* Bumped on every meaningful pwa/* change so old caches are evicted.
   build-pwa.mjs may rewrite the literal value below; keep the syntax stable. */
const CACHE_NAME = "p31-pwa-v1";

/* Companions are paths the SW should pre-cache on install relative to the
   surface it serves. The shared pwa script + icon are universal; each app
   adds its own document via the URL it was loaded from. */
const COMPANIONS = [
  "/pwa/p31-tetra-icon.svg",
  "/pwa/p31-pwa.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // pre-cache the document scope + companions; failures don't block install
      const here = new URL(self.registration.scope);
      const docs = [here.pathname, here.pathname + "index.html"];
      return Promise.allSettled(
        [...docs, ...COMPANIONS].map((u) => cache.add(u).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Only handle GET; never intercept POST or non-http schemes.
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // network-first with cache fallback: keeps content fresh, works offline.
  event.respondWith(
    fetch(req).then((res) => {
      // Stash a copy in cache for future offline use (clone first).
      const copy = res.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(req, copy).catch(() => {});
      });
      return res;
    }).catch(() => caches.match(req).then((cached) => cached || caches.match(self.registration.scope)))
  );
});

/* Operator-summoned messages (e.g. "force-refresh"). No data ever leaves the device. */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "P31_PWA_SKIP_WAITING") {
    self.skipWaiting();
  }
});
