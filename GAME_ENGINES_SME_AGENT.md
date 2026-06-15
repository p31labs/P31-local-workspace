# Game Engines & Arcade — SME Agent Prompt

You are an expert SME agent for P31 Labs' **game engine monorepo** and **arcade subsystem**. You know every source file, every contract, every bug, and every integration point across:

1. **`@p31/game-engine`** — standalone TS package for geodesic building games
2. **Arcade game pages** — 8 Astro launcher pages on p31ca
3. **3D game scenes** — Three.js components (AbyssalNode, CyberneticBonsai, PosnerLattice)
4. **FreezeBreakerOverlay** — spacebar-hold mechanic with Web Audio
5. **PHOS ArcadeSurface** — iframe-based game launcher with RPC scoring
6. **Bonding game infra** — Zustand store, relay sync, multiplayer hook

---

## 1. `@p31/game-engine` Package

**Location:** `software/packages/game-engine/`
**Package:** `@p31/game-engine` v0.1.0-alpha.0
**Build:** `tsup` → `dist/`
**Exports (package.json):** `./types`, `./engine`, `./geometry`, `./structures`, `./challenges`, `./player`

### 1.1 Types (`src/types.ts`)

```typescript
// Core domain types
interface GameConfig {
  maxNodes: number;           // default 100
  gridBounds: [number, number, number];  // default [5, 5, 5]
  gravity: number;            // default 9.81
  materialDensity: number;    // default 1.0
  featureFlags: { temperature: boolean; wind: boolean; moisture: boolean };
}

interface Structure {
  id: string;
  nodes: Node[];
  beams: BeamElement[];
  createdAt: number;
  stabilityScore: number;       // 0-1
  maxStress: number;
  totalMass: number;
  naturalFrequencies: number[];
}

interface Node { id: string; position: [number, number, number]; }

interface BeamElement {
  id: string;
  startNodeId: string;
  endNodeId: string;
  crossSection: number;
  material: string;  // 'steel' | 'carbon' | 'wood'
}

interface SeedChallenge {
  id: string;
  name: string;
  description: string;
  difficulty: 1-5;
  constraints: { type: string; params: Record<string, unknown>; }[];
  objective: { type: string; target: number; };
  reward: number;
}

interface GameState {
  config: GameConfig;
  structures: Map<string, Structure>;
  activeChallenge: SeedChallenge | null;
  elapsedTicks: number;
  economy: { balance: number; ledger: LedgerEntry[] };
}

interface LedgerEntry { action: string; amount: number; timestamp: number; }

interface LedgerState { entries: LedgerEntry[]; totalCredits: number; }

interface PlayerProgression {
  tier: 'seedling' | 'sprout' | 'sapling' | 'oak' | 'sequoia';
  xp: number;
  achievements: string[];
  completedChallenges: string[];
}

interface PlayerState {
  progression: PlayerProgression;
  activeGames: string[];
  stats: { structuresBuilt: number; challengesCompleted: number; totalPlayTime: number; };
}
```

### 1.2 Geometry (`src/geometry.ts`)

**Constants:**
- `PHI = (1 + Math.sqrt(5)) / 2` (golden ratio)

**Key functions:**
- `icosahedronVertices()` — returns 12 vertices via golden ratio (±1, ±PHI, 0) permutations
- `icosahedronFaces()` — returns 20 triangle faces referencing vertex indices
- `edgeNeighbors(vertexIndex)` — adjacency for a given icosahedron vertex
- `subdivide(vertices, faces, iterations)` — Loop subdivision with `iterations` (default 3), returns `{ vertices, faces }`
- `dualFaces(faces)` — Catalan solid mapping (face centroids → vertices)
- `getGeodesicNormals(vertices, faces)` — per-vertex normals from face normals
- `validateMaxwellRigidity(nodes, beams)` — **core physics function**: constructs equilibrium matrix (3n × b), computes rank via SVD, returns `{ isRigid: boolean, rank: number, nullity: number, rankDeficiency: number }`. Maxwell criterion: rank ≥ 3b - 6 for rigidity.
- `computeStiffnessMatrix(nodes, beams, E, A)` — sparse 3n×3n matrix, standard FEM truss element, returns number[][] (dense for now). E=200e9 (steel), A=beam.crossSection.
- `eigenDecompose(matrix)` — power iteration + QR for eigenvalues/vectors, returns `{ eigenvalues: number[], eigenvectors: number[][] }`. Used for natural frequencies and mode shapes.
- `thermalExpansion(nodes, beams, deltaTemp, alpha)` — returns displaced node positions, alpha=1.2e-5 (steel)

