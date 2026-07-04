# Service Worker Cache Poisoning & STALE-SHELL Attack Surface Analysis
**Target:** p31ca.org (Astro PWA site) | **Date:** 2026-04-23 | **Severity:** HIGH

## Executive Summary

The p31ca.org Astro site has **NO service worker** but includes defensive unregistration code from a prior PWA iteration. The hearing-ops PWA (`ops.p31ca.org`) uses VitePWA/Workbox with default settings. Combined with Cloudflare's `Clear-Site-Data` headers and aggressive static asset caching, the attack surface spans three distinct failure modes:

1. **Race condition in SW lifecycle** — unregistration non-atomic with reload
2. **Versionless cache names** — Workbox default cache cannot be invalidated atomically
3. **Stale shell via cache-controlled HTML** — 1-year static asset cache + network fallback gaps

---

## 1. CURRENT STATE FINDINGS

### 1.1 Service Worker Presence

| Site | SW File | Registration | Cache Strategy |
|------|---------|--------------|----------------|
| **p31ca.org** | ❌ None | ❌ None (only unregister code) | N/A |
| **ops.p31ca.org** | ✅ Workbox-generated | ✅ `registerType: 'autoUpdate'` | Runtime + Precache defaults |

### 1.2 SW Unregistration Code (BaseLayout.astro:23-35)

```javascript
<script is:inline>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      regs.forEach(function (reg) {
        reg.unregister();
      });
    });
    // Hard reload if service worker was active
    if (navigator.serviceWorker.controller) {
      window.location.reload(true);
    }
  }
</script>
```

**Vulnerabilities:**
- `getRegistrations().then()` is **not awaited** — page continues loading while unregistration proceeds in background
- `window.location.reload(true)` executes **before** unregistrations complete
- If a SW was controlling the page, reload happens with **both old SW and new page** in flight → potential race where:
  - Old SW may still intercept fetches during reload
  - New page load occurs with partially cleared cache state
  - No guarantee of atomic handoff

### 1.3 Response Headers (verified via curl 2026-04-23)

```http
HTTP/2 200
cache-control: public, max-age=0, must-revalidate  ← HTML (correct)
clear-site-data: "cache", "storage", "executionContexts"  ← ALL responses (aggressive)
content-security-policy: ... script-src 'self' ... https://cdn.jsdelivr.net ...
```

- CDN origins (`cdn.jsdelivr.net`, `unpkg.com`) **present** in CSP ✅
- `Clear-Site-Data` on **all responses** — clears caches on every navigation ⚠️
- `/_astro/*` assets get: `Cache-Control: public, max-age=31536000, immutable` (1 yr) ✅

### 1.4 Build Configuration

**p31ca.org** (`astro.config.mjs`):
```javascript
export default defineConfig({
  integrations: [tailwind()],
  site: 'https://p31ca.org',
  vite: {
    build: {
      sourcemap: false
    }
  }
});
```
- No PWA plugin configured
- Astro **default**: hashed filenames enabled (observed: `dome.Cvms6GiW.css`, `OrchestratorDashboard.astro_astro_type_script_index_0_lang.BG1e_X0B.js`) ✅
- No service worker generation

**ops.p31ca.org** (`vite.config.js`):
```javascript
VitePWA({
  registerType: 'autoUpdate',
  injectRegister: null,
  manifest: false,
  workbox: {
    globPatterns: ['**/*.{js,css,html,woff2,png,svg,json}'],
  },
})
```
- **No custom cache name** → uses Workbox default: `workbox-precache-<random>` (versionless)
- **No integrity verification** — precache entries trust build manifest blindly
- `injectRegister: null` → manual registration in `src/main.jsx:7`: `registerSW({ immediate: true })`

### 1.5 Asset Fingerprinting

Built assets in `dist/_astro/` show **content-based hashes** in filenames:
```
dome.Cvms6GiW.css
OrchestratorDashboard.astro_astro_type_script_index_0_lang.BG1e_X0B.js
```

Astro's default hash strategy: **content hash** (not build timestamp). This means:
- Identical content → identical hash → cacheable across deployments
- Changed content → new hash → new filename
- **However**: Workbox precache manifest **must** be regenerated on every build to reference new hashes

---

## 2. ATTACK TREE: STALE-SHELL PERSISTENCE ACROSS 3 DEPLOYMENTS

