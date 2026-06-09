"use strict";
const CACHE = "p31-qfactor-v2";
const SHELL = ["/qfactor/", "/qfactor/index.html", "/pwa/p31-tetra-icon.svg", "/pwa/manifest-qfactor.json"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  // Network-only for API — app-level localStorage handles offline state
  if (url.hostname === "api.p31ca.org") {
    e.respondWith(
      fetch(e.request).catch(() => new Response('{"offline":true}', {
        headers: { "Content-Type": "application/json" }
      }))
    );
    return;
  }

  // Stale-while-revalidate for shell — return cache immediately, refresh in background
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => cached || new Response("", { status: 503 }));
      return cached || net;
    })
  );
});
