# Spaceship Earth — System Architecture

**Document ID:** P31-SE-ARCH-001 | **Version:** 1.2.0 | **Last Updated:** 2026-08-11

---

## 1. Overview

Spaceship Earth is a **sovereign, immersive 3D cockpit** for the P31 ecosystem. It orchestrates:

1. **Dome Visualization:** Geodesic shell with 9600 addressable LED segments and 320 interactive face ports.
2. **Sovereign State:** Zustand stores + PGLite ledger, bridged to the P31 Shell.
3. **Engine Layer:** Contested-science metaphor (SIC-POVM measurement, K₄ binding, coherence, feedback loops).
4. **Data Connectors:** Universal dataset layer mapping external data (JSON / HAPI / SDG) onto the 320 faces.
5. **Dymaxion Net:** Full-screen SVG "Bucky" overlay unfolding the dome into a flat icosahedron net.
6. **HUD Telemetry:** DUNA board, System board, LED controller (collapsible).
7. **Agent Integration:** MCP server (4 tools) + WebMCP hooks.

---

## 2. Dependency Graph

```
┌─ Vite 8 (bundler)
├─ React 19 (UI)
├─ Three.js 0.172 (3D math)
│  ├─ @react-three/fiber (R3F canvas)
│  ├─ @react-three/drei (camera, lights)
│  └─ @react-three/postprocessing (bloom, FX)
├─ Zustand v5 (state)
│  ├─ shipStore (LED settings, docking, coherence)
│  └─ useSovereignStore (12-room state, K4, identity)
├─ IndexedDB (p31-genesis, p31-relay-queue, p31-error-log)
├─ PGLite (idb://p31-ship — historical ledger)
├─ Cloudflare Workers (session telemetry, WebRTC signaling)
└─ @sentry/react (error tracking, traces)
```

---

## 3. Module Topology

### 3.1 Rendering Pipeline

```
App
 ├─ initSovereignBridge()           [imports sovereignStore, shipStore]
 ├─ installVerifyHooks()            [sets __p31_domeStructure, __p31_ship, __p31_led]
 ├─ useWebMCP()                     [registers MCP tools + browser dispatch]
 └─ Canvas (@react-three/fiber)
     ├─ EffectComposer (UnrealBloomPass)
     ├─ Lens (3 lights: ambient, point, directional)
     ├─ OuterDome (radius 12, 480 edges, tetra frame, 320 face targets)
     ├─ InnerDome (radius 2.5, stat nodes, wireframe)
     ├─ TetraCraft (camera-relative tetra, wobbles)
     ├─ CameraRig (OrbitControls, auto-rotate, damping 0.08)
     ├─ AmbientField (2000 points, density ∝ coherence)
     ├─ Edges (node pairs, quadratic bezier, opacity ∝ coherence)
     ├─ Nodes (12 sphere cores with glow/halo)
     ├─ InstancedEdges (perf: cylinder instancing)
     ├─ DataCard (projected node info, click-to-select)
     └─ SpoonPulse (bottom-left orb, color by spoons)

HUD Overlays (conditional, collapsible)
 ├─ DunaBoard (left rail, data-testid="duna-board")
 ├─ SystemBoard (right rail, data-testid="system-board")
 ├─ LedController (bottom, data-testid="led-controller", data-collapsed="true|false")
 ├─ DataControls (mode switcher, data-testid="data-controls")
 ├─ DatasetPanel (dataset picker/upload, data-testid="dataset-panel")
 ├─ Legend (dataset color ramp)
 ├─ TimeControls (timeline scrubber for time-series datasets)
 ├─ ExportButton (share/export dataset)
 ├─ FaceInfo (selected face detail)
 ├─ Onboarding (first-run dataset help)
 └─ BuckyView (full-screen Dymaxion net overlay)

Dataset Layer (src/engine + src/store)
 ├─ datasetStore (buckyMode, dataset list, active dataset, legend)
 ├─ datasetParser (JSON + HAPI + SDG parsing → FaceData[])
 ├─ faceMapper (maps dataset vertices/faces onto 320 dome faces)
 ├─ timeSeries (timeline indexing of datasets)
 ├─ dataConnectors / hapiConnector (external dataset sources)
 └─ share (export/share payload builder)
```

### 3.1.1 Dymaxion Net (Bucky Mode)