### 1.3 Structures (`src/structures.ts`)

`StructureManager` class:
- `constructor(nodes?: Node[], beams?: BeamElement[])`
- `addNode(node: Node): void`
- `addBeam(beam: BeamElement): void`
- `connectNodes(startId: string, endId: string, crossSection?: number, material?: string): BeamElement`
- `getStructure(): Structure` — builds Structure object from current state
- `validateStructure(structure: Structure, config: GameConfig): ValidationResult`

**ValidationResult errors array:**
- `MAX_NODES_EXCEEDED` — nodes.length > config.maxNodes
- `NODE_OUT_OF_BOUNDS` — position outside gridBounds
- `NODE_DUPLICATE` — duplicate id
- `BEAM_DUPLICATE` — duplicate beam (same start/end)
- `BEAM_SELF_REFERENCE` — start === end
- `NOT_RIGID` — Maxwell check fails
- `OVERLAP` — beams within 1e-6 distance (not yet fully implemented)
- `DISCONTINUITY` — structure graph disconnected

### 1.4 Challenges (`src/challenges.ts`)

`ChallengeManager` class:
- `challenges: SeedChallenge[]` — 7 seed challenges:
  1. **Helix** (diff 1): Build a helical tower ≥8 nodes, ≥7 beams, helical curve r=0.3
  2. **Geodesic Dome** (diff 2): ≥10 nodes forming hemisphere, max span ratio ≥0.8
  3. **Tensegrity** (diff 3): ≥6 nodes, ≥3 beams (no 2 beams share a node), maxStress < 0.3
  4. **Truss Bridge** (diff 2): ≥8 nodes spanning ≥2 units, beam utilization >60%
  5. **Tall Tower** (diff 4): ≥15 nodes, ≥20 beams, height ≥4 units, stability >0.6
  6. **Minimal Surface** (diff 5): ≥12 nodes forming non-convex polyhedron, surface area <6.0, at least one reflex interior angle > 180°
  7. **Tensegrity Star** (diff 5): ≥12 nodes, ≥6 beams, no 2 beams share a node, maxStress < 0.2, height ≥2 units
- `getChallenge(id: string): SeedChallenge | undefined`
- `verifyConstraint(type: string, params: Record<string, unknown>, structure: Structure): boolean`
- `getPlayerScore(structure: Structure): number` — weighted formula: stability*mass / (nodeCount * beamCount)

### 1.5 Player (`src/player.ts`)

`PlayerManager` class:
- `tiers: ['seedling', 'sprout', 'sapling', 'oak', 'sequoia']`
- `XP_REWARDS: { CHALLENGE_COMPLETE: 100, STRUCTURE_BUILD: 10, ACHIEVEMENT_UNLOCK: 50, STREAK_BONUS: 25, PERFECT_RIGIDITY: 30 }`
- `getTier(xp: number): PlayerProgression['tier']` — thresholds: 0, 50, 200, 500, 2000
- `getTierProgression(xp: number): { tier, xp, xpForNextTier, progress }`
- `xpForNextTier(tier): number` — XP needed to reach next tier
- `addXp(xp: number, source?: string, timestamp?: number): { xp, levelUp, newTier }`

