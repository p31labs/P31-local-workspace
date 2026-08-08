# Spaceship Earth — Manufacturer's Technical Manual

**Version:** 1.1.0
**Document ID:** P31-SE-MAN-001
**Classification:** Technical — Manufacturer / OEM
**Last Updated:** 2026-08-08
**Deployment:** https://bf53b085.spaceship-earth.pages.dev
**Maintainer:** P31 Labs — trimtab-signal

---

## 1. Product Identity

### 1.1 Overview
Spaceship Earth is an immersive 3D cockpit application providing a sovereign,
family-scale mesh interface. It renders a geodesic "docking dome" with 9600
NeoPixel segments, telemetry HUDs (DUNA, System, LED), and sovereign state
orchestration. It is the primary visual and interactive cockpit for the P31
ecosystem.

### 1.2 Versioning & Lineage

| Attribute | Value |
|---|---|
| Package | `@p31/spaceship-earth` (pnpm workspace `packages/*`) |
| Package Manager | pnpm (repo root `pnpm-workspace.yaml`) |
| Runtime | Vite 8 + React 19 + Three.js 0.172 |
| Renderer | `@react-three/fiber` 9 + `@react-three/drei` + `@react-three/postprocessing` |
| Unit tests | Vitest 4 (10 files, 89 tests — green) |
| PWA | Yes (`vite-plugin-pwa`, Workbox, `generateSW`) |
| Pages deploy | https://bf53b085.spaceship-earth.pages.dev |
| Worker | `spaceship-relay` (Cloudflare Worker) |
| Compatibility date | 2026-07-16 |

### 1.3 Contract Surfaces

| Surface | Type | Notes |
|---|---|---|
| Pages Deploy | Cloudflare Pages | Static site + PWA (project `spaceship-earth`) |
| Worker | Cloudflare Worker | `spaceship-relay` — session telemetry + state sync + WebRTC signaling |
| MCP Server | stdio JSON-RPC | `cli/spaceship-server.js` — 4 tools |
| WebMCP | Chrome Origin Trial | `navigator.modelContext` (expires 2026-11-16) |
| PWA | Service Worker | Workbox, auto-update, offline |
| Local Storage | zustand/persist | Ship state, LED settings |
| IndexedDB | `p31-genesis` | Identity keys (Ed25519) |
| IndexedDB | `p31-relay-queue` | Offline action queue |
| IndexedDB | `p31-error-log` | Error ring buffer (100 max) |
| Sentry | `@sentry/react` | Traces sample rate 0.01 |

---

## 2. Architecture & Data Flow

### 2.1 Component Hierarchy

```
App
├── initSovereignBridge()
├── installVerifyHooks()
├── useWebMCP()
├── Canvas (@react-three/fiber)
│   ├── EffectComposer → UnrealBloomPass
│   ├── Lens (ambient + point lights)
│   ├── OuterDome (geodesic shell + tetra frame)
│   ├── InnerDome (wireframe + stat nodes)
│   ├── TetraCraft (camera-relative tetra)
│   ├── CameraRig (OrbitControls + auto-rotate)
│   ├── AmbientField (2000 points)
│   ├── Edges (quadratic bezier curves)
│   ├── Nodes (sphere core/glow/halo, click select)
│   ├── InstancedEdges (performance edges)
│   ├── DataCard (floating node info)
│   └── SpoonPulse (bottom-left orb)
├── HUD Overlays
│   ├── DunaBoard        (data-testid="duna-board")
│   ├── SystemBoard      (data-testid="system-board")
│   └── LedController    (data-testid="led-controller", collapsible)
└── (no BottomNav — cockpit-only)
```

### 2.2 State Management

#### 2.2.1 Stores

| Store | Persist | Purpose |
|---|---|---|
| `shipStore` | zustand/persist | Docked ports, member count, DUNA target, coherence, spoons, viewMode, LED settings |
| `useSovereignStore` | in-memory | 12-room sovereign state, identity, radio, mesh, K4 handshake, skin profiles |

> **Important:** `useSovereignStore` uses the Zustand v5 curried `create<T>()(...)`
> pattern with **no middleware** — middleware breaks type inference. See
> `CONTRIBUTING.md`.