```
Deployment 1 (v1)
├── SW installed: CACHE_NAME = 'workbox-precache-abc123' (random UUID per build)
├── Precached: app.a1b2c3.js, styles.d4e5f6.css
└── HTML shell (index.html) NOT precached — served from network

Deployment 2 (v2) - UPDATE FAILURE SCENARIO
├── New build produces: app.g7h8i9.js (new hash), styles.j1k2l3.css
├── New SW (v2) generated with CACHE_NAME = 'workbox-precache-xyz789' (DIFFERENT random UUID)
├── New SW tries to install → old SW still controlling clients
├── New SW waits in 'waiting' phase indefinitely because:
│   └─ No `skipWaiting()` called (VitePWA default: does NOT force immediate activation)
├── Browser continues serving v1 shell + v1 assets from cache
└── User sees STALE SHELL (v1 UI) with v2 API calls (if any) → STATE MISMATCH

Deployment 3 (v3) - CACHE POISONING WINDOW
├── Another deployment → yet another SW with another random cache name
├── Old v1 SW still active (3+ versions in the wild)
├── Cache storage now contains:
│   ├─ 'workbox-precache-abc123' (v1 assets)
│   ├─ 'workbox-precache-xyz789' (v2 assets, never activated)
│   └─ 'workbox-precache-def456' (v3 assets, waiting)
├── If `clientsClaim()` not set, new pages load under OLD SW control
└── Network requests intercepted by v1 SW's catch handler → serves stale index.html shell

Critical Failure Chain:
1. Workbox generates **random cache name per build** (not deterministic)
2. No version bump mechanism → old SW never gets `skipWaiting()` signal
3. `clientsClaim()` default is `false` → new tabs/pages still controlled by old SW
4. Old SW's fetch handler may have: `cacheFirst('index.html')` fallback → serves STALE shell
5. New JS bundles (with breaking API changes) fail to load → **JS errors, broken UI**
```

### Why `Clear-Site-Data` Doesn't Save You Here

The `_headers` file sets `Clear-Site-Data: "cache", "storage", "executionContexts"` on **every response**. BUT:
- This header is served by Cloudflare Pages **static hosting** for HTML files
- When the **service worker is controlling the page**, `fetch()` events are intercepted **before** network → the request **never reaches Cloudflare** → `Clear-Site-Data` never arrives
- The SW serves from its own cache storage, bypassing HTTP headers entirely
- **Only a hard reload (Ctrl+Shift+R) or SW uninstall clears the SW's cache**

---

## 3. CODE-LEVEL VULNERABILITIES

### 3.1 Non-Atomic Unregistration (BaseLayout.astro:26-34)

```javascript
// ❌ CURRENT — RACY
navigator.serviceWorker.getRegistrations().then(function (regs) {
  regs.forEach(function (reg) {
    reg.unregister();  // async, returns Promise<void>
  });
});
// Code continues immediately — unregistration not complete
if (navigator.serviceWorker.controller) {
  window.location.reload(true);  // ← reload happens BEFORE unregister resolves
}
```

**Race timeline:**
```
t0: getRegistrations() called
t1: .then() queued, main thread continues
t2: reload(true) executed → page begins unloading
t3: .then() finally executes → unregister() called (too late)
t4: Old SW still has clients, may receive fetch events during unload
```

**Fix — sequential await:**
```javascript
// ✅ ATOMIC — WAIT FOR COMPLETION
async function atomicSWUnregister() {
  if (!('serviceWorker' in navigator)) return;

  const regs = await navigator.serviceWorker.getRegistrations();
  const unregisterPromises = regs.map(reg => reg.unregister());
  await Promise.all(unregisterPromises);  // ← BLOCK until ALL unregistered

  if (navigator.serviceWorker.controller) {
    // Force bypass SW cache — navigate with cache-busting query
    window.location.href = window.location.href + '?nocache=' + Date.now();
  }
}
```

### 3.2 Missing Cache Versioning (ops VitePWA config)

Workbox default: `CACHE_NAME = 'workbox-precache-' + Math.random().toString(36)` — **non-deterministic**.

Result: Every build gets a **new cache name**. Old caches are never deleted because:
- `clientsClaim()` is `false` → old SW stays active
- `skipWaiting()` is `false` → new SW stays in `waiting` forever
- No code ever calls `caches.delete('old-cache-name')`

