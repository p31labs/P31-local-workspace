# CWP-2026-041 — Spatial Quantum Dashboard: Critical Fixes & Production Hardening

**Parent:** CWP-2026-040H (Unified Quantum Fractal Dashboard)
**Status:** BUILT — fixes implemented in `software/workers/personal-swarm/`
**Deliverable:** `public/spatial-dashboard.html` + backend (`/api/fractal`, `/api/swarm-events`, `/spatial`) + `swarm_events` persistence.

## Review verdict (17 issues from code audit)

### Critical correctness bugs
| ID | Bug | Fix in build |
|----|-----|--------------|
| BUG-01 | `THREE` not imported (dual-instance / undefined) | `import * as THREE from "three"` via importmap |
| BUG-02 | `graph.graphData(data)` never called → blank canvas | Called after `fetchData()` resolves |
| BUG-03 | `linkThreeObject` returned broken custom mesh → invisible links | Removed override; use `.linkColor/.linkOpacity/.linkDirectionalParticles` |
| BUG-04 | Hover colour never reset on pointer-leave | `onNodeHover(null)` resets label/colour |
| BUG-05 | `/spatial` 404 — R2 vs ASSETS binding mismatch | `/spatial` serves `spatial-dashboard.html` from `PHOS_ASSETS` R2 binding (wrangler `[[r2_buckets]]`) |
| BUG-06 | Stale closures in `nodeThreeObject` on spoon change | `makeNodeObject` reads mutable `spoonLevel`; re-apply accessor on change |
| BUG-07 | `nodeLabel(undefined)` | `nodeLabel(n => n.name ? n.name : "")` |
| BUG-08 | Glow-ring opacity baked per-frame | Static `opacity: 0.25` |
| BUG-09 | CanvasTexture GPU leak per node | No per-node texture; labels via tooltip |
| BUG-10 | Camera set before simulation settles → jump | `onEngineStop(() => zoomToFit(400, 60))` |
| BUG-11 | Test asserted scale on node with no scale set | Added `filterScale` + scale-keyed color map |

### Architecture
| ID | Issue | Fix |
|----|--------|-----|
| ARCH-01 | Dead VR button | Removed; real working 2D/3D toggle |
| ARCH-02 | `getUnifiedView(db, null)` ambiguous semantics | `getUnifiedView(db, opts?)` with `{ selfPglite?, filterScale? }` |
| ARCH-03 | Two THREE instances (ESM + classic) | Single instance via esm.sh `?external=three` + importmap `three`/`three/` |
| ARCH-04 | Calling private `_destructor` tore down wrong graph | Tear down via `container.innerHTML = ""` |

### Performance
| ID | Issue | Fix |
|----|--------|-----|
| PERF-01 | `Math.random()` link distances → unstable layout | Deterministic d3-force-3d defaults; tuned `charge`/`link` strength only |
| PERF-02 | `window.innerWidth` default prop | Library auto-fits container; explicit `zoomToFit` on resize |

## Files changed
- `public/spatial-dashboard.html` — corrected spatial dashboard (all 17 fixes, DESIGN.md-compliant: quantum-cyan `#00F0FF`, void `#0A0A0F`, glass blur 12/radius 24, spoon-aware `data-spoons`, CrisisMode VagusBreath overlay, 44px touch targets).
- `src/types.ts` — `SwarmEvent`, `UnifiedFractalView`, `FractalDB.logSwarmEvent/listSwarmEvents`.
- `src/store.ts` — implementations + `swarm_events` schema for PGLite & D1.
- `src/consolidation.ts` — logs a `fired` swarm event per agent dispatch.
- `src/dashboard.ts` (new) — `getUnifiedView`.
- `src/index.ts` — `/api/fractal`, `/api/swarm-events`, `/spatial` (R2).
- `migrations/0001_fractal.sql` — `swarm_events` table + indexes.
- `wrangler.toml` — `[[r2_buckets]] PHOS_ASSETS`.
- `test/dashboard.test.ts` — 6 new tests (unified view, swarm events, routes).

## Deploy
```
cd software/workers/personal-swarm
npx wrangler r2 object put phos-assets/spatial-dashboard.html --file public/spatial-dashboard.html --content-type text/html
npx wrangler deploy
```
Then visit `https://personal-swarm.<sub>.workers.dev/spatial`.

## Verification
- `npx tsc --noEmit` clean.
- `npx vitest run` → 21/21 pass (was 15; +6 for 040H).

---

## Phase 2 — Post-deploy feedback-loop hardening (applied)

Turning the live engine into a self-optimizing, globally-performant system.

### 🔴 High — Observability → autonomous remediation
- **`cf-monitor.mjs`** (new) — auto-diagnostic layer. Streams `wrangler tail
  --format json`, fingerprints every exception/error log, de-dupes across
  restarts (`.cf-monitor-state.json`), and opens a GitHub issue per NEW error
  signature (throttled, `cf-monitor`+`bug` labels). Run: `npm run monitor`
  (needs `gh` auth + `GH_REPO`).
- **Hono `onError`** surfaces real errors as JSON (added in deploy fix) so the
  swarm *sees itself*.

### 🔴 High — R2 + Cache-Control: zero-egress CDN
- `/spatial` now returns `Cache-Control: public, max-age=86400,
  stale-while-revalidate=86400` and an `ETag`. A matching `If-None-Match`
  request returns **304** (~100B vs ~14KB). R2 egress is free regardless.
- `obj.writeHttpMetadata(headers)` copies content-type + etag from the object.

### 🔴 High — D1 query caching (edge)
- `GET /api/fractal` + `GET /api/swarm-events` are served through the
  **Cache API** (`caches.default`): first hit `MISS`, repeats `HIT`, short
  `max-age=30, stale-while-revalidate=300` so writes surface within seconds
  while reads stay cheap (lower D1 round-trips + CPU). Guard is lazy so unit
  tests inject a stub.

### 🟡 Medium — Neuroinclusive: Reduce Motion toggle
- New **Motion/Calm** button persists preference in `localStorage`, honours
  `prefers-reduced-motion` on load, and disables link particles + transitions
  (`body.reduced-motion`). Spoon-aware motion + CrisisMode VagusBreath retained.

### 🟡 Medium — WebGPU renderer (guarded)
- After graph build, if `navigator.gpu` exists we dynamically import
  `three/webgpu`, `await WebGPURenderer.init()`, and swap via `Graph.renderer()`.
  Any failure keeps the WebGL renderer — no regression for WebGL-only browsers.
  **Needs a real-GPU browser pass to confirm** (sandbox has no GPU).

### 🟢 Stretch / monitor (documented, not yet built)
- **Semantic Level of Detail (SLoD)** — heat-kernel/“ hyperbolic-manifold
  continuous resolution so 60 nodes → 60,000 without losing self-similar clarity.
- **FracComplEx** fractional-order KG embeddings for multi-scale / non-local semantics.
- **Standards watch** — W3C Agent Trust Protocol (`did:atp`, hybrid Ed25519 +
  ML-DSA-65), NIST 3rd-round PQS (May 2026), W3C Quantum-Resistant
  Cryptosuites v1.0 FPWD (June 2026). P31 ML-DSA-65 already positioned.

## Phase 2 verification
- `npx tsc --noEmit` clean.
- `npx vitest run` → 23/23 pass (+2: `/spatial` ETag/304, edge-cache MISS→HIT).
- Live: `/spatial` → 200 + `ETag`/`Cache-Control`; repeat with `If-None-Match`
  → 304. `/api/fractal` → `X-Cache: MISS` then `HIT`.
