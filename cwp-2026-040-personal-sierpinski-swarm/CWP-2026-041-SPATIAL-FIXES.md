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