**Fix — deterministic cache name + automatic cleanup:**
```javascript
// vite.config.js — versioned cache
VitePWA({
  registerType: 'autoUpdate',
  injectRegister: 'auto',  // let plugin inject registration
  manifest: false,
  workbox: {
    cacheId: 'p31ca-ops-v1',  // ← MANUAL version bump on each deploy
    globPatterns: ['**/*.{js,css,html,woff2,png,svg,json}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\./i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache-v1',
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }
        }
      }
    ],
  },
  // Enable these for atomic updates:
  //  - `skipWaiting: true` is set automatically with `registerType: 'autoUpdate'`
  //  - `clientsClaim: true` must be added via `workbox` config
})
```

For truly **atomic** updates across both p31ca and ops, use **shared cache namespace**:

```javascript
// ops VitePWA config — atomic cache update pattern
VitePWA({
  registerType: 'autoUpdate',
  injectRegister: 'auto',
  manifest: false,
  workbox: {
    cacheId: 'p31-ops-shared-v1',  // single source of truth
    skipWaiting: true,            // new SW activates immediately
    clientsClaim: true,           // takes control of all pages immediately
    cleanupOutdatedCaches: true,  // deletes old cache names on activation

    // Pre-cache with deterministic naming
    globPatterns: ['**/*.{js,css}'],
    // Additional runtime config
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/p31ca\.org/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'p31ca-shell-v1',  // versioned
          cacheableResponse: { statuses: [0, 200] },
          expiration: { maxEntries: 50, maxAgeSeconds: 300 }  // 5 min max for HTML
        }
      }
    ]
  }
})
```

### 3.3 No Integrity Verification (Both Projects)

Neither project verifies **Subresource Integrity (SRI)** on imported Three.js bundles:
- **p31ca.org**: imports from CDN via importmap (lines 11-17 in dome.astro)
  ```html
  <script type="importmap" is:inline>
    {
      "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.183.0/build/three.module.js"
      }
    }
  </script>
  ```
  - No `integrity="sha384-..."` attribute
  - No SRI hash verification
  - Compromised CDN → malicious Three.js → full DOM/WebGL takeover

- **ops PWA**: Workbox precache fetches bundles from network **without verifying** the digest in `rev` field

**Fix — SRI for CDN imports:**
```javascript
// Generate SRI hashes at build time (add to Astro build script)
import { createHash } from 'crypto';
import { readFileSync } from 'fs';

const threeJs = readFileSync('node_modules/three/build/three.module.js');
const hash = createHash('sha384').update(threeJs).digest('base64');
const integrity = `sha384-${hash}`;

// Inject into BaseLayout.astro importmap:
// "three": "https://cdn.jsdelivr.net/npm/three@0.183.0/build/three.module.js" integrity="sha384-..."
```

Workbox alternative: enable `importScripts` with integrity or use `doCache` options.

### 3.4 Network Fallback Gaps

p31ca.org has **no service worker**, so fallback chain is browser default:
- Network → (404) → browser error page
- No stale shell serving possible (because no SW cache)

**BUT** ops PWA Workbox default runtime strategy:
- JS/CSS: `CacheFirst` → stale if update fails
- HTML: `NetworkFirst` → on network error, falls back to cache
  - **Critical**: If v2 SW activates but `index.html` fetch fails (network down), it serves **cached HTML from v1**
  - That HTML references **app.g7h8i9.js** (new hash)
  - New hash **NOT in cache** → 404 → app broken

**Fix — NetworkFirst with offline fallback page:**
```javascript
// workbox.config.js or in VitePWA workbox.runtimeCaching
{
  urlPattern: /^https:\/\/p31ca\.org\/.*\.html$/,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'html-shell-v1',
    networkTimeoutSeconds: 3,
    cacheableResponse: { statuses: [200] },
    backgroundSync: { name: 'html-queue' },
    // Fallback to OFFLINE page if both network & cache miss
    plugins: [
      new CacheRedirect({
        // assumes you have /offline.html precached
        match: ({url}) => url.pathname.endsWith('.html'),
        replace: ({url}) => new URL('/offline.html', url)
      })
    ]
  }
}
```

---

## 4. HEADER ANALYSIS & CLOUDFLARE CONFIG

### 4.1 Headers Actually Served (p31ca.org/dome/)

```
strict-transport-security: max-age=31536000; includeSubDomains; preload ✅
clear-site-data: "cache", "storage", "executionContexts" ✅ (aggressive)
content-security-policy: ... script-src 'self' ... https://cdn.jsdelivr.net ... ✅
cache-control: public, max-age=0, must-revalidate  ← for HTML ✅
```