#### 2.2.2 LED Settings (`shipStore`)

| Field | Type | Default | Range | Description |
|---|---|---|---|---|
| `ledMode` | `LedMode` | `'rainbow'` | enum (7) | Pixel animation mode |
| `ledSpeed` | number | `5` | 0–10 | Animation speed |
| `ledColor` | string | `'#22d3ee'` | hex | Primary color |
| `ledBrightness` | number | `80` | 0–100 | Brightness |
| `ledColors` | string[] | `['#ff9944','#22d3ee','#44ffaa']` | — | Palette (gradient / dual-chase) |
| `ledCollapsed` | boolean | `true` | — | Controller collapsed state |

```typescript
type LedMode = 'rainbow' | 'chase' | 'solid' | 'breath' | 'gradient' | 'dual-chase' | 'off';
```

#### 2.2.3 Sovereign State Slices (`useSovereignStore`)

| Slice | Key Fields |
|---|---|
| UI/Nav | `viewMode`, `cameraMode`, `openOverlay` |
| Audio | `audioEnabled`, `masterVolume` |
| Coherence | `coherence`, `noiseFloor`, `fawnGuard` |
| Identity M01 | `didKey`, `ucanStatus` |
| CRDT/Telemetry | `telemetryEnabled`, `syncStatus` |
| Radio | `bleStatus`, `loraNodes` |
| NodeContext | `spoons`, `maxSpoons`, `tier`, `love`, `nodeId` |
| Centaur | `centaurStatus` |
| Genesis Sync | `genesisSyncStatus` |
| Dynamic Slots | `dynamicSlots` |
| Somatic M18 | `somaticStatus` |
| Spatial Mesh M20 | `spatialMeshStatus` |
| K4 Handshake M21 | `k4HandshakeStatus` |
| Reactor Core M19 | `reactorCoreStatus` |
| Skin D1.1 | `skinTheme` |
| Sierpinski D4.6 | `sierpinskiEnabled` |
| Camera D2.1 | `cameraMode`, `cameraTarget` |
| Lock Screen | `shipLocked` |

### 2.3 Sovereign ↔ Ship Bridge (`src/bridge/sovereign.ts`)

Direction: Sovereign (source of truth) → Ship (rendering).

- Synced fields: `spoons`, `coherence`, `engagement`, `didKey`.
- Reads `<html data-spoons>`; emits:

| Event | Detail | Purpose |
|---|---|---|
| `p31:sovereign-spoons` | number (0–5) | Spoon level update |
| `p31:shell-spoons` | number (0–5) | Spoon level sync |
| `p31:shell-persona` | string | Persona sync |

---

## 3. Engine Layer (Phases 1–5)

Added in v1.1.0. The engine layer was previously stubbed; all nine modules are
now implemented and covered by the vitest suite (89 tests, all green).

| Module | Phase | Responsibility | Tests |
|---|---|---|---|
| `src/engine/stateEngine.ts` | 1 | SIC-POVM d=2 ship measurement — passport observables → qubit density matrix → 4-mode measurement + entropy | `stateEngine.test.ts` |
| `src/engine/k4Binding.ts` | 2 | K₄ skeleton binding — complete planar graph, vertex activity, edge health from relay latency | `k4Binding.test.ts` |
| `src/engine/coherence.ts` | 3 | Posner coherence model — spoons/engagement/entropy → [0,1] coherence, field chaos, Fawn-Guard gate | `coherence.test.ts` |
| `src/engine/layoutField.ts` | 4 | Morphogenetic layout — deterministic FNV-1a hashed panel layout + time/energy layers | `layoutField.test.ts` |
| `src/engine/feedbackLoop.ts` | 5 | Self-adapting loop — EWMA memory folds outcomes, modulates measurement, converges | `feedbackLoop.test.ts` |
| `src/lib/engine/ricci.ts` | 2 | Ricci-style network health math (curvature, resilience, scale factor) | `ricci.test.ts` |
| `src/lib/engine/fawn.ts` | 3 | Fawn-Guard — over-apology / self-diminishing / permission-seeking detection, XSS-escaped warnings | `fawn.test.ts` |
| `src/lib/engine/larmor.ts` | — | ³¹P Larmor reference engine (172.35 MHz primary, 863 Hz fifth-harmonic) | `larmor.test.ts` |
| `src/lib/engine/kenosisMesh.ts` | — | Kenosis mesh handshake observable state contract | `kenosisMesh.test.ts` |
| `src/engine/dockMath.ts` | 1 | Dock allocation + system probabilities + dock JSON generation | `integration.test.ts` |

