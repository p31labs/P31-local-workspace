# Spaceship Earth — System Architecture

**Document ID:** P31-SE-ARCH-001 | **Version:** 1.1.0 | **Last Updated:** 2026-08-08

---

## 1. Overview

Spaceship Earth is a **sovereign, immersive 3D cockpit** for the P31 ecosystem. It orchestrates:

1. **Dome Visualization:** Geodesic shell with 9600 addressable LED segments.
2. **Sovereign State:** Zustand stores + PGLite ledger, bridged to the P31 Shell.
3. **Engine Layer:** Contested-science metaphor (SIC-POVM measurement, K₄ binding, coherence, feedback loops).
4. **HUD Telemetry:** DUNA board, System board, LED controller (collapsible).
5. **Agent Integration:** MCP server (4 tools) + WebMCP hooks.

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
     ├─ OuterDome (radius 12, 480 edges, tetra frame, 120 ports)
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
 └─ LedController (bottom, data-testid="led-controller", data-collapsed="true|false")
```

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

**Result:** 10 test files, 89 tests, 100% pass rate.

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
  
  // LED Control
  ledMode: 'rainbow' | 'chase' | 'solid' | 'breath' | 'gradient' | 'dual-chase' | 'off';
  ledSpeed: number;           // [0,10]
  ledColor: string;           // hex
  ledBrightness: number;      // [0,100]
  ledColors: string[];        // palette
  ledCollapsed: boolean;
}
```

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
- `PORT_COUNT = 120`
- `SEGMENTS_PER_EDGE = 20`
- `PIXEL_RADIUS = 0.045`
- `PIXEL_GAP = 0.01`
- `TETRA_FRAME_EDGES = 6`
- `LAYERS = 4`

**Rendering:**
- **OuterDome:** Instanced cylinders (NeoPixelFrame), 480 edges lit.
- **TetraCraft:** Camera-relative regular tetrahedron (scaling 0.5), sin-wave wobble.
- **InnerDome:** Wireframe sphere (2.5), additive blend `#d9a066`.
- **Nodes:** 12 sphere cores (glow + halo), click-selectable.
- **Edges:** Quadratic bezier curves (opacity ∝ coherence + spoons).

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

**Current state (v1.1.0):** UI controls update shipStore and can call MCP tool. Hardware integration is pending.

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
__p31_domeStructure  // { layers: 4, radius: 12, ports: 120, neoPixelSegments: 9600, ... }
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
- 10 test files covering all engine phases.
- 89 tests, 100% pass rate.
- Run: `pnpm test`.

### 6.2 E2E Suite (Playwright)
- 186+ checks across 7 sections (A–G).
- Validates dome geometry, HUD boards, LED controller, persistence.
- Run: `node scripts/verify-ship.cjs`.

### 6.3 CI Pipeline
- `.github/workflows/spaceship-earth.yml` (fixed in v1.1.0).
- Triggers on `packages/spaceship-earth/**` changes.
- Runs: `corepack enable && pnpm install && pnpm build && pnpm deploy`.

---

## 7. Known Limitations & Errata (v1.1.0)

| ID | Issue | Status |
|----|-------|--------|
| E-R1 | Sibling workflows (`bonding.yml`, etc.) still use stale `software/` paths | Documented; out of scope for v1.1.0 |
| E-R2 | `spaceship-state.json` not yet created in `~/p31-agents/` | Lazy-written on first MCP mutation |
| E-R3 | `@p31/tetra` alias points to nonexistent path | Verify consumers or remove alias |
| E-R4 | RUNBOOK.md predates engine layer + verify-base update | Refresh against MANUFACTURERS_MANUAL.md |

**All v1.1.0 errata marked as "resolved":**
- ✅ Engine layer implemented (9 modules, 89/89 tests).
- ✅ Verify BASE updated to `bf53b085` (live deploy confirmed).
- ✅ CI workflow paths fixed (root workspace pattern).

---

## 8. Next Steps (Post-v1.1.0)

1. **Hardware Integration:** Wire `neo_pixel_control` MCP tool to actual LED controllers.
2. **Mesh Sync:** Complete kenosis-mesh handshake (currently stub).
3. **K4 Visualization:** Render the K₄ graph as an overlaid wireframe (currently computed but not drawn).
4. **Performance:** Profile rendering at high segment counts; optimize LOD/culling if needed.

---

**Maintainer:** P31 Labs — trimtab-signal  
**License:** MIT  
**References:** [MANUFACTURERS_MANUAL.md](./MANUFACTURERS_MANUAL.md), [README.md](./README.md)