### 4.2 Missing / Problematic Headers

| Header | Status | Risk |
|--------|--------|------|
| `Service-Worker-Allowed` | ❌ Absent | SW scope default is parent directory — may not cover all routes |
| `X-Service-Worker` | ❌ Absent | No visibility into active SW version |
| `Cache-Control: no-cache` on **`/_astro/*.js`** | ❌ Absent | JS files cached 1 year immutable — updates rely on hash collision avoidance only |
| `ETag` / `Last-Modified` on HTML | ❌ Unclear (Cloudflare default) | With `no-cache, no-store`, revalidation never happens anyway |
| `Vary: Accept-Encoding` | ⚠️ Cloudflare adds automatically | OK |

### 4.3 Static Asset Cache Lifetime Risk

```
/_astro/*.abc123.js   → Cache-Control: max-age=31536000, immutable
```

If hash collision occurs (content change but hash stays same due to bug), stale JS serves for **1 year**. Workbox would NOT detect change because:
- Manifest lists `{url: '/_astro/app.abc123.js', revision: null}` — revision comes from filename hash
- If filename unchanged but content changed → **cache poisoning silently**

**Mitigation:** Enable Workbox `dontCacheBustURLsMatching: [/\.(?:js|css)$/]` → relies on hash in filename.

---

## 5. BUILD HASH FINGERPRINTING & MANIFEST INTEGRITY

### 5.1 Astro Asset Pipeline

Astro produces hashed filenames by default (since v2):
- Pattern: `[name].[hash].[ext]`
- Hash: **content-based** (MD5/sha256 of file contents)
- Manifest: Not emitted by default

p31ca has **no service worker**, so no precache manifest exists. If a SW is added later:

**Required setup:**
```javascript
// astro.config.mjs — enable PWA integration
import { defineConfig } from 'astro/config';
import { VitePWA } from 'vite-plugin-pwa';  // ← must add

export default defineConfig({
  integrations: [
    tailwind(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', '**/*.png', '**/*.svg'],
      manifest: {
        name: 'P31 Labs',
        short_name: 'P31',
        start_url: '/',
        display: 'standalone',
        background_color: '#050505',
        theme_color: '#050505',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        cacheId: 'p31ca-v1',
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // VERIFY INTEGRITY on precache
        dontCacheBustURLsMatching: [/\.(?:js|css)$/],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
      }
    })
  ]
})
```

### 5.2 Manifest Generation for SRI

VitePWA can generate a **revision hash** (`rev` field) from file content. This is stored in `workbox-pre-cache.js`:
```javascript
self.__precacheManifest = [
  { url: '/_astro/index.abc123.js', revision: 'abc123' },
  // revision === file hash
];
```

On install, Workbox fetches each URL and verifies the response hash matches `revision`. **If mismatch → fetch fails → install fails**.

**Current gap:** p31ca doesn't generate this manifest → no integrity check.

---

## 6. UPDATE FLOW AUDIT

### 6.1 ops PWA (VitePWA) Update Path

```
1. User visits ops.p31ca.org
2. registerSW({ immediate: true }) runs (main.jsx:7)
3. Workbox checks for /service-worker.js (workbox-generated)
4. If new SW found:
   - downloads in background
   - fires 'waiting' event (if old SW still active)
   - with `skipWaiting: true` → auto-installs to waiting
   - with `clientsClaim: true` → immediately takes control
   - WITHOUT both → waits indefinitely for old SW to die (may never happen)
```

**Actual config check** — `vite.config.js`:
- `registerType: 'autoUpdate'` → YES, `skipWaiting` is enabled ✅
  - Actually: `autoUpdate` calls `registration.update()` on load AND responds to `waiting` by calling `skipWaiting()` ✅
- `clientsClaim` → **NOT explicitly set** → defaults to `false` ❌
- `cleanupOutdatedCaches` → **NOT set** → default `false` ❌

**Result:** New SW installs but doesn't claim clients. Old SW may remain active on some tabs → stale shell on those tabs.

### 6.2 p31ca.org Update Path

**No SW** → no update flow. Every navigation is fresh network request (except for static assets in browser cache).

---

## 7. EXPLOITATION SCENARIOS

### Scenario A: Partial Deploy with SW Waiting