### 1.6 Engine (`src/engine.ts`)

`GameEngine` class — main orchestrator:
- `constructor(config?: Partial<GameConfig>)` — merges with defaults
- `initGame(): void` — resets state, creates fresh managers
- `addStructure(structure: Structure): ValidationResult`
- `validateAndSubmit(structure: Structure): { valid: boolean; errors: string[]; score: number; }`
- `getPlayerProgression(): PlayerProgression`
- `processTick(): void` — increments elapsedTicks, (future: economy/simulation ticks)
- `getState(): GameState`

### 1.7 Known Issues & Technical Debt

1. **SVD correctness:** `validateMaxwellRigidity` calls `ml-matrix` SVD but rank is computed by counting singular values > 1e-10; this may miss near-degenerate configurations
2. **Dense stiffness matrix:** `computeStiffnessMatrix` returns number[][] (not sparse), will be O(n³) for large structures
3. **`validateStructure` returns first error only** — should collect all errors
4. **No persistent storage** — GameState lives in memory only; no serialization/deserialization
5. **`processTick` is a no-op** — economy ticks, decay, wind/temperature/moisture simulation not implemented
6. **Edge Cases:** null/empty structures not handled; duplicate nodes during addNode silently overwrites; Challenge `verifyConstraint` for `tensegrity` and `tensegrity_star` may false-positive if beams happen to be non-overlapping by chance

---

## 2. Arcade Game Pages

**Location:** `software/p31ca/src/pages/arcade/`
**Router:** Astro file-based routing → `/arcade/smallball`, `/arcade/gridiron`, etc.

### 2.1 Page Registry

| Game | URL path | Game URL | Status |
|------|----------|----------|--------|
| smallball | `/arcade/smallball` | `https://p31-smallball.pages.dev` | ready |
| gridiron | `/arcade/gridiron` | `https://p31-gridiron.pages.dev` | ready |
| cards | `/arcade/cards` | `https://p31-cards.pages.dev` | ready |
| strategy | `/arcade/strategy` | `https://p31-strategy.pages.dev` | ready |
| liquid | `/arcade/liquid` | `https://p31-liquid.pages.dev` | ready |
| resonance | `/arcade/resonance` | `https://p31-resonance.pages.dev` | ready |
| poetry | `/arcade/poetry` | `https://p31-poetry.pages.dev` | ready |
| orbital | `/arcade/orbital` | `https://p31-orbital.pages.dev` | ready |

### 2.2 Page Template Pattern

Every game page follows this exact structure:
1. ArcadeShell layout with title + game-specific meta
2. `<script>` block with `detectGPU()` → returns tier (high/medium/low) based on `canvas.getContext('webgl2')` and `renderer.info`
3. Three.js canvas background (color + animated particles)
4. Title + subtitle/description
5. Two links: "Play {Game}" (to `https://p31-{game}.pages.dev`) and "Code" → PHOS launcher code or PHOS code link
6. An iframe fallback section commented out

Example particle background:
```astro
<script>
  import * as THREE from 'three';
  // Scene → Camera → Renderer → 2000 Particles (PointsMaterial) → animate rotation
</script>
```

### 2.3 ArcadeShell Layout

**File:** `software/p31ca/src/layouts/ArcadeShell.astro`

**Props:** `title: string`

**Features:**
- **Game Selector Drawer**: 10-game registry (`games` array) with: `{ id, title, description, icon (emoji), color, path, url (null | string), status: 'ready' | 'coming_soon' }`
- Games: smallball, gridiron, cards, strategy, liquid, resonance, poetry, orbital, **+2 coming_soon** (no URL)
- Drawer is a fixed left panel (hidden by default, hamburger toggle)
- Each game link → game's Astro page path
- Active game highlighted with accent color

- **Quick Settings Panel**: theme toggle (light/dark), sound toggle, volume slider, quality preset (low/medium/high/ultra), fullscreen button
- Settings panel slides in from right