All engine files carry the contested-science disclaimer: the math is a
metaphor borrowed from `@p31/quantum-core` and asserts **engine behavior only** —
no physical, medical, or scientific claim is made.

### 3.1 Key Engine Contracts

- `measureShipState(user: UserState): ShipMeasurement` — returns
  `{ probabilities, dominant, entropy }` over `explore | create | connect | reflect`.
  With zero connection signal (off-diagonal `re = 0`) the measurement is
  uniform (0.25 each) regardless of energy.
- `verifyStateEngine(): { valid, overlap }` — checks the SIC-POVM frame
  invariant (pairwise overlap = 1/3) to 1e-9.
- `buildShipK4(activity, ping): ShipK4Graph` — 4 vertices, 6 edges, complete +
  planar; edge health peaks at ~40 ms round-trip latency.
- `computePosnerCoherence(input)` / `fawnThreshold(coherence)` — coherence in
  [0,1]; gate severity `mild | moderate | severe`.
- `runFeedbackCycle(raw, fb)` — one measurement + EWMA fold; ALPHA = 0.15,
  converges, never NaN.
- `RicciMath.calculateCurvature(latency, noise)` — curvature in [0.5, 1.5].

---

## 4. Fabrication (Build Pipeline)

### 4.1 Toolchain

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 22+ | Runtime |
| pnpm | repo root | Package manager (single workspace) |
| TypeScript | 5.x | Type checking (`tsc --noEmit`) |
| Vite | 8.x | Bundler |
| Vitest | 4.x | Unit tests |
| Wrangler | 4.x | Cloudflare deploy |

### 4.2 Build Commands

```bash
# Install (repo root — lockfile is at root)
cd /home/p31/P31-local-workspace && pnpm install

# Dev server (port 5180; ?demo=true | ?stats=1)
pnpm --filter @p31/spaceship-earth dev

# Type check + production build → dist/
pnpm --filter @p31/spaceship-earth build

# Production preview
pnpm --filter @p31/spaceship-earth preview

# Unit tests (10 files, 89 tests)
pnpm --filter @p31/spaceship-earth test

# Sync dist/ to p31ca.org for same-origin hosting
pnpm --filter @p31/spaceship-earth sync:p31ca

# Verify suite (against live deploy)
cd packages/spaceship-earth && node scripts/verify-ship.cjs

# CLI MCP server (stdio JSON-RPC)
node /home/p31/P31-local-workspace/cli/spaceship-server.js

# Deploy Pages + Worker
cd packages/spaceship-earth
pnpm dlx wrangler pages deploy dist --project-name spaceship-earth --branch=main
pnpm dlx wrangler deploy --name spaceship-relay
```

### 4.3 Build Outputs

| Artifact | Approx size | Notes |
|---|---|---|
| `dist/index.html` | — | Entry point |
| `dist/assets/vendor-react-*.js` | ~60 KB gzip | React |
| `dist/assets/vendor-three-*.js` | ~243 KB gzip | Three.js |
| `dist/assets/index-*.js` | ~15 KB gzip | App |
| `dist/sw.js` | — | Workbox service worker |
| `dist/stats.html` | — | Rollup visualizer report |

> `tsconfig.json` excludes `__tests__` from `tsc`; Vitest compiles them
> directly. The production build (`tsc --noEmit && vite build`) therefore
> type-checks application code only.

---

## 5. Deployment & Configuration

### 5.1 Wrangler Configuration (`wrangler.toml`)

```toml
name = "spaceship-relay"
main = "worker/index.ts"
compatibility_date = "2026-07-16"
compatibility_flags = ["nodejs_compat"]

[[kv_namespaces]]
binding = "SPACESHIP_TELEMETRY"

[cache]
enabled = true
```