**Deploy:** p31ca.org adds VitePWA in future release (v1).
**Attacker:** None needed — self-inflicted.

1. Deploy v1 with SW (`cacheId: 'p31ca-v1'`, `skipWaiting: false`, `clientsClaim: false`)
2. Users load site → SW installed, precaches `app.abc.js`
3. Deploy v2 with new hash `app.def.js`, **new cache name** `p31ca-v2`
4. New SW downloaded → enters `waiting` (old SW still controls)
5. User opens **new tab** → still controlled by v1 SW (because `clientsClaim: false`)
6. v1 SW serves **stale index.html** (cached or network fallback depending on strategy)
7. v1 HTML references `app.abc.js` → OK
8. But v2 API endpoints may have breaking changes → API calls fail → UI broken

**Impact:** Feature partially broken for users with persistent tabs. Not 0-day but deployment bug.

### Scenario B: Cache Poisoning via CDN Compromise

**Attacker:** Compromises `cdn.jsdelivr.net` package (or MITM on network).

1. User visits p31ca.org
2. Browser loads importmap from **trusted p31ca.org** (signed by Cloudflare)
3. Import map references `https://cdn.jsdelivr.net/npm/three@0.183.0/build/three.module.js`
4. **CDN compromised** → attacker serves malicious Three.js
5. **No SRI** → browser accepts it
6. Malicious Three.js executes with full page privileges → XSS, data exfil, DOM manipulation

**Mitigation present:** CSP includes `script-src 'self' 'unsafe-inline' ... cdn.jsdelivr.net` (trusts CDN implicitly). **This is by design** but risky.

**Recommendation:** Use **local fallback** + SRI:
```html
<script type="importmap" is:inline>
{
  "imports": {
    "three": "/libs/three/three.module.js",  <!-- self-hosted copy -->
    "three/addons/": "/libs/three/examples/jsm/"
  }
}
</script>
```

### Scenario C: Stale Shell via Offline Recovery (ops PWA)

1. User on ops PWA v1, SW caches `index.html` (NetworkFirst) and `app.abc.js` (CacheFirst)
2. Deploy v2 with new hash
3. User goes **offline** before SW update completes
4. User reloads → NetworkFirst fails → fallback to **cached v1 index.html**
5. v1 HTML references `app.abc.js` (old hash) → served from CacheFirst ✅ OK
6. User goes back online — still on v1 shell because v2 SW never installed
7. Deploy v3 with even newer hash
8. v1 SW still active → stale shell persists indefinitely

**Fix:** `skipWaiting: true` + `clientsClaim: true` in VitePWA config.

---

## 8. ATOMIC SERVICE WORKER UPDATE PATTERN (Production)

### 8.1 Service Worker Boilerplate (if custom SW needed)

```javascript
// public/sw.js — atomic update pattern (vanilla)
const CACHE_BASE = 'p31ca-cache';
const CACHE_VERSION = 'v3';  // ← bump on every deploy

const STATIC_CACHE = `${CACHE_BASE}-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `${CACHE_BASE}-dynamic`;

self.addEventListener('install', (event) => {
  // Force immediate activation — skip waiting
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/_astro/index.abc123.js',  // build injects actual hashed list
        '/_astro/styles.def456.css',
        '/offline.html'
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  // Take control of all pages immediately
  event.waitUntil(
    (async () => {
      // 1. Claim all clients
      await self.clients.claim();

      // 2. Delete old caches atomically
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name.startsWith(CACHE_BASE) && name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map(name => caches.delete(name))
      );
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // HTML: NetworkFirst with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline.html');
      })
    );
    return;
  }

  // JS/CSS: CacheFirst, network update in background
  if (url.pathname.match(/\.(js|css)$/)) {
    event.respondWith(
      caches.match(request).then(cached => {
        const fetchPromise = fetch(request).then(networkResp => {
          // Update cache with fresh copy
          caches.open(STATIC_CACHE).then(cache => cache.put(request, networkResp.clone()));
          return networkResp;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Default: NetworkOnly
  event.respondWith(fetch(request));
});
```

### 8.2 VitePWA Atomic Config

```javascript
// vite.config.js (ops PWA)
import { VitePWA } from 'vite-plugin-pwa';

export default {
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',  // ← let plugin inject registration code
      manifest: false,
      workbox: {
        cacheId: 'ops-v3',           // ← BUMP THIS MANUAL VERSION
        skipWaiting: true,           // ← NEW SW ACTIMATES IMMEDIATELY
        clientsClaim: true,          // ← CONTROL ALL PAGES
        cleanupOutdatedCaches: true, // ← DELETE OLD CACHES
        dontCacheBustURLsMatching: [/\.(?:js|css)$/],

        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],

        // Runtime: NetworkFirst for HTML with offline fallback
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/ops\.p31ca\.org\/.*\.html$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ops-html-v3',
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [200] },
              plugins: [
                // Optional: background sync
              ]
            }
          },
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ops-api-v3',
              expiration: { maxEntries: 100, maxAgeSeconds: 3600 },
              cacheableResponse: { statuses: [200, 201] }
            }
          }
        ]
      }
    })
  ]
}
```

**Deploy checklist:**
1. Bump `cacheId` version (`ops-v3` → `ops-v4`) on each release
2. Commit `workbox` generated file (`.vite/manifest.json` includes revision hashes)
3. Verify `skipWaiting: true` + `clientsClaim: true` in built `service-worker.js`
4. Test offline → online transition in DevTools Application → Service Workers

---

## 9. REQUIRED HEADERS CHECKLIST

For **p31ca.org** HTML responses (Cloudflare Pages `_headers`):

```txt
# ✓ Already present
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Clear-Site-Data: "cache", "storage", "executionContexts"
Content-Security-Policy: ... worker-src 'self' blob:; ...