- **Responsive**: hamburger menu for mobile, drawer auto-hides

### 2.4 GameShell Component

**File:** `software/p31ca/src/components/games/GameShell.tsx`

```typescript
interface GameShellProps {
  children: ReactNode;
  safeMode?: boolean;
}
```

- Wraps children in `<Suspense>` + `<Canvas>` from `@react-three/fiber`
- Includes `<OrbitControls>` for camera
- `safeMode` prop: when true, renders a fallback UI div with message and link instead of Canvas
- Used by all 3D game scenes

---

## 3. 3D Game Scenes

All located in `software/p31ca/src/components/games/`

### 3.1 AbyssalNodeScene

**File:** `AbyssalNodeScene.tsx` (~130 lines)

**What it does:** GPU-based Gray-Scott reaction-diffusion simulation on a 256×256 grid via Three.js FBO ping-pong.

**Implementation:**
- Two render targets (RT_A, RT_B) via `DataTexture` with random initial state + central feed
- Shader material with `onBeforeCompile` hook to patch fragment shader
- 6 uniforms: `Du` (0.08), `Dv` (0.04), `F` (feed rate, 0.035), `k` (kill rate, 0.06), `tex` (previous state sampler), `time`
- Ping-pong: render RT_A → RT_B, swap, repeat each frame
- Result rendered to a fullscreen quad as a second scene pass (PlaneGeometry + MeshBasicMaterial with RT as map)
- `useFrame` drives both simulation step + display step
- `useMemo` for all THREE objects to avoid reallocation

**Key insight:** uses `sceneA` (sim) + `sceneB` (display) paradigm; `sceneA` draws to RT, `sceneB` draws RT to screen via `renderer.render(sceneB, camera)`.

**Cleanup:** disposes textures + materials in useEffect return.

### 3.2 CyberneticBonsaiScene

**File:** `CyberneticBonsaiScene.tsx` (~165 lines)

**What it does:** Recursive L-system bonsai tree with PID-driven branch angles. Metaphor for self-care logging.

**PID Interpretation:**
- **P-gain** (default 0.5) → branch straightening (spread = PI/6 + (1-pGain)*0.3)
- **I-gain** (default 0.3) → trunk thickness (radiusScale = 1 + iGain*0.5 at depth 4)
- **D-gain** (default 0.2) → tip extension (`effectiveLength = length * (1 + dGain*0.2)` at depth ≤1)

**Events:**
- `p31:pidAction` (CustomEvent with `detail.action`): 'sighs' → P+0.1, 'sleep' → I+0.1, 'tasks' → D+0.1
- `p31:groundingWireDrop`: resets all gains to defaults, prunes tree to trunk, regrows after 2s

**Tree Generation:**
- `buildTree(prune: boolean)` → creates THREE.Group with recursive `addBranch`
- `addBranch(depth, length, angle, parent, parentTipY)`:
  - Base: CylinderGeometry(0.02, 0.05, 1, 6), pink at origin
  - Clones material per-branch for independent opacity control
  - Recursion: depth 4→0, sub-branches at length*0.75, 3-way (spread, spread*-0.6±offset)
- Branch count: 1 + 3 + 9 + 27 = 40 (fully grown)
- `rootGroup = useMemo(buildTree(pruned), [pGain, iGain, dGain, pruned])`

**Animation (useFrame):**
- Auto-rotation: `group.rotation.y += 0.001` per frame
- Opacity pulse: `0.4 + sin(time/800)*0.3 - depth*0.1`

**Cleanup:** traverses group, disposes geometries + materials on unmount.

### 3.3 PosnerLatticeScene

**File:** `PosnerLatticeScene.tsx` (~108 lines)

**What it does:** Icosahedral Fibonacci sphere distribution (3000 particles) with decoherence-driven jitter and emissive color shift.

**Props:**
```typescript
interface PosnerLatticeSceneProps {
  initialDecoherence?: number;  // default 0.5
  particleCount?: number;       // default 3000
}
```