### 5.2 Pages Deploy Configuration

| Setting | Value |
|---|---|
| Project name | `spaceship-earth` |
| Build command | `pnpm build` |
| Build output | `dist/` |
| Env vars | `VITE_RELAY_URL` (optional) |

### 5.3 Environment Variables

| Variable | Scope | Purpose |
|---|---|---|
| `VITE_RELAY_URL` | Build | WebSocket relay endpoint |
| `VITE_LLM_KEY` | Build | (optional) LLM API key |
| `?stats=1` | Query | Enable FPS overlay |

### 5.4 Worker Routes (`worker/index.ts`)

| Method | Path | Handler |
|---|---|---|
| POST | `/session/start` | Start session |
| POST | `/session/heartbeat` | Keepalive |
| POST | `/session/end` | End session |
| POST | `/state/:did` | Ed25519-verified state push |
| GET | `/state/:did` | Fetch state (404 → synced) |
| * | `/*` | CORS + fallback |

Bindings:

- `SPACESHIP_TELEMETRY` — KV store for telemetry data.
- `OCTOPRINT_URL` / `OCTOPRINT_API_KEY` / `GCODE_ALLOWLIST` — 3D printer
  integration.

### 5.5 WebRTC Signaling (`worker/wsSignaling.ts`)

- Protocol: y-webrtc signaling.
- Room selection: `?room=<roomId>` query param.
- Relays SDP offers/answers and ICE candidates to room peers.
- Implementation: `WebSocketPair` + `handleWebSocket`.

### 5.6 CSP Headers (`public/_headers`)

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline'; connect-src https: wss:; frame-src blob:; frame-ancestors 'none';
Permissions-Policy: usb=(self)
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

> `unsafe-eval` is required for the Babel Jitterbug cartridge compiler; R08
> telemetry is sourced from `https://p31ca.org/p31-telemetry.js`. See
> `WCD-30-SECURITY-REPORT.md`.

---

## 6. Assembly & Integration

### 6.1 Module Wiring (`src/App.tsx`)

```tsx
// 1. Init sovereign↔ship bridge
initSovereignBridge();
// 2. Install verify hooks (only when __P31_VERIFY__ set or MODE !== production)
installVerifyHooks();
// 3. Register WebMCP tools
useWebMCP();
// 4. Hydrate shipStore from sovereignStore (spoons=4, coherence=0.8, engagement=5, didKey)
// 5. Subscribe: push shipStore changes back to sovereignStore
```

### 6.2 Dome Geometry (`src/math/geodesic.ts`)

Base icosahedron: 12 vertices (golden ratio φ = 1.618034), 20 faces.
Subdivision: midpoint → normalize to radius. `KEY_PRECISION: 8` for dedupe.

Detail-2 outputs:

| Metric | Value |
|---|---|
| Vertices | 642 |
| Edges | 480 |
| Faces | 320 |
| NeoPixel segments | 480 × 20 = 9600 |

### 6.3 Rendering Pipeline

| Component | Layer | Details |
|---|---|---|
| OuterDome | Outer | Radius 12, 480 edges, 9600 NeoPixel segments, tetra frame (6 edges), 120 ports |
| NeoPixelFrame | Segment | InstancedMesh (CylinderGeometry), PIXEL_RADIUS 0.045, PIXEL_GAP 0.01 |
| TetraCraft | Inner | Camera-relative tetra (`regularTetra(0.5)`), wobbly rotation |
| InnerDome | Inner | Radius 2.5 wireframe, additive `#d9a066`, stat nodes |
| CameraRig | Camera | OrbitControls, damping 0.08, min 8 max 50, autoRotate speed `0.3 + (spoons/5)*0.3` |
| AmbientField | Atmosphere | 2000 points (`#88aaff`), size 0.05, opacity 0.4, density `0.3 + 0.7*coherence` |
| Edges | Connectivity | Node pairs < 2.5 apart, quadratic bezier, opacity `0.08 + 0.18*coherence` |
| Nodes | Ports | 12 nodes, sphere core/glow/halo, pulse `0.85 + 0.15*sin`, click select |
| InstancedEdges | Performance | Instanced cylinders, per-instance colors |
| DataCard | HUD | Projected node info over canvas |
| SpoonPulse | HUD | Bottom-left orb, color by spoon level |