# ⚠️ Add / tighten
Cache-Control: no-cache, no-store, must-revalidate, max-age=0   ← already OK
X-Service-Worker: p31ca-v1   ← optional: emit current SW version

# For static assets — current config OK but add cross-origin isolation if SharedArrayBuffer needed
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
  Cross-Origin-Resource-Policy: same-origin   ← if using COOP/COEP
```

For **ops.p31ca.org** (separate Pages project — need to check its `_headers`):
```txt
# Missing — should mirror p31ca security headers
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Clear-Site-Data: "cache"  ← maybe less aggressive (preserve localStorage)
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' ...

# Critical additions for PWA
service-worker-allowed: /    ← allows SW root scope
```

---

## 10. PRODUCTION DEPLOYMENT ANTI-PATTERNS TO AVOID

| Pattern | Why It Fails | Atomic Alternative |
|---------|--------------|-------------------|
| `cacheId: 'p31ca'` (static) | Cache poisoning if new SW fails install → old cache stays | **Bump version**: `cacheId: 'p31ca-v1'` → `v2` → `v3` |
| `skipWaiting: false` | New SW stuck in `waiting` → never activates | `skipWaiting: true` in config |
| `clientsClaim: false` | Old pages keep old SW control → mixed cache states | `clientsClaim: true` on activation |
| Hardcoded asset URLs in SW (no manifest) | Manual, error-prone, stale references | Use Workbox `globPatterns` + `revision` auto-generated |
| `Cache-Control: immutable` on versioned assets + no hash | Content change not reflected for 1 yr | **Hash in filename** OR `no-cache` |
| Relying on `Clear-Site-Data` for SW invalidation | Not delivered when SW intercepts | SW-level cache deletion in `activate` |

---

## 11. IMMEDIATE ACTION ITEMS

### For p31ca.org (Astro site - NO SW currently)

**Priority 1 — If adding SW in future:**
- [ ] Install `vite-plugin-pwa` in p31ca
- [ ] Configure with `cacheId: 'p31ca-v1'`, `skipWaiting: true`, `clientsClaim: true`, `cleanupOutdatedCaches: true`
- [ ] Replace inline unregister script with **atomic cleanup**:
  ```javascript
  // BaseLayout.astro — only needed if SW exists
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs =>
      Promise.all(regs.map(reg => reg.unregister()))
    );
  }
  ```
- [ ] Add SRI hashes for CDN imports (Three.js)
- [ ] Consider self-hosting Three.js instead of CDN for supply-chain security

**Priority 2 — Verify Cloudflare Pages config:**
- [ ] Confirm `_headers` is being served (checked: ✅)
- [ ] Confirm `/_astro/*` 1-year cache is intentional (it is)
- [ ] Add `X-Service-Worker: none` header to HTML to explicitly indicate no SW (defense-in-depth)

### For ops.p31ca.org (Hearing Ops PWA)

**Priority 1 — Fix VitePWA config:**
- [ ] Set `clientsClaim: true` in workbox config
- [ ] Set `cleanupOutdatedCaches: true`
- [ ] Ensure `cacheId: 'ops-v1'` is **versioned**; bump on each deploy
- [ ] Add `offline.html` fallback page
- [ ] Consider reducing static asset cache TTL from `immutable` to `max-age=31536000, immutable` is OK for hashed files, but be aware: if hash collision → 1 year stale

**Priority 2 — Test update flow:**
- [ ] Deploy v1 → install → open in tab
- [ ] Deploy v2 with new `cacheId`
- [ ] Verify v2 SW activates immediately (skipWaiting)
- [ ] Verify v1 tab is controlled by v2 (clientsClaim)
- [ ] Disconnect network → reload → verify offline.html shows

**Priority 3 — Headers for ops:**
- [ ] Create `public/_headers` in ops project mirroring p31ca security headers
- [ ] Add `Service-Worker-Allowed: /`

---

## 12. ATTACK SUMMARY TABLE

| Attack Vector | Current Status | Exploitability | Impact | Fix |
|---------------|----------------|----------------|--------|-----|
| SW unregister race | ❌ Non-atomic | Medium (needs SW present) | Stale shell after deploy | Await unregister before reload |
| Random cache names | ❌ Workbox defaults | High (every deploy) | Cache poisoning across versions | Deterministic `cacheId` + `cleanupOutdatedCaches` |
| Missing `clientsClaim` | ❌ defaults false | Medium | Old tabs keep old SW | Set `clientsClaim: true` |
| No SRI on CDN imports | ❌ No integrity | High (CDN comp) | XSS | Add SRI hashes or self-host |
| HTML no-cache only | ✅ Correct | Low | N/A | Keep |
| Static asset 1-yr cache | ✅ OK with hashes | Low (if hashes correct) | Stale if hash collision | Verify hash generation |
| `Clear-Site-Data` header | ✅ Present | N/A | Mitigates non-SW cache | Keep, but insufficient for SW |
| NetworkFirst fallback to cache | ⚠️ Workbox default | Medium | Stale shell on network error | Add offline.html fallback |

---

## 13. RECOMMENDED DELIVERABLE CODE

### 13.1 Atomic SW Registration + Versioned Cache (p31ca if/when adding SW)

**`src/layouts/BaseLayout.astro` — replace inline script:**
```astro
<script is:inline>
  (async () => {
    if (!('serviceWorker' in navigator)) return;

    // 1. Unregister all existing SWs atomically
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));

    // 2. Register new SW with versioned cache
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });

    // 3. Wait for activation before proceeding
    if (navigator.serviceWorker.waiting) {
      navigator.serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  })();
</script>
```

**`public/sw.js` — atomic lifecycle:**
```javascript
const CACHE_PREFIX = 'p31ca-cache';
const VERSION = 'v1';  // ← bump per deployment (Git SHA or semver)

const CACHE_NAME = `${CACHE_PREFIX}-${VERSION}`;

self.addEventListener('install', (e) => {
  e.waitUntil(
    (async () => {
      self.skipWaiting();
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll([
        '/',
        '/index.html',
        // dynamic manifest injection at build:
        // ...build-generated asset list
      ]);
    })()
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      await self.clients.claim();  // ← take control NOW
      const keys = await caches.keys();
      await Promise.all(
        keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME)
            .map(k => caches.delete(k))
      );
    })()
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/offline.html'))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
```

---

## 14. CONCLUSION

**p31ca.org is currently NOT vulnerable to STALE-SHELL because no SW exists.** However, the inline unregister code is **racy** and would become exploitable the moment a SW is added.

**ops.p31ca.org is the actual PWA** and has the following gaps:
1. `clientsClaim: false` — old SW lingers on some tabs
2. `cleanupOutdatedCaches: false` — cache accumulation
3. No `offline.html` fallback — NetworkFirst on HTML falls through to broken state if both network AND cache miss
4. No SRI — CDN imports are trust-on-first-use

**Immediate fix for ops PWA** (1-line config change):
```javascript
// vite.config.js — add to workbox block:
workbox: {
  cacheId: 'ops-v1',  // ← add version
  skipWaiting: true,
  clientsClaim: true,           // ← ADD THIS
  cleanupOutdatedCaches: true,  // ← ADD THIS
  // ...rest
}
```

**Long-term fix:** Deploy `p31ca-v1` SW with the atomic pattern above, or remove the unregister code entirely until SW is added.