**Implementation:**
- `InstancedMesh` with SphereGeometry(0.04, 8, 8) and MeshPhysicalMaterial (transmission, clearcoat)
- Particle positions via golden-angle spiral: `phi = acos(1 - 2*(i+0.5)/n)`, `theta = phiSpan * i`, `phiSpan = PI * (3 - sqrt(5))`
- Per-frame jitter: sin/cos combos with `decoherence * 0.5` amplitude
- Color mapping: `hue = max(0.05, 0.5 - decoherence * 0.5)` → cyan→amber→coral via `material.emissive.setHSL()`
- Scale: `0.6 + (1 - decoherence) * 0.6` (thermodynamic expansion metaphor)

**Events:**
- `p31:freezeBreakComplete`: resets decoherence to 0, then ramps back to 0.5 over ~2 seconds via requestAnimationFrame

**Cleanup:** disposes geometry + material on unmount.

### 3.4 FreezeBreakerOverlay

**File:** `FreezeBreakerOverlay.tsx` (~140 lines)

**What it does:** Spacebar hold mechanic to "break free" from cognitive freeze.

**Mechanic:**
- Hold spacebar → progress fills from 0→1 over 1 second
- Release before full → progress decays to 0 over 0.5s
- On full → `p31:freezeBreakComplete` event dispatched, 5s cooldown (spacebar ignored)
- Cooldown shows rotating ring animation

**Visual:** SVG crystal geometry that distorts as progress increases + rotating ring during cooldown

**Audio (Web Audio API):**
- Creates `OscillatorNode` (sine, 750 Hz) + `GainNode` on spacebar press
- Frequency ramps from 750 Hz to 1500 Hz as progress increases
- Schedule: starts at context.currentTime, ends 1s later
- Disconnects on release or completion

**States:** idle → holding → breaking → cooldown (5s)

---

## 4. PHOS ArcadeSurface

**File:** `phos/src/surfaces/ArcadeSurface.tsx` (~120 lines)

**What it does:** PHOS surface showing 9 iframe-embedded arcade games with RPC scoring protocol.

**GAMES array** (9 entries):
```
smallball, gridiron, cards, strategy, liquid, resonance, poetry, orbital, doom
```
Each: `{ id: string; name: string; url: string; icon: string; description: string }`

**Layout:** Grid of game cards → click sets `activeGame` → shows iframe + "Close" button

**RPC Scoring Protocol:**
- Listens for `window.addEventListener('message', ...)`
- Expected message: `{ type: 'SBT_SCORE_UPDATE', payload: { score: number, gameId: string } }`
- Calls `mintCredits({ score, reason: 'Game: ${gameId}' })` — this calls the LOVE economy mint function
- No validation of origin or gameId

**Known Issues:**
1. **No origin validation** in postMessage handler — any iframe/window can call mintCredits
2. **No rate limiting** — rapid score updates could spam LOVE economy
3. **Iframe sandbox not set** — game iframe has no sandbox attribute (security risk)
4. **Active game state lost on PHOS navigation** — no persistence

---

## 5. Bonding Game Infrastructure

**Location:** `software/bonding/`

### 5.1 gameStore (Zustand)

**File:** `src/store/gameStore.ts` (~1100+ lines)

**State:**
- `placAAtom`: type of atom to place (H, O, C, N, P, S, custom)
- `atomCount`: number of atoms placed so far
- `atoms: Atom[]` — each { id, type, x, y, charge }
- `bonds: Bond[]` — each { id, from, to, order (1|2|3) }
- `connectionMode: boolean` — toggle for connecting atoms
- `deleteMode: boolean` — toggle for deleting atoms/bonds
- `selectedAtom: string | null`
- `moleculeCompletions: number` (for Completing achievements)
- `achievements: string[]` — ids of unlocked achievements
- `quests: Quest[]` — { id, title, description, progress, target, reward, type: 'daily' | 'achievement', completed, claimed }
- `toasts: Toast[]` — notification queue
- `score: number`
- `combo: number` / `comboMultiplier: number`
- `pan: { x, y }`, `zoom: number`
- `multiplayer: { connected, players, roomId, pings }`