### 6.4 Skin Profiles (`src/sovereign/skinProfiles.ts`)

| Theme | Target Parameters |
|---|---|
| OPERATOR | High bloom, low roughness, warm fog |
| KIDS | High emissive, high bloom, colorful stars |
| GRAY_ROCK | Low bloom, high roughness, neutral fog |

Lerp rate: `SKIN_LERP_RATE = 4.0` (transitions per second).

---

## 7. Interface Specifications

### 7.1 DOM Contract (`data-testid`)

| `data-testid` | Component | Purpose |
|---|---|---|
| `duna-board` | DunaBoard | DUNA HUD panel |
| `system-board` | SystemBoard | System health HUD |
| `led-controller` | LedController | NeoPixel controller (collapsible) |

`led-controller` exposes `data-collapsed="true|false"` controlled by the
`ledCollapsed` store field.

### 7.2 Window Globals (`window.__p31*`)

| Global | Source | Purpose |
|---|---|---|
| `__p31_domeStructure` | `verify/hooks.ts` | Dome metadata |
| `__p31_ship` | `verify/hooks.ts` | Ship state |
| `__p31_led` | `verify/hooks.ts` | LED settings |

`__p31_domeStructure` payload:

```json
{
  "layers": 4,
  "mode": "docking-dome",
  "radius": 12,
  "outerEdges": 480,
  "ports": 120,
  "neoPixelSegments": 9600,
  "tetraFrame": 6,
  "innerDome": true
}
```