- **`engine/dymaxion.ts`** — `buildDymaxionNet(faceData)` places the 320 dome faces inside the verified Wikipedia "Icosahedron flat.svg" 3-row band (20 equilateral cells, spanning-tree dual graph, zero overlaps). `buildConnectionSegments` links faces with adjacency arcs.
- **`cockpit/BuckyView.tsx`** — full-screen SVG overlay: cell outlines, one circle per face (colored from the active dataset), connection arcs, click-to-select (mirrors 3D port selection), hover glow, Escape / close button to exit.
- Toggled by `buckyMode` in `datasetStore` via the **Bucky** button in `DataControls`.
- Cell→base-face embedding: `T 0..4 → 0,1,5,15,6`, `D 5..9 → 4,2,19,10,16`, `U 10..14 → 3,9,14,11,7`, `B 15..19 → 17,12,13,18,8`.

### 3.2 Engine Layer (Phases 1–5)

All modules carry the **contested-science** disclaimer. The math is a metaphor; implementations are pure functions that assert engine behavior only.

| Phase | Module | Purpose | Tests |
|-------|--------|---------|-------|
| **1** | `stateEngine.ts` | SIC-POVM d=2 measurement: passport observables (spoons, care, engagement) → qubit density matrix → 4-mode prob. | `stateEngine.test.ts` |
| **2** | `k4Binding.ts` | K₄ skeleton: 4 vertices, 6 edges, edge health from relay latency. | `k4Binding.test.ts` |
| **3** | `coherence.ts` | Posner model: spoons/engagement/entropy → [0,1] coherence, field chaos, Fawn-Guard gate. | `coherence.test.ts` |
| **4** | `layoutField.ts` | Morphogenetic layout: FNV-1a hashed panel layout, time/energy drift. | `layoutField.test.ts` |
| **5** | `feedbackLoop.ts` | EWMA memory: fold outcomes, modulate measurement, converge (ALPHA=0.15). | `feedbackLoop.test.ts` |
| **—** | `lib/engine/ricci.ts` | Ricci-style curvature from latency + noise; resilience, scale factor. | `ricci.test.ts` |
| **—** | `lib/engine/fawn.ts` | Fawn-Guard: over-apology, self-diminishing, permission-seeking detection. | `fawn.test.ts` |
| **—** | `lib/engine/larmor.ts` | ³¹P Larmor reference (172.35 MHz → 863 Hz fifth-harmonic audio). | `larmor.test.ts` |
| **—** | `lib/engine/kenosisMesh.ts` | Kenosis mesh handshake state contract (stub, no central server). | `kenosisMesh.test.ts` |

**Result:** 18 test files, 193 tests, 100% pass rate.

### 3.3 State Management

#### shipStore (Zustand, persisted)
```typescript
interface ShipStore {
  // Docking
  dockedPorts: number;
  memberCount: number;
  dunaTarget: number;
  
  // Coherence
  coherence: number;          // [0,1]
  noise: number;              // network noise
  
  // Observables
  spoons: number;             // [0,5]
  engagement: number;         // [0,10]
  careScore: number;          // [0,100]
  didKey: string;             // did:key Ed25519
  
  // Display
  viewMode: 'cockpit' | 'classic';
  selectedPort: number | null;
  hoveredPort: number | null;
  
  // LED Control
  ledMode: 'rainbow' | 'chase' | 'solid' | 'breath' | 'gradient' | 'dual-chase' | 'off';
  ledSpeed: number;           // [0,10]
  ledColor: string;           // hex
  ledBrightness: number;      // [0,100]
  ledColors: string[];        // palette
  ledCollapsed: boolean;
}
```

#### datasetStore (Zustand)
```typescript
interface DatasetStore {
  buckyMode: boolean;          // Dymaxion overlay toggle
  activeDatasetId: string | null;
  datasets: Dataset[];         // loaded datasets (name, source, timestamps)
  legend: LegendDef | null;    // color ramp for the active dataset
  timeStep: number;            // active timeline index
  setBuckyMode(mode: boolean): void;
  // ... dataset CRUD + selection
}
```

`useActiveFaceData()` / `useActiveVertexData()` derive per-face color/value
from the active dataset for both the 3D dome and the Bucky overlay.