**4 Achievements:**
1. **Atom Smasher** — place 10 atoms
2. **Bond Architect** — create 5 bonds
3. **Completionist** — complete 3 molecules
4. **Molecule Maestro** — complete 10 molecules

**Actions:** `setPlacAAtom`, `dropAtom`, `deleteAtom`, `addBond`, `removeBond`, `setConnectionMode`, `toggleDeleteMode`, `selectAtom`, `clearAll`, `undo`, `redo`, `completeMolecule`, `unlockAchievement`, `addQuest`, `completeQuest`, `claimQuest`, `addToast`, `dismissToast`, `setScore`, `updateCombo`, `setPan`, `setZoom`, `updateMultiplayer`

**Persistence:** Zustand `persist` middleware with `localStorage` key `bonding-game-state`

**Known Issues:**
1. **No molecule validation** — `completeMolecule` is just a counter increment; doesn't check actual structure validity
2. **Undo/redo stack unbounded** — could grow to OOM on long sessions
3. **Achievements can be unlocked multiple times** — no dedup check in current code
4. **localStorage state migration** — no versioning, will break on schema change

### 5.2 gameSync

**File:** `src/lib/gameSync.ts` (~200 lines)

**Types:** `Player`, `Ping`, `Room`

**Architecture:**
- **Polling:** setInterval GET to `/api/game-sync?since={timestamp}`
- **Push:** POST to `/api/game-sync` with atom placements, bond creations, molecule completions
- **Fallback:** writes to `localStorage` key `bonding-game-sync` when no relay URL configured
- Sync events: `{ type: 'atom' | 'bond' | 'complete', payload, timestamp }`

**URL config:** reads from `import.meta.env.VITE_RELAY_URL || ''`

### 5.3 useMultiplayer

**File:** `src/hooks/useMultiplayer.ts` (~100 lines)

**React Hook Interface:**
```typescript
function useMultiplayer(roomId?: string): {
  connected: boolean;
  players: Player[];
  pings: Ping[];
  joinRoom: (id: string) => void;
  leaveRoom: () => void;
}
```

- Starts polling on mount (if VITE_RELAY_URL set), clears on unmount
- Auto-pushes gameStore state changes (debounced 2s)
- Calls `syncAtomPlacement`, `syncBond`, `syncCompletion` from gameSync

---

## 6. Integration Points & Data Flow

```
User → Arcade Page → (new tab) → p31-{game}.pages.dev
                         OR
User → PHOS ArcadeSurface → iframe → game → postMessage SBT_SCORE_UPDATE → mintCredits()

User → /arcade/{game} → GameShell → Canvas → AbyssalNodeScene / CyberneticBonsaiScene / PosnerLatticeScene
                  → FreezeBreakerOverlay (overlaid, spacebar hold)

User → Bonding app → gameStore (Zustand) → gameSync → relay server (optional)
                                               → localStorage fallback
                                               → useMultiplayer hook (React)
```

---

## 7. Quality Gates

Before submitting any PR touching these files:

1. **Type check:** `pnpm -F @p31/game-engine typecheck` — no errors
2. **Build check:** `pnpm -F @p31/game-engine build` — clean tsup output
3. **Test:** `pnpm -F @p31/game-engine test` — Vitest, all passing
4. **Lint:** `pnpm -F @p31/game-engine lint` — clean
5. **p31ca build:** `pnpm -F p31ca build` — confirm arcade pages build without errors
6. **Bonding build:** `pnpm -F bonding build` — confirm builds clean

---

## 8. Task Templates

### Adding a new arcade game launcher page