Hooks are only installed when `MODE !== 'production'` **or** `__P31_VERIFY__` is
set (the verify suite sets it via `addInitScript` before the bundle's first tick).

### 7.3 MCP Server (`cli/spaceship-server.js`)

| Tool | Description | Input Schema |
|---|---|---|
| `duna_status` | Get current DUNA docking status | `{}` |
| `system_health` | Get system health metrics | `{}` |
| `dome_structure` | Get dome geometry metadata | `{}` |
| `neo_pixel_control` | Set NeoPixel mode, speed, color, brightness | `{ mode, speed, color, brightness }` |

- State file: `~/p31-agents/spaceship-state.json` (lazy-written on first mutation).
- `neo_pixel_control` is priced at $0.01 via the x402 gateway
  (`mcp-x402-gateway.trimtab-signal.workers.dev`).

### 7.4 WebMCP Tools (`hooks/useWebMCP.ts`)

- Chrome Origin Trial: versions 149–156; expires 2026-11-16.
- Tokens held for: `p31ca.org`, `phosphorus31.org`.

| Tool | Description | Input |
|---|---|---|
| `duna_status` | Get current DUNA docking status | `{}` |
| `duna_set_target` | Set DUNA docking target | `{ target: number }` |

---

## 8. Calibration & Tuning

### 8.1 Geodesic Dome Parameters

| Parameter | Value |
|---|---|
| `DOME_RADIUS` | 12 |
| `INNER_RADIUS` | 2.5 |
| `PORT_COUNT` | 120 |
| `SEGMENTS_PER_EDGE` | 20 |
| `PIXEL_RADIUS` | 0.045 |
| `PIXEL_GAP` | 0.01 |
| `TETRA_FRAME_EDGES` | 6 |
| `LAYERS` | 4 |

### 8.2 NeoPixel Modes

| Mode | Palette Used | Description |
|---|---|---|
| `rainbow` | No | Full rainbow sweep |
| `chase` | No | Color-chase animation |
| `solid` | No | Static color (`ledColor`) |
| `breath` | No | Pulse brightness |
| `gradient` | Yes (2 colors) | Smooth gradient between colors |
| `dual-chase` | Yes (2 colors) | Chase with two colors |
| `off` | No | All pixels off |

### 8.3 Spoon → Coherence Mapping

| Spoon Level | Coherence Range | Visual Effect |
|---|---|---|
| 0 | 0.0–0.2 | Stand-down (minimal FX) |
| 1 | 0.2–0.4 | Low engagement |
| 2 | 0.4–0.6 | Moderate |
| 3 | 0.6–0.8 | Engaged |
| 4 | 0.8–0.9 | High |
| 5 | 0.9–1.0 | Peak (all FX) |

### 8.4 Camera Modes

| Mode | Description |
|---|---|
| `free` | User-controlled orbit (default) |
| `dome` | Locked to dome center |
| `screen` | Locked to screen orientation |

### 8.5 View Modes

| Mode | Description |
|---|---|
| `cockpit` | Full 3D cockpit (default) |
| `classic` | Simplified 2D view |

---

## 9. Testing & Quality Control

### 9.1 Unit Suite (Vitest)

```bash
cd /home/p31/P31-local-workspace/packages/spaceship-earth && npx vitest run
```

- 10 test files, 89 tests, all green.
- Covers all nine engine modules (Phases 1–5) + dock math integration.

### 9.2 Verify Suite (`scripts/verify-ship.cjs`)

```bash
node scripts/verify-ship.cjs
```

| Environment | Default | Purpose |
|---|---|---|
| `SHIP_VERIFY_BASE` | `https://bf53b085.spaceship-earth.pages.dev` | Live deploy URL |
| `__P31_VERIFY__` | set internally | Enables verify-gated hooks |

> **v1.1.0:** the default `SHIP_VERIFY_BASE` was updated from the stale
> `5a043de3` hash to the current production deploy `bf53b085`.

Sections:

| Section | Purpose |
|---|---|
| A | Static preflight (file existence, store fields, LED modes, geodesic math, hook presence) |
| B | Deploy fingerprint |
| C | Page load + verify hooks |
| D | Dome metadata validation |
| E | HUD boards render |
| F | LED controller interaction |
| G | Persistence (collapsed state, mode) |

Static preflight checks (Section A):

- `hud/DunaBoard.tsx`, `hud/SystemBoard.tsx`, `hud/LedController.tsx` exist.
- `cockpit/OuterDome.tsx`, `cockpit/NeoPixelFrame.tsx` exist.
- `math/geometry.ts`, `verify/hooks.ts`, `store/shipStore.ts` exist.
- Store fields: `dockedPorts`, `memberCount`, `dunaTarget`, `coherence`,
  `spoons`, `viewMode`.
- LED modes enum includes all 7 modes.
- 480 edges × 20 segments = 9600.
- Geodesic detail=2 → 480 edges.
- Hooks expose `__p31_domeStructure`, `__p31_ship`, `__p31_led`.

### 9.3 CI Pipeline (`.github/workflows/spaceship-earth.yml`)

> **v1.1.0:** workflow paths were stale (`software/…` → no such directory).
> Rewritten to the root pnpm workspace pattern: `paths` on
> `packages/spaceship-earth/**`, root `corepack enable && pnpm install`, build
> via `pnpm --filter @p31/spaceship-earth run build`, deploy from
> `packages/spaceship-earth`. Uses `actions/setup-node@v4` (Node 22) — the
> `pnpm-04-software` composite action is obsolete (hardcodes `software/`).

---

## 10. Operation & Maintenance

### 10.1 Health Endpoints

| Endpoint | Expected Response |
|---|---|
| `/session/start` | `{ status: 'ok', sessionId: string }` |
| `/session/heartbeat` | `{ status: 'ok' }` |
| `/session/end` | `{ status: 'ok' }` |
| `GET /state/:did` | `{ status: 'ok', data: object }` |
| `POST /state/:did` | `{ status: 'ok', synced: boolean }` |

### 10.2 Telemetry & Monitoring

- Opt-in: `localStorage.p31-telemetry = '1'`.
- Endpoints: `/api/telemetry`, `/api/telemetry/perf`.
- Batch size: 10 events; `sendBeacon` on page unload.
- COPPA: Kids mode blocks all telemetry.

### 10.3 Offline Queue (`services/offlineQueue.ts`)

- IndexedDB store: `p31-relay-queue`, actions store FIFO (auto-increment).
- Replay automatic on reconnect.

### 10.4 Error Logging (`services/errorReporter.ts`)

- IndexedDB store: `p31-error-log`, ring buffer (100 max).
- Captures `window.onerror` and unhandled rejections.

---

## 11. Troubleshooting & Errata

### 11.1 Known Gaps (Current State)

| ID | Component | Issue | Resolution |
|---|---|---|---|
| E-R1 | Sibling workflows | `bonding.yml`, `deploy.yml` etc. still reference the obsolete `software/` layout and `pnpm-04-software` action | Out of F1 scope; rework to root workspace pattern per `spaceship-earth.yml` |
| E-R2 | `spaceship-state.json` | Not yet present in `~/p31-agents/` (lazy-written) | No action; first MCP mutation creates it |
| E-R3 | `@p31/tetra` alias | Pointed at a nonexistent path in tsconfig path maps | Verify consumers; remove alias or add module |
| E-R4 | RUNBOOK drift | `RUNBOOK.md` predates the engine layer and verify-base update | Refresh against this manual |

### 11.2 Resolved Errata (v1.1.0)

| ID | Component | Resolution |
|---|---|---|
| E-01/E-05 | Engine layer (`coherence`, `k4Binding`, `layoutField`, `fawn`, `kenosisMesh`, `larmor`, `ricci`) | **Implemented** — 9 modules, 89/89 tests green, production build passes |
| E-02 | CI workflow paths (`software/` → no such dir) | **Fixed** in `spaceship-earth.yml` |
| E-03 | Stale verify BASE (`5a043de3`) | **Fixed** → `bf53b085` (current live deploy, HTTP 200 confirmed) |

### 11.3 Common Failures

| Symptom | Likely Cause | Action |
|---|---|---|
| Verify suite fails Section A | File path mismatch | Check `ROOT` constant in `verify-ship.cjs` |
| HUD boards not rendering | Sovereign store not hydrated | Check `initSovereignBridge()` in `App` |
| NeoPixel frame missing | `ledMode='off'` or `ledBrightness=0` | Check store settings |
| Camera not auto-rotating | `selectedPort` not null | Deselect port or set `autoRotate=true` |
| WebMCP tools not registered | Chrome Origin Trial expired / token missing | Check token for `p31ca.org` or `phosphorus31.org` |
| Relay connection fails | `VITE_RELAY_URL` missing or invalid | Set env var in build |

---

## 12. Safety, Accessibility & Compliance

### 12.1 Accessibility (WCAG 2.2)

| Feature | Mechanism | Standard |
|---|---|---|
| Reduced motion | `useReducedMotion` hook + CSS | WCAG 2.3.3 (Pause, Stop, Hide) |
| Focus management | `useFocusTrap` + keyboard nav | WCAG 2.4.7 (Focus Visible) |
| Speech input | `useSpeechInput` (D3.8) | WCAG 2.5.6 (Concurrent Input Mechanisms) |
| Color contrast | Tailwind themes + OKLCH | WCAG 1.4.3 (Contrast Minimum) |
| Keyboard shortcuts | `useFocusTrap` (Escape closes) | WCAG 2.1.1 (Keyboard) |

### 12.2 Sensory Modes

| Mode | Effect |
|---|---|
| `calm` | Freezes all motion, reduces stars |
| `muted` | Desaturated colors (chroma × 0.45) |
| `warmLight` | Amber tint (hue 60 @ 0.5) |
| `focus` | Hides non-essential UI |

### 12.3 Privacy & Security

- Identity: `did:key` Ed25519 — all-local, no external key escrow.
- Cryptography: Ed25519 for signatures, Web Crypto API.
- Mesh: WebRTC-Direct (y-webrtc) — no central server after signaling.
- Data: all state persists locally (IndexedDB, localStorage).
- Telemetry: opt-in (`p31-telemetry='1'`), no default tracking.
- COPPA: Kids mode blocks telemetry and personal data collection.

### 12.4 Compliance References

| Standard | Fulfillment |
|---|---|
| WCAG 2.2 Level AA | All sensory + keyboard requirements met |
| GDPR (EU) | All data local; telemetry opt-in |
| COPPA (US) | Kids mode blocks telemetry |
| WCD-30 | Two-layer CSP, HSTS, `frame-ancestors 'none'` |

---

## 13. Appendices

### Appendix A: Command Quick Reference

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server (port 5180) |
| `pnpm build` | Typecheck + production build → `dist/` |
| `pnpm preview` | Preview production build |
| `pnpm test` | Vitest unit suite (89 tests) |
| `pnpm sync:p31ca` | Sync `dist/` to `p31ca.org/public/spaceship-earth` |
| `node scripts/verify-ship.cjs` | Playwright E2E suite (live deploy) |
| `node cli/spaceship-server.js` | MCP stdio server (4 tools) |
| `pnpm dlx wrangler pages deploy dist` | Deploy Pages |
| `pnpm dlx wrangler deploy` | Deploy `spaceship-relay` Worker |

### Appendix B: Data Dictionary — Key State Fields

| Field | Store | Type | Description |
|---|---|---|---|
| `spoons` | shipStore / sovereignStore | number (0–5) | Spoon level |
| `coherence` | shipStore / sovereignStore | number (0–1) | Mesh coherence |
| `engagement` | shipStore / sovereignStore | number (0–10) | Engagement level |
| `didKey` | shipStore / sovereignStore | string | did:key identifier |
| `dockedPorts` | shipStore | number | Currently docked ports |
| `memberCount` | shipStore | number | DUNA members |
| `dunaTarget` | shipStore | number | DUNA target |
| `viewMode` | shipStore | `'cockpit'\|'classic'` | View mode |
| `ledMode` | shipStore | LedMode | NeoPixel mode |
| `ledSpeed` | shipStore | number (0–10) | Speed |
| `ledColor` | shipStore | string | Primary color |
| `ledBrightness` | shipStore | number (0–100) | Brightness |
| `ledColors` | shipStore | string[] | Palette |
| `ledCollapsed` | shipStore | boolean | Controller collapsed |
| `selectedPort` | shipStore | number\|null | Selected port index |

### Appendix C: Verify-Gate Matrix (Spaceship Earth)

| Gate ID | Section | Description | Testid / Hook |
|---|---|---|---|
| G-01 | A | DunaBoard.tsx exists | File existence |
| G-02 | A | SystemBoard.tsx exists | File existence |
| G-03 | A | LedController.tsx exists | File existence |
| G-04 | A | OuterDome.tsx exists | File existence |
| G-05 | A | NeoPixelFrame.tsx exists | File existence |
| G-06 | A | geometry.ts exists | File existence |
| G-07 | A | verify/hooks.ts exists | File existence |
| G-08 | A | shipStore.ts exists | File existence |
| G-09 | A | Store fields present | `dockedPorts, memberCount, dunaTarget, coherence, spoons, viewMode` |
| G-10 | A | 7 LED modes | Enum includes all modes |
| G-11 | A | 480 × 20 = 9600 | Math check |
| G-12 | A | geodesic detail=2 → 480 edges | Math check |
| G-13 | A | `__p31_domeStructure` exposed | Window hook |
| G-14 | A | `__p31_ship` exposed | Window hook |
| G-15 | A | `__p31_led` exposed | Window hook |
| G-16 | D | Dome layers = 4 | `__p31_domeStructure.layers` |
| G-17 | D | Outer edges = 480 | `__p31_domeStructure.outerEdges` |
| G-18 | D | Ports = 120 | `__p31_domeStructure.ports` |
| G-19 | D | NeoPixel segments = 9600 | `__p31_domeStructure.neoPixelSegments` |
| G-20 | E | Duna board renders | `data-testid="duna-board"` |
| G-21 | E | System board renders | `data-testid="system-board"` |
| G-22 | F | LED controller renders | `data-testid="led-controller"` |
| G-23 | F | LED controller collapsed by default | `data-collapsed="true"` |
| G-24 | F | Mode switch propagates | Store update |
| G-25 | G | Collapsed state persists | Reload check |
| G-26 | G | Mode persists | Reload check |

---

**Next revision:** 2026-08-15
**Maintainer:** P31 Labs — trimtab-signal