#### useSovereignStore (in-memory, no middleware)
```typescript
interface SovereignState {
  // UI/Nav
  viewMode: string;
  cameraMode: 'free' | 'dome' | 'screen';
  openOverlay: string | null;
  
  // Audio
  audioEnabled: boolean;
  masterVolume: number;
  
  // Coherence
  coherence: number;
  noiseFloor: number;
  fawnGuard: FawnThreshold;
  
  // Identity, Radio, K4, Mesh, Skin, etc. (12 slices)
  // ...
}
```

#### Bridge (src/bridge/sovereign.ts)
- **Direction:** Sovereign (source of truth) → Ship (rendering).
- **Synced fields:** spoons, coherence, engagement, didKey.
- **Emitted events:** `p31:sovereign-spoons`, `p31:shell-spoons`, `p31:shell-persona`.

### 3.4 Geodesic Dome Geometry

```
icosahedron
  ├─ 12 vertices (golden ratio φ = 1.618034)
  ├─ 20 faces
  └─ Subdivision → detail 2
      ├─ 642 vertices
      ├─ 480 edges
      └─ 320 faces
         └─ 20 segments per edge (NeoPixel frame)
            = 9600 total segments
```

**Parameters:**
- `DOME_RADIUS = 12`
- `INNER_RADIUS = 2.5`
- `PORT_COUNT = 320` (one per dome face)
- `SEGMENTS_PER_EDGE = 20`
- `PIXEL_RADIUS = 0.045`
- `PIXEL_GAP = 0.01`
- `TETRA_FRAME_EDGES = 6`
- `LAYERS = 4`

**Rendering:**
- **OuterDome:** Instanced cylinders (NeoPixelFrame), 480 edges lit, 320 invisible face hit targets at centroids.
- **TetraCraft:** Camera-relative regular tetrahedron (scaling 0.5), sin-wave wobble.
- **InnerDome:** Wireframe sphere (2.5), additive blend `#d9a066`.
- **Nodes:** 12 sphere cores (glow + halo), click-selectable.
- **Edges:** Quadratic bezier curves (opacity ∝ coherence + spoons).
- **BuckyView:** SVG Dymaxion overlay (DOM, above WebGL canvas), toggled via `buckyMode`.

---

## 4. Data Flow

### 4.1 Bootstrap Sequence

1. **Vite entry** (`src/main.tsx`): pre-paint theme restore, Sentry init.
2. **App root** (`src/App.tsx`):
   - `initSovereignBridge()` — sync sovereign → ship.
   - `installVerifyHooks()` — set `__p31_domeStructure`, `__p31_ship`, `__p31_led`.
   - `useWebMCP()` — register MCP tools.
   - Hydrate shipStore from sovereignStore.
   - Subscribe stores → DOM attributes.
   - Render Canvas + HUD overlays.

### 4.2 LED Control Flow

```
User (UI)
  → LedController.tsx (collapsible panel)
    → shipStore.setLedMode / setLedSpeed / setLedBrightness
      → Zustand persist (localStorage)
      → MCP tool: neo_pixel_control (optional, $0.01)
        → spaceship-relay Worker
          → actual NeoPixel hardware (future)
```

**Current state (v1.2.0):** UI controls update shipStore and can call MCP tool. Hardware integration is pending.

### 4.3 State Persistence

| Storage | Key | Writer | TTL |
|---------|-----|--------|-----|
| localStorage | `p31-ship-state` | shipStore | persistent |
| IndexedDB | `p31-genesis` | identity module | persistent |
| IndexedDB | `p31-relay-queue` | offline service | until sync |
| PGLite | `idb://p31-ship` table: `ledger` | ledgerAppender | permanent |

---

## 5. Contract Surfaces

### 5.1 Window Globals (Verify Hooks)
```javascript
__p31_domeStructure  // { layers: 4, radius: 12, ports: 320, neoPixelSegments: 9600, ... }
__p31_ship           // { spoons, coherence, engagement, didKey, ... }
__p31_led            // { mode, speed, color, brightness, colors, collapsed }
```

### 5.2 DOM Contract
```html
<div data-testid="duna-board">...</div>
<div data-testid="system-board">...</div>
<div data-testid="led-controller" data-collapsed="true|false">...</div>
```

### 5.3 MCP Server (cli/spaceship-server.js)