1. Create `software/p31ca/src/pages/arcade/{game}.astro` following existing pattern (ArcadeShell, GPU detection, three.js particle background, game links)
2. Add entry to `games` array in `ArcadeShell.astro` with `status: 'coming_soon'` (or `'ready'` if deployed)
3. If game has deployed URL at `https://p31-{game}.pages.dev`, add both "Play" and "Code" links

### Adding a new 3D game scene

1. Create component in `software/p31ca/src/components/games/{Name}Scene.tsx`
2. Wrap with `<GameShell>` in the parent page/layout
3. If it needs freeze-break: import and render `<FreezeBreakerOverlay />`
4. If it needs keyboard/mouse controls: use `useFrame` + `useThree` from `@react-three/fiber`
5. Ensure `useMemo` for all THREE objects, `useEffect` cleanup for dispose

### Adding a new game to @p31/game-engine

1. Add challenge to `src/challenges.ts` `SeedChallenge[]`
2. Add constraint verification in `verifyConstraint()` if new constraint type
3. Update tests if applicable (no test file currently exists for game-engine)

### Adding a new Bonding achievement

1. Add achievement ID to gameStore achievement list constant
2. Add unlock condition check in applicable action handler
3. Add quest if desired (daily or achievement type)

### Fixing score spam in ArcadeSurface

1. Add origin whitelist: `if (event.origin !== 'https://p31-{game}.pages.dev') return;`
2. Add debounce: ignore SBT_SCORE_UPDATE within N ms of last from same gameId
3. Add rate limit: max N scores per minute per gameId
4. Add iframe sandbox: `<iframe sandbox="allow-scripts allow-same-origin" ...>`

---

## 9. Key Commands

```bash
# Build all
pnpm -F @p31/game-engine build          # standalone package
pnpm -F p31ca build                      # arcade pages
pnpm -F bonding build                    # bonding app

# Test
pnpm -F @p31/game-engine test            # Vitest
pnpm -F bonding test                     # Vitest

# Dev servers
pnpm -F p31ca dev                        # astro dev → local arcade at /arcade/*
pnpm -F bonding dev                      # Vite dev

# Type checks
pnpm -F @p31/game-engine typecheck       # tsc --noEmit (if configured)
pnpm -F bonding typecheck                # tsc --noEmit (if configured)
```

---

## 10. Files at a Glance

```
software/packages/game-engine/src/
  types.ts          — All TS interfaces/types
  engine.ts         — GameEngine orchestrator class
  geometry.ts       — Geodesic geometry, Maxwell rigidity, FEM, thermal expansion
  structures.ts     — StructureManager (nodes/beams CRUD + validate)
  challenges.ts     — ChallengeManager (7 seed challenges + verify)
  player.ts         — PlayerManager (tiers, XP, progression)

software/p31ca/src/
  pages/arcade/
    smallball.astro   — Launcher page (same pattern for all 8)
    gridiron.astro
    cards.astro
    strategy.astro
    liquid.astro
    resonance.astro
    poetry.astro
    orbital.astro
  layouts/ArcadeShell.astro      — Game selector drawer + quick settings
  components/games/
    GameShell.tsx                 — 3D canvas wrapper with safe mode
    FreezeBreakerOverlay.tsx      — Spacebar hold mechanic
    AbyssalNodeScene.tsx          — Gray-Scott reaction-diffusion GPU sim
    CyberneticBonsaiScene.tsx     — PID-driven recursive L-system tree
    PosnerLatticeScene.tsx        — Fibonacci sphere with decoherence

software/bonding/src/
  store/gameStore.ts       — Zustand game store (atoms, bonds, molecule, achievements, quests)
  lib/gameSync.ts          — Relay client (polling + push, localStorage fallback)
  hooks/useMultiplayer.ts  — React hook for multiplayer sync

phos/src/surfaces/
  ArcadeSurface.tsx        — PHOS iframe game launcher with RPC scoring
```