| Tool | Input | Output |
|------|-------|--------|
| `duna_status` | `{}` | `{ dockedPorts, memberCount, target }` |
| `system_health` | `{}` | `{ coherence, noise, health }` |
| `dome_structure` | `{}` | Dome metadata (layers, edges, segments, ...) |
| `neo_pixel_control` | `{ mode, speed, color, brightness }` | `{ status: 'ok' }` |

### 5.4 WebMCP (Chrome Origin Trial)
```javascript
navigator.modelContext.registerTool('duna_status', ...);
navigator.modelContext.registerTool('duna_set_target', { target: number });
```

---

## 6. Testing & Verification

### 6.1 Unit Suite (Vitest)
- 24 test files covering all engine phases + dataset layer + Dymaxion net + overwork prompt.
- 224 tests, 100% pass rate.
- Run: `pnpm test`.

### 6.2 E2E Suite (Playwright)
- Sections A–G against the live Pages deploy.
- Validates dome geometry, HUD boards, LED controller, persistence, cross-app state.
- Run: `node scripts/verify-ship.cjs`.

### 6.3 CI Pipeline
- `.github/workflows/test.yml` (fixed in v1.1.0).
- Triggers on `packages/spaceship-earth/**` changes.
- Runs: `corepack enable && pnpm install && pnpm build && pnpm deploy`.

---

## 7. Cross-App State (Phase 7-C)

**Status:** Production (v1.0.0 — "The Cage Holds")

Spaceship Earth synchronizes state with the P31 Sovereign Shell via the same 3-tier mechanism:

**Tier 1: Same-Browser (BroadcastChannel)**
- Channel: `p31-cross-app-state`
- Instant sync between Shell ↔ Spaceship tabs

**Tier 2: Same-Device (localStorage)**
- Key: `p31-cross-app-state`
- Persists across sessions

**Tier 3: Cross-Device (HTTP Polling)**
- Polls `https://p31-shell.trimtab-signal.workers.dev/api/shell-state` every 5s
- In-memory store in `spaceship-relay` Worker

**Hook:** `src/hooks/useCrossAppState.ts` — `createCrossAppState()` initializes sync.

**UI Signal:** `src/hud/HUDShell.tsx` renders a `CrossAppIndicator` pill showing `shell: X/5` (shell's current spoon level).

**Worker Endpoints (`worker/index.ts`):**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/spaceship-state` | Return in-memory cross-app state |
| POST | `/api/spaceship-state` | Merge JSON into in-memory state |
| GET | `/api/status` | Check shell health + spaceship state |

---

## 8. Known Limitations & Errata (v1.2.0)

| ID | Issue | Status |
|----|-------|--------|
| E-R1 | Sibling workflows (`bonding.yml`, etc.) still use stale `software/` paths | Documented; out of scope |
| E-R2 | `spaceship-state.json` not yet created in `~/p31-agents/` | Lazy-written on first MCP mutation |
| E-R3 | `@p31/tetra` alias points to nonexistent path | Verify consumers or remove alias |
| E-R4 | RUNBOOK.md predates engine layer + verify-base update | Refresh against MANUFACTURERS_MANUAL.md |

**Resolved / shipped in v1.2.0:**
- ✅ Engine layer implemented (9 modules, tests green).
- ✅ 320 face ports — all dome faces interactive.
- ✅ Dymaxion (Bucky) net overlay with verified geometry.
- ✅ Universal dataset layer (JSON / HAPI / SDG) + time-series + share.
- ✅ CI workflow paths fixed (root workspace pattern).

---

## 9. Next Steps (Post-v1.2.0)

1. **Hardware Integration:** Wire `neo_pixel_control` MCP tool to actual LED controllers.
2. **Mesh Sync:** Complete kenosis-mesh handshake (currently stub).
3. **K4 Visualization:** Render the K₄ graph as an overlaid wireframe (currently computed but not drawn).
4. **Dymaxion polish:** Perspective/cartographic projection option, face labels, print/export of the net.
5. **Performance:** Profile rendering at high segment counts; optimize LOD/culling if needed.

---

**Maintainer:** P31 Labs — trimtab-signal  
**License:** MIT  
**References:** [MANUFACTURERS_MANUAL.md](./MANUFACTURERS_MANUAL.md), [README.md](./README.md)
