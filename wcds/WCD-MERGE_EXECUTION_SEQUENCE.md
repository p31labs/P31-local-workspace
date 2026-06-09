# WCD-MERGE EXECUTION SEQUENCE
## For Claude Code (Sonnet/CC — Mechanic Lane)
## Authored: Opus — Architect Lane
## Date: March 3, 2026
## Phase Gate: NOT EXECUTABLE UNTIL MARCH 11, 2026

---

# OPERATING RULES FOR THE MECHANIC

1. Execute wcds in sequence. Do not skip ahead.
2. Each WCD ends with a verification checklist. Every box must be green before proceeding.
3. If verification fails, STOP. Do not attempt to fix architecture — tag out to Opus.
4. Pre-patched code is provided where possible. Copy it exactly. Do not "improve" it.
5. The `bonding/` directory is a legal artifact. Modifications are limited to re-exports only.
6. Run `npx vitest run` in `bonding/` after EVERY WCD. If tests drop below 488, STOP.
7. Run `npx tsc --noEmit` in every modified package after EVERY WCD.
8. Commit after each WCD passes verification. Use the provided commit messages exactly.

---

# WCD-M01: WORKSPACE SCAFFOLDING
## Est: 30 minutes

### Objective
Create the npm workspace structure. No code changes to any existing package.

### File Manifest

**CREATE:**
```
software/packages/shared/package.json
software/packages/shared/tsconfig.json
software/packages/shared/src/index.ts
software/spaceship-earth/package.json
software/spaceship-earth/tsconfig.json
software/spaceship-earth/src/main.tsx
software/spaceship-earth/src/App.tsx
software/spaceship-earth/index.html
software/spaceship-earth/vite.config.ts
software/package.json  (workspace root)
```

**DO NOT TOUCH:**
```
software/bonding/**  (nothing. zero files.)
```

### Commands

```bash
cd software

# Create workspace root package.json
cat > package.json << 'EOF'
{
  "name": "p31-software",
  "private": true,
  "workspaces": [
    "bonding",
    "spaceship-earth",
    "packages/shared"
  ]
}
EOF

# Create shared package
mkdir -p packages/shared/src

cat > packages/shared/package.json << 'EOF'
{
  "name": "@p31/shared",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./events": "./src/events/index.ts",
    "./economy": "./src/economy/index.ts",
    "./telemetry": "./src/telemetry/index.ts",
    "./types": "./src/types/index.ts"
  }
}
EOF

cat > packages/shared/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "jsx": "react-jsx",
    "types": ["vite/client"]
  },
  "include": ["src"]
}
EOF

cat > packages/shared/src/index.ts << 'EOF'
// @p31/shared — System-wide shared modules
// Promoted from bonding/src/genesis/ in WCD-M02

export {};
// Populated in WCD-M02 after genesis module promotion
EOF

# Create subdirectories for future promotion
mkdir -p packages/shared/src/events
mkdir -p packages/shared/src/economy
mkdir -p packages/shared/src/telemetry
mkdir -p packages/shared/src/types

# Placeholder index files
echo "export {};" > packages/shared/src/events/index.ts
echo "export {};" > packages/shared/src/economy/index.ts
echo "export {};" > packages/shared/src/telemetry/index.ts
echo "export {};" > packages/shared/src/types/index.ts

# Create Spaceship Earth scaffold
mkdir -p spaceship-earth/src

cat > spaceship-earth/package.json << 'EOF'
{
  "name": "@p31/spaceship-earth",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.88.0",
    "three": "^0.159.0",
    "zustand": "^4.4.0",
    "@p31/shared": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/three": "^0.159.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
EOF

cat > spaceship-earth/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "types": ["vite/client"],
    "paths": {
      "@p31/shared": ["../packages/shared/src"],
      "@p31/shared/*": ["../packages/shared/src/*"]
    }
  },
  "include": ["src"],
  "references": [
    { "path": "../packages/shared" }
  ]
}
EOF

cat > spaceship-earth/vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@p31/shared': path.resolve(__dirname, '../packages/shared/src'),
    },
  },
});
EOF

cat > spaceship-earth/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Spaceship Earth — P31 Labs</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body, #root { width: 100%; height: 100%; overflow: hidden; background: #050505; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

cat > spaceship-earth/src/main.tsx << 'EOF'
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
EOF

cat > spaceship-earth/src/App.tsx << 'EOF'
import React from 'react';
import { Canvas } from '@react-three/fiber';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050505' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} />
        <mesh>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#4ecdc4" wireframe />
        </mesh>
      </Canvas>
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        color: '#888',
        fontFamily: 'monospace',
        fontSize: 12,
      }}>
        SPACESHIP EARTH — scaffold
      </div>
    </div>
  );
}
EOF
```

### Verification

```bash
# 1. Workspace resolves
cd software && npm ls 2>&1 | head -20

# 2. BONDING still builds independently
cd bonding && npx tsc --noEmit && npx vitest run
# MUST: 488+ tests, 0 type errors

# 3. Shared package compiles
cd ../packages/shared && npx tsc --noEmit

# 4. Spaceship Earth dev server starts
cd ../spaceship-earth && npm install && npx vite --host 0.0.0.0 &
# MUST: renders wireframe icosahedron at localhost:5173
# Kill after confirming: kill %1

# 5. No files in bonding/ were modified
cd ../bonding && git diff --name-only
# MUST: empty (zero changes)
```

### Commit

```
chore: scaffold npm workspace (bonding + spaceship-earth + @p31/shared)

Workspace root at software/package.json.
@p31/shared placeholder with events/economy/telemetry/types stubs.
Spaceship Earth scaffold with R3F canvas (wireframe icosahedron).
BONDING untouched — 488 tests green, zero modifications.

Ref: WCD-M01
```

---

# WCD-M02: PROMOTE GENESIS MODULES TO SHARED
## Est: 1 hour
## Depends: WCD-M01 verified

### Objective
Copy eventBus, economyStore, telemetryStore, and type definitions from `bonding/src/genesis/` to `packages/shared/`. Then update BONDING to re-export from shared.

### CRITICAL UNDERSTANDING

You are **copying** code, then making BONDING **re-export** from the shared copy. The behavior of BONDING must not change at all. The shared copy is the canonical version going forward. BONDING becomes a consumer of shared, not the owner.

### Step 1: Audit current genesis modules

```bash
cd software/bonding/src/genesis
ls -la
# Expected files:
#   eventBus.ts
#   economyStore.ts
#   telemetryStore.ts
#   genesis.ts          ← STAYS IN BONDING (bootstrap logic)
#   worker-telemetry.ts ← STAYS IN BONDING (court evidence relay)
#   types.ts            ← or similar type definitions
```

**Read every file before copying.** Understand the import graph. Map which files import from which. Note any imports from outside genesis/ (e.g., from `../store/gameStore`, `../data/`, etc).

### Step 2: Copy promotable modules

```bash
# Copy to shared — PRESERVE ORIGINALS until re-export is verified
cp eventBus.ts ../../packages/shared/src/events/eventBus.ts
cp economyStore.ts ../../packages/shared/src/economy/economyStore.ts
cp telemetryStore.ts ../../packages/shared/src/telemetry/telemetryStore.ts
```

**For type definitions:** Copy all shared types (event types, economy types, telemetry types) to `packages/shared/src/types/`. Types that are BONDING-specific (molecule types, achievement types) stay in BONDING.

### Step 3: Resolve imports in shared copies

The copied files will have import paths like `../store/gameStore` or `../data/elements`. These need to be severed. Shared modules must have ZERO imports from BONDING internals.

**Rule:** If a shared module imports from BONDING, extract the needed interface/type into `packages/shared/src/types/` and make the shared module import from there instead. The concrete implementation stays in BONDING.

Example — if `economyStore.ts` imports molecule types:
```typescript
// BEFORE (in bonding)
import type { MoleculeId } from '../data/molecules';

// AFTER (in shared)
// packages/shared/src/types/economy.types.ts
export type MoleculeId = string; // or whatever the actual type resolves to

// packages/shared/src/economy/economyStore.ts
import type { MoleculeId } from '../types/economy.types';
```

### Step 4: Update shared index files

```typescript
// packages/shared/src/events/index.ts
export { eventBus } from './eventBus';
export type { GameEvent, EventType } from './eventBus';
// ↑ adjust export names to match actual exports from eventBus.ts

// packages/shared/src/economy/index.ts
export { economyStore } from './economyStore';
// ↑ adjust to match actual exports

// packages/shared/src/telemetry/index.ts
export { telemetryStore } from './telemetryStore';
// ↑ adjust to match actual exports

// packages/shared/src/types/index.ts
export * from './economy.types';
export * from './event.types';
export * from './telemetry.types';

// packages/shared/src/index.ts
export * from './events';
export * from './economy';
export * from './telemetry';
export * from './types';
```

### Step 5: Make BONDING re-export from shared

Replace the **contents** of the original BONDING genesis files with re-exports. Do NOT delete the files — other BONDING code imports from these paths.

```typescript
// bonding/src/genesis/eventBus.ts — REPLACE ENTIRE CONTENTS WITH:
export { eventBus } from '@p31/shared/events';
export type { GameEvent, EventType } from '@p31/shared/events';
// ↑ Must re-export EVERY symbol that other bonding files import from this path

// bonding/src/genesis/economyStore.ts — REPLACE ENTIRE CONTENTS WITH:
export { economyStore } from '@p31/shared/economy';
// ↑ Plus any types other bonding files import

// bonding/src/genesis/telemetryStore.ts — REPLACE ENTIRE CONTENTS WITH:
export { telemetryStore } from '@p31/shared/telemetry';
// ↑ Plus any types
```

### Step 6: Update BONDING's tsconfig and package.json

Add workspace dependency and path alias:

```jsonc
// bonding/package.json — add to dependencies:
"@p31/shared": "workspace:*"
```

```jsonc
// bonding/tsconfig.json — add to compilerOptions.paths:
"@p31/shared": ["../packages/shared/src"],
"@p31/shared/*": ["../packages/shared/src/*"]
```

Update `bonding/vite.config.ts` — add resolve alias:
```typescript
resolve: {
  alias: {
    '@p31/shared': path.resolve(__dirname, '../packages/shared/src'),
  },
},
```

### DO NOT TOUCH

| File | Why |
|------|-----|
| `bonding/src/genesis/genesis.ts` | BONDING-specific bootstrap. References orphan recovery, IDB init. |
| `bonding/src/genesis/worker-telemetry.ts` | Court evidence relay. Hardcoded endpoints for Daubert chain-of-custody. |
| `bonding/src/store/gameStore.ts` | Game state. Never merges with Spaceship Earth. |
| `bonding/src/data/*` | Game content. Stays in the game. |
| `bonding/worker/*` | Cloudflare Worker. Separate deploy. Separate KV. |
| Any test file | Tests verify behavior. If behavior didn't change, tests don't change. |

### Verification

```bash
# 1. Shared compiles
cd software/packages/shared && npx tsc --noEmit
# MUST: 0 errors

# 2. BONDING compiles
cd ../bonding && npx tsc --noEmit
# MUST: 0 errors

# 3. BONDING tests pass — THIS IS THE CRITICAL CHECK
cd ../bonding && npx vitest run
# MUST: 488+ tests, ALL GREEN
# If ANY test fails: STOP. The re-export broke something.
# Do NOT fix the test. Fix the re-export.

# 4. BONDING builds for production
cd ../bonding && npx vite build
# MUST: clean build, no warnings about missing modules

# 5. Spaceship Earth still compiles
cd ../spaceship-earth && npx tsc --noEmit
# MUST: 0 errors
```

### Commit

```
refactor: promote Genesis Block shared modules to @p31/shared

eventBus, economyStore, telemetryStore now live in packages/shared/.
BONDING re-exports from @p31/shared — zero behavior change.
488 tests green. Genesis Block telemetry chain uninterrupted.
genesis.ts and worker-telemetry.ts remain BONDING-specific.

Ref: WCD-M02
```

---

# WCD-M03: EXPAND EVENT TYPES
## Est: 30 minutes
## Depends: WCD-M02 verified

### Objective
Add system-wide event types to `@p31/shared`. These are additive — no existing events change.

### File Manifest

**MODIFY:**
```
packages/shared/src/types/event.types.ts  (or wherever event types live after M02)
```

### Implementation

Open the event types file from WCD-M02. Add these new event types as a union with the existing BONDING events:

```typescript
// ADD to existing event type union — do not remove or rename existing types

// Navigation events
export type NavStateChangeEvent = {
  type: 'NAV_STATE_CHANGE';
  payload: { from: string; to: string; timestamp: number };
};

// Buffer events
export type BufferIngestEvent = {
  type: 'BUFFER_INGEST';
  payload: { messageId: string; voltage: number; timestamp: number };
};

// Spoon economy events
export type SpoonSpendEvent = {
  type: 'SPOON_SPEND';
  payload: { amount: number; reason: string; timestamp: number };
};

export type SpoonRestoreEvent = {
  type: 'SPOON_RESTORE';
  payload: { amount: number; source: string; timestamp: number };
};

// Health events
export type CalciumLoggedEvent = {
  type: 'CALCIUM_LOGGED';
  payload: { dose: number; timestamp: number };
};

// Work control events
export type WcdCompleteEvent = {
  type: 'WCD_COMPLETE';
  payload: { wcdId: string; timestamp: number };
};

// Expand the main union type to include new events
// e.g.: export type SystemEvent = GameEvent | NavStateChangeEvent | BufferIngestEvent | ...
```

**Adapt this to the actual type structure you find.** The pattern matters more than the exact code. New events extend the union. Old events are untouched.

### DO NOT TOUCH

Everything in `bonding/`. These new types are additive. BONDING doesn't use them. BONDING's existing event types remain as a subset of the expanded union.

### Verification

```bash
# 1. Shared compiles with new types
cd software/packages/shared && npx tsc --noEmit

# 2. BONDING still compiles (new types are additive, shouldn't break)
cd ../bonding && npx tsc --noEmit

# 3. BONDING tests still pass
cd ../bonding && npx vitest run
# MUST: 488+ green

# 4. Spaceship Earth compiles
cd ../spaceship-earth && npx tsc --noEmit
```

### Commit

```
feat: add system-wide event types to @p31/shared

NAV_STATE_CHANGE, BUFFER_INGEST, SPOON_SPEND, SPOON_RESTORE,
CALCIUM_LOGGED, WCD_COMPLETE. All additive — BONDING events
unchanged. 488 tests green.

Ref: WCD-M03
```

---

# WCD-M04: JITTERBUG 3D PORT
## Est: 2–3 hours
## Depends: WCD-M03 verified

### Objective
Port the Jitterbug Navigator from WCD-07 (SVG, 2D, in BONDING) to a full Three.js component in Spaceship Earth. Expand from 4 vertices (tetrahedron) to N vertices (cuboctahedron at full expansion).

### File Manifest

**CREATE in `spaceship-earth/src/`:**
```
components/JitterbugNavigator.tsx    # Main Three.js component
components/JitterbugGeometry.ts      # Vertex math (tetra → cubocta morph)
hooks/useQFactor.ts                  # Q-Factor calculation from vertex data
types/navigator.types.ts             # Vertex definitions
```

### Architecture

The Jitterbug Navigator is a Three.js mesh that morphs between:
- **Tetrahedron** (4 vertices) — low capacity / low spoons
- **Cuboctahedron** (12 vertices) — full capacity / high spoons

The morph parameter is `t ∈ [0, 1]` where `t=0` is tetrahedron and `t=1` is cuboctahedron. This maps to the operator's current spoon level normalized to `[0, 1]`.

Each vertex represents a cognitive domain. The vertex value (also `[0, 1]`) controls brightness/color of that vertex point.

### Vertex Definitions

```typescript
// spaceship-earth/src/types/navigator.types.ts

export interface JitterbugVertex {
  id: number;
  label: string;
  domain: string;
  value: number; // 0-1 normalized
  color: string; // hex
}

export const DEFAULT_VERTICES: JitterbugVertex[] = [
  { id: 0, label: 'Energy',        domain: 'spoons',       value: 0.5, color: '#FFD700' },
  { id: 1, label: 'Tasks',         domain: 'wcds',         value: 0.5, color: '#4ECDC4' },
  { id: 2, label: 'Environment',   domain: 'sensory',      value: 0.5, color: '#45B7D1' },
  { id: 3, label: 'Creation',      domain: 'output',       value: 0.5, color: '#96CEB4' },
  { id: 4, label: 'BONDING',       domain: 'play',         value: 0.0, color: '#FF6B6B' },
  { id: 5, label: 'Communication', domain: 'buffer',       value: 0.0, color: '#C9B1FF' },
  { id: 6, label: 'Legal',         domain: 'court',        value: 0.0, color: '#F7DC6F' },
  { id: 7, label: 'Health',        domain: 'calcium',      value: 0.0, color: '#82E0AA' },
];
```

### Geometry Math

The jitterbug transformation between tetrahedron and cuboctahedron vertices:

```typescript
// spaceship-earth/src/components/JitterbugGeometry.ts
import * as THREE from 'three';

// Tetrahedron vertices (t=0)
const TETRA_VERTICES = [
  new THREE.Vector3( 1,  1,  1),
  new THREE.Vector3( 1, -1, -1),
  new THREE.Vector3(-1,  1, -1),
  new THREE.Vector3(-1, -1,  1),
].map(v => v.normalize());

// Cuboctahedron vertices (t=1)
const CUBOCTA_VERTICES = [
  new THREE.Vector3( 1,  1,  0), new THREE.Vector3( 1, -1,  0),
  new THREE.Vector3(-1,  1,  0), new THREE.Vector3(-1, -1,  0),
  new THREE.Vector3( 1,  0,  1), new THREE.Vector3( 1,  0, -1),
  new THREE.Vector3(-1,  0,  1), new THREE.Vector3(-1,  0, -1),
  new THREE.Vector3( 0,  1,  1), new THREE.Vector3( 0,  1, -1),
  new THREE.Vector3( 0, -1,  1), new THREE.Vector3( 0, -1, -1),
].map(v => v.normalize());

/**
 * Interpolate between tetrahedron and cuboctahedron.
 * At t=0, returns 4 tetrahedron vertices.
 * At t=1, returns 12 cuboctahedron vertices.
 * Between: smoothstep interpolation with vertex count expanding at t>0.3.
 */
export function jitterbugVertices(t: number): THREE.Vector3[] {
  const clamped = Math.max(0, Math.min(1, t));

  if (clamped < 0.3) {
    // Pure tetrahedron phase — breathe the 4 vertices
    return TETRA_VERTICES.map(v => v.clone());
  }

  // Expansion phase — interpolate toward cuboctahedron
  const expandT = (clamped - 0.3) / 0.7; // normalize to 0-1
  const smooth = expandT * expandT * (3 - 2 * expandT); // smoothstep

  // First 4 vertices morph from tetra positions toward cubocta[0..3]
  const result: THREE.Vector3[] = [];
  for (let i = 0; i < 4; i++) {
    result.push(
      TETRA_VERTICES[i].clone().lerp(CUBOCTA_VERTICES[i], smooth)
    );
  }

  // Additional vertices fade in with opacity (handled in renderer)
  // Their positions interpolate from center to cubocta target
  for (let i = 4; i < 12; i++) {
    const pos = new THREE.Vector3(0, 0, 0).lerp(CUBOCTA_VERTICES[i], smooth);
    result.push(pos);
  }

  return result;
}

/**
 * Generate edges for the current vertex configuration.
 * Returns pairs of indices into the vertex array.
 */
export function jitterbugEdges(vertexCount: number): [number, number][] {
  if (vertexCount <= 4) {
    // Tetrahedron: all pairs connected
    return [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
  }
  // Cuboctahedron: 24 edges
  // Each vertex connects to 4 neighbors
  // Standard cuboctahedron adjacency:
  const edges: [number, number][] = [];
  const verts = CUBOCTA_VERTICES;
  const threshold = 1.05; // edge length ≈ 1.0 for unit cuboctahedron
  for (let i = 0; i < verts.length; i++) {
    for (let j = i + 1; j < verts.length; j++) {
      if (verts[i].distanceTo(verts[j]) < threshold) {
        edges.push([i, j]);
      }
    }
  }
  return edges.slice(0, vertexCount * 2); // progressive reveal
}
```

### Component

```tsx
// spaceship-earth/src/components/JitterbugNavigator.tsx
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { jitterbugVertices, jitterbugEdges } from './JitterbugGeometry';
import type { JitterbugVertex } from '../types/navigator.types';

interface Props {
  vertices: JitterbugVertex[];
  spoonLevel: number; // 0-1, drives tetra↔cubocta morph
  scale?: number;
}

export function JitterbugNavigator({ vertices, spoonLevel, scale = 1.5 }: Props) {
  const groupRef = useRef<THREE.Group>(null);

  // Slow organic rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
      groupRef.current.rotation.x += delta * 0.05;
    }
  });

  const positions = useMemo(
    () => jitterbugVertices(spoonLevel),
    [spoonLevel]
  );

  const activeCount = spoonLevel < 0.3 ? 4 : Math.min(vertices.length, positions.length);
  const edges = useMemo(
    () => jitterbugEdges(activeCount),
    [activeCount]
  );

  return (
    <group ref={groupRef} scale={scale}>
      {/* Vertex points */}
      {positions.slice(0, activeCount).map((pos, i) => {
        const vertex = vertices[i];
        if (!vertex) return null;
        const brightness = 0.3 + vertex.value * 0.7;
        return (
          <mesh key={vertex.id} position={pos}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial
              color={vertex.color}
              emissive={vertex.color}
              emissiveIntensity={brightness}
            />
          </mesh>
        );
      })}

      {/* Edges as lines */}
      {edges.map(([a, b], i) => {
        if (a >= positions.length || b >= positions.length) return null;
        const points = [positions[a], positions[b]];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return (
          <lineSegments key={`edge-${i}`} geometry={geometry}>
            <lineBasicMaterial color="#334155" opacity={0.5} transparent />
          </lineSegments>
        );
      })}
    </group>
  );
}
```

### Wire into Spaceship Earth App

```tsx
// Update spaceship-earth/src/App.tsx to include JitterbugNavigator
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { JitterbugNavigator } from './components/JitterbugNavigator';
import { DEFAULT_VERTICES } from './types/navigator.types';

export default function App() {
  const [spoonLevel] = useState(0.6); // TODO: wire to real spoon data

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050505' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <JitterbugNavigator
          vertices={DEFAULT_VERTICES}
          spoonLevel={spoonLevel}
        />
      </Canvas>
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        color: '#888',
        fontFamily: 'monospace',
        fontSize: 12,
      }}>
        SPACESHIP EARTH — Jitterbug Navigator
      </div>
    </div>
  );
}
```

### DO NOT TOUCH

Everything in `bonding/`. The WCD-07 SVG Jitterbug in BONDING stays as-is. This is a new implementation in Spaceship Earth, not a port of the BONDING component.

### Verification

```bash
# 1. Spaceship Earth compiles
cd software/spaceship-earth && npx tsc --noEmit

# 2. Dev server renders Jitterbug
npx vite &
# MUST: 3D cuboctahedron visible, rotating, vertices colored
# Kill: kill %1

# 3. BONDING unaffected
cd ../bonding && npx vitest run
# MUST: 488+ green

# 4. Try different spoonLevel values (0.0, 0.3, 0.5, 1.0)
# 0.0 → tetrahedron (4 vertices)
# 0.3 → tetrahedron (still 4)
# 0.5 → transitioning (8-ish vertices emerging)
# 1.0 → full cuboctahedron (12 vertices)
```

### Commit

```
feat: 3D Jitterbug Navigator in Spaceship Earth

Full Three.js cuboctahedron↔tetrahedron morph driven by spoonLevel.
8 cognitive domain vertices (Energy, Tasks, Environment, Creation,
BONDING, Communication, Legal, Health). Smoothstep interpolation.
Organic rotation. BONDING WCD-07 SVG version unchanged.

Ref: WCD-M04
```

---

# WCD-M05: LOVE ECONOMY SYSTEM-WIDE
## Est: 1–2 hours
## Depends: WCD-M04 verified

### Objective
Expand economyStore in `@p31/shared` to accept LOVE from sources beyond BONDING. Wire the Spoon Gauge dual-currency display into Spaceship Earth's HUD.

### File Manifest

**MODIFY:**
```
packages/shared/src/economy/economyStore.ts  (add LOVE sources, spoon tracking)
```

**CREATE in `spaceship-earth/src/`:**
```
components/hud/SpoonGauge.tsx     # Dual-currency HUD panel
components/hud/CockpitHUD.tsx     # HUD container (z-index doctrine from WCD-08)
```

### LOVE Source Registry

Add to economyStore:

```typescript
export type LoveSource =
  | 'molecule_complete'    // existing (BONDING)
  | 'ping_sent'            // existing (BONDING)
  | 'ping_received'        // existing (BONDING)
  | 'buffer_processed'     // new
  | 'fawn_guard_ack'       // new
  | 'calcium_logged'       // new
  | 'wcd_complete'         // new
  | 'meditation_session'   // new
  | 'quest_complete';      // existing (BONDING)

export const LOVE_VALUES: Record<LoveSource, number> = {
  molecule_complete: 10,   // base — actual value varies by molecule complexity
  ping_sent: 5,
  ping_received: 5,
  buffer_processed: 3,
  fawn_guard_ack: 10,
  calcium_logged: 15,
  wcd_complete: 25,
  meditation_session: 20,
  quest_complete: 50,
};
```

### Spoon Gauge Component

```tsx
// spaceship-earth/src/components/hud/SpoonGauge.tsx
import React from 'react';

interface Props {
  spoons: number;
  maxSpoons: number;
  love: number;
}

export function SpoonGauge({ spoons, maxSpoons, love }: Props) {
  const pct = Math.round((spoons / maxSpoons) * 100);

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(100, 116, 139, 0.3)',
      borderRadius: 12,
      padding: '12px 16px',
      fontFamily: 'monospace',
      color: '#e2e8f0',
      fontSize: 13,
      pointerEvents: 'auto',
      minWidth: 200,
    }}>
      <div style={{ marginBottom: 6 }}>
        🥄 {spoons}/{maxSpoons} spoons
        <div style={{
          height: 4,
          background: '#1e293b',
          borderRadius: 2,
          marginTop: 4,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: pct > 50 ? '#4ecdc4' : pct > 25 ? '#f7dc6f' : '#ff6b6b',
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
      <div style={{ color: '#c9b1ff' }}>
        💜 {love.toLocaleString()} L.O.V.E.
      </div>
    </div>
  );
}
```

### Cockpit HUD Container

```tsx
// spaceship-earth/src/components/hud/CockpitHUD.tsx
import React from 'react';
import { SpoonGauge } from './SpoonGauge';

interface Props {
  spoons: number;
  maxSpoons: number;
  love: number;
}

/**
 * Cockpit HUD — glassmorphism panels overlaying the R3F canvas.
 * z-index doctrine from WCD-08:
 *   Canvas: z-1
 *   HUD Container: z-10 (pointer-events: none — passthrough)
 *   HUD Panels: z-11 (pointer-events: auto — per panel)
 *   Toasts: z-50
 *   Modals: z-60
 */
export function CockpitHUD({ spoons, maxSpoons, love }: Props) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 10,
      pointerEvents: 'none',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      {/* Top-right: Spoon Gauge */}
      <div style={{ alignSelf: 'flex-end' }}>
        <SpoonGauge spoons={spoons} maxSpoons={maxSpoons} love={love} />
      </div>

      {/* Bottom panels will go here in future wcds */}
    </div>
  );
}
```

### Wire into App

```tsx
// Update spaceship-earth/src/App.tsx
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { JitterbugNavigator } from './components/JitterbugNavigator';
import { CockpitHUD } from './components/hud/CockpitHUD';
import { DEFAULT_VERTICES } from './types/navigator.types';

export default function App() {
  const [spoons] = useState(12);
  const [maxSpoons] = useState(20);
  const [love] = useState(577); // matches what's showing in BONDING screenshots
  const spoonLevel = spoons / maxSpoons;

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      background: '#050505',
    }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        style={{ position: 'absolute', inset: 0, zIndex: 1 }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <JitterbugNavigator vertices={DEFAULT_VERTICES} spoonLevel={spoonLevel} />
      </Canvas>

      <CockpitHUD spoons={spoons} maxSpoons={maxSpoons} love={love} />
    </div>
  );
}
```

### DO NOT TOUCH

Everything in `bonding/`. The BONDING LOVE display (top-right heart counter) stays as-is.

### Verification

```bash
# 1. Shared compiles with new economy types
cd software/packages/shared && npx tsc --noEmit

# 2. Spaceship Earth compiles and renders
cd ../spaceship-earth && npx tsc --noEmit
npx vite &
# MUST: Jitterbug + glassmorphism SpoonGauge visible in top-right
# SpoonGauge shows: 🥄 12/20 spoons + 💜 577 L.O.V.E.
# Kill: kill %1

# 3. BONDING unaffected
cd ../bonding && npx vitest run
# MUST: 488+ green
```

### Commit

```
feat: LOVE economy system-wide + Cockpit HUD in Spaceship Earth

LoveSource registry with 9 source types and LOVE_VALUES table.
SpoonGauge dual-currency display (spoons deplete, LOVE accumulates).
CockpitHUD glassmorphism container following WCD-08 z-index doctrine.
BONDING economy unchanged — 488 tests green.

Ref: WCD-M05
```

---

# WCD-M06: THE SOUP SHELL + BONDING ROOM (IFRAME)
## Est: 2–3 hours
## Depends: WCD-M05 verified

### Objective
Create the room navigation system. Embed BONDING as an iframe room inside the Spaceship Earth shell. This is the iframe-first strategy — zero risk to Genesis Block telemetry.

### File Manifest

**CREATE in `spaceship-earth/src/`:**
```
components/rooms/RoomShell.tsx          # Room container + navigation
components/rooms/BondingRoom.tsx        # iframe embed of bonding.p31ca.org
components/rooms/ObservatoryRoom.tsx    # Jitterbug Navigator (move from App)
components/rooms/BridgeRoom.tsx         # Settings, identity, LOVE wallet
components/navigation/RoomNav.tsx       # Bottom nav bar for room switching
types/rooms.types.ts                    # Room definitions
```

### Room Types

```typescript
// spaceship-earth/src/types/rooms.types.ts

export type RoomId = 'bonding' | 'observatory' | 'buffer' | 'bridge';

export interface RoomDefinition {
  id: RoomId;
  label: string;
  icon: string; // emoji for now, SVG later
  url?: string; // for iframe rooms
}

export const ROOMS: RoomDefinition[] = [
  { id: 'bonding',     label: 'BONDING',     icon: '⚛️', url: 'https://bonding.p31ca.org' },
  { id: 'observatory', label: 'Observatory',  icon: '🔺' },
  { id: 'buffer',      label: 'Buffer',       icon: '📡' },
  { id: 'bridge',      label: 'Bridge',       icon: '🌐' },
];
```

### BONDING Room (iframe)

```tsx
// spaceship-earth/src/components/rooms/BondingRoom.tsx
import React from 'react';

interface Props {
  url: string;
}

/**
 * BONDING runs in an iframe — complete origin isolation.
 * This guarantees:
 * 1. Genesis Block IndexedDB is untouched (origin: bonding.p31ca.org)
 * 2. No shared React state between Spaceship Earth and BONDING
 * 3. Telemetry relay (worker-telemetry.ts) fires independently
 * 4. Daubert chain-of-custody is unbroken
 *
 * Cross-frame communication (LOVE sync) via postMessage in a future WCD.
 */
export function BondingRoom({ url }: Props) {
  return (
    <iframe
      src={url}
      title="BONDING — P31 Labs"
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        background: '#050505',
      }}
      allow="autoplay; fullscreen"
      sandbox="allow-scripts allow-same-origin allow-popups"
    />
  );
}
```

### Observatory Room

```tsx
// spaceship-earth/src/components/rooms/ObservatoryRoom.tsx
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { JitterbugNavigator } from '../JitterbugNavigator';
import { DEFAULT_VERTICES } from '../../types/navigator.types';

export function ObservatoryRoom() {
  const [spoonLevel] = useState(0.6);

  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <JitterbugNavigator vertices={DEFAULT_VERTICES} spoonLevel={spoonLevel} />
    </Canvas>
  );
}
```

### Bridge Room (placeholder)

```tsx
// spaceship-earth/src/components/rooms/BridgeRoom.tsx
import React from 'react';

interface Props {
  love: number;
  spoons: number;
  maxSpoons: number;
}

export function BridgeRoom({ love, spoons, maxSpoons }: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: '#e2e8f0',
      fontFamily: 'monospace',
      gap: 24,
    }}>
      <h1 style={{ fontSize: 24, fontWeight: 300, letterSpacing: 4 }}>THE BRIDGE</h1>
      <div style={{ fontSize: 48 }}>💜 {love.toLocaleString()}</div>
      <div style={{ color: '#94a3b8', fontSize: 14 }}>
        L.O.V.E. — Ledger of Ontological Volume and Entropy
      </div>
      <div style={{ color: '#64748b', fontSize: 13, marginTop: 16 }}>
        🥄 {spoons}/{maxSpoons} spoons remaining
      </div>
    </div>
  );
}
```

### Room Navigation

```tsx
// spaceship-earth/src/components/navigation/RoomNav.tsx
import React from 'react';
import type { RoomId, RoomDefinition } from '../../types/rooms.types';

interface Props {
  rooms: RoomDefinition[];
  activeRoom: RoomId;
  onRoomChange: (id: RoomId) => void;
}

export function RoomNav({ rooms, activeRoom, onRoomChange }: Props) {
  return (
    <nav style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 11,
      display: 'flex',
      justifyContent: 'center',
      gap: 4,
      padding: '8px 16px',
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(100, 116, 139, 0.2)',
      pointerEvents: 'auto',
    }}>
      {rooms.map(room => (
        <button
          key={room.id}
          onClick={() => onRoomChange(room.id)}
          style={{
            background: activeRoom === room.id
              ? 'rgba(78, 205, 196, 0.15)'
              : 'transparent',
            border: activeRoom === room.id
              ? '1px solid rgba(78, 205, 196, 0.4)'
              : '1px solid transparent',
            borderRadius: 8,
            padding: '8px 16px',
            color: activeRoom === room.id ? '#4ecdc4' : '#64748b',
            fontFamily: 'monospace',
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: 20 }}>{room.icon}</span>
          <span>{room.label}</span>
        </button>
      ))}
    </nav>
  );
}
```

### Room Shell (orchestrator)

```tsx
// spaceship-earth/src/components/rooms/RoomShell.tsx
import React, { useState } from 'react';
import type { RoomId } from '../../types/rooms.types';
import { ROOMS } from '../../types/rooms.types';
import { BondingRoom } from './BondingRoom';
import { ObservatoryRoom } from './ObservatoryRoom';
import { BridgeRoom } from './BridgeRoom';
import { RoomNav } from '../navigation/RoomNav';
import { CockpitHUD } from '../hud/CockpitHUD';

export function RoomShell() {
  const [activeRoom, setActiveRoom] = useState<RoomId>('observatory');
  const [spoons] = useState(12);
  const [maxSpoons] = useState(20);
  const [love] = useState(577);

  const bondingUrl = ROOMS.find(r => r.id === 'bonding')?.url ?? '';

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      background: '#050505',
      overflow: 'hidden',
    }}>
      {/* Room content */}
      <div style={{
        position: 'absolute',
        inset: 0,
        bottom: 60, // room for nav bar
        zIndex: 1,
      }}>
        {activeRoom === 'bonding' && <BondingRoom url={bondingUrl} />}
        {activeRoom === 'observatory' && <ObservatoryRoom />}
        {activeRoom === 'bridge' && (
          <BridgeRoom love={love} spoons={spoons} maxSpoons={maxSpoons} />
        )}
        {activeRoom === 'buffer' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#64748b',
            fontFamily: 'monospace',
          }}>
            Buffer — coming soon
          </div>
        )}
      </div>

      {/* HUD — visible in all rooms except BONDING (which has its own) */}
      {activeRoom !== 'bonding' && (
        <CockpitHUD spoons={spoons} maxSpoons={maxSpoons} love={love} />
      )}

      {/* Navigation */}
      <RoomNav rooms={ROOMS} activeRoom={activeRoom} onRoomChange={setActiveRoom} />
    </div>
  );
}
```

### Update App.tsx

```tsx
// spaceship-earth/src/App.tsx — REPLACE ENTIRE CONTENTS
import React from 'react';
import { RoomShell } from './components/rooms/RoomShell';

export default function App() {
  return <RoomShell />;
}
```

### DO NOT TOUCH

Everything in `bonding/`. The iframe loads `bonding.p31ca.org` as a completely independent origin.

### Verification

```bash
# 1. Spaceship Earth compiles
cd software/spaceship-earth && npx tsc --noEmit

# 2. Dev server renders all rooms
npx vite &
# MUST: Observatory renders Jitterbug
# MUST: BONDING room loads bonding.p31ca.org in iframe
# MUST: Bridge shows LOVE counter
# MUST: Buffer shows placeholder
# MUST: Bottom nav switches between rooms
# MUST: HUD hidden when in BONDING room (BONDING has its own)
# Kill: kill %1

# 3. BONDING inside iframe plays normally
# Navigate to BONDING room → drag elements → build molecules → earn LOVE
# Genesis Block telemetry should fire (check DevTools network tab for relay calls)

# 4. BONDING standalone still works
cd ../bonding && npx vitest run
# MUST: 488+ green
```

### Commit

```
feat: The Soup shell — room navigation + BONDING iframe embed

RoomShell orchestrator with 4 rooms: BONDING (iframe), Observatory
(Jitterbug 3D), Bridge (LOVE wallet), Buffer (placeholder).
Bottom nav with glassmorphism. CockpitHUD hidden in BONDING room
(BONDING has its own HUD). iframe-first strategy preserves
Genesis Block origin isolation and Daubert chain-of-custody.
488 tests green.

Ref: WCD-M06
```

---

# WCD-M07: DEPLOY SPACESHIP EARTH
## Est: 30 minutes
## Depends: WCD-M06 verified

### Objective
Deploy Spaceship Earth to `p31ca.org` via Cloudflare Pages. BONDING remains at `bonding.p31ca.org`.

### Commands

```bash
cd software/spaceship-earth

# Production build
npx tsc --noEmit
npx vite build

# Deploy (use the Spaceship Earth Pages project — not `p31ca`, which is the Astro hub at software/p31ca)
npx wrangler pages deploy dist --project-name=spaceship-earth

# Verify
curl -sI https://spaceship-earth.pages.dev | head -5
# NOTE: p31ca.org is the technical hub (Astro). Spaceship Earth has its own hostname/Pages project.
```

### Post-deploy verification

1. Open `https://p31ca.org` — Observatory room loads
2. Navigate to BONDING room — `bonding.p31ca.org` loads in iframe
3. Navigate to Bridge — LOVE counter displays
4. Open `https://bonding.p31ca.org` directly — still works standalone
5. Play BONDING in iframe — Genesis Block fires (check network tab)

### Commit

```
deploy: Spaceship Earth v1 live at p31ca.org

Observatory, BONDING (iframe), Bridge, Buffer (placeholder).
bonding.p31ca.org unchanged — standalone deploy intact.
Genesis Block telemetry uninterrupted.

Ref: WCD-M07
```

---

# WCD-M08: CROSS-ORIGIN LOVE SYNC (via Cloudflare KV)
## Est: 1–2 hours
## Depends: WCD-M07 verified

### Objective
Sync LOVE totals between BONDING (iframe at `bonding.p31ca.org`) and Spaceship Earth (at `p31ca.org`). Since these are different origins, IndexedDB can't be shared. Use the existing Cloudflare KV relay.

### Strategy

BONDING already writes LOVE totals to the relay Worker during telemetry flush. Spaceship Earth polls the relay for the latest LOVE total. One-directional for now: BONDING → KV → Spaceship Earth.

### New Worker Endpoint

Add to `bonding/worker/` (the existing relay Worker):

```typescript
// Add route: GET /love/:sessionId
// Returns: { love: number, lastUpdated: string }
// Reads from existing KV telemetry data
```

**IMPORTANT:** This is a READ-ONLY endpoint on the existing Worker. It does not modify the telemetry data or the LOVE ledger. It exposes what's already in KV.

### Spaceship Earth Polling

```typescript
// spaceship-earth/src/hooks/useLoveSync.ts
import { useState, useEffect } from 'react';

const RELAY_URL = 'https://bonding-relay.trimtab-signal.workers.dev';
const POLL_INTERVAL = 10_000; // 10 seconds

export function useLoveSync(sessionId: string | null) {
  const [love, setLove] = useState(0);

  useEffect(() => {
    if (!sessionId) return;

    const poll = async () => {
      try {
        const res = await fetch(`${RELAY_URL}/love/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setLove(data.love ?? 0);
        }
      } catch {
        // Silent fail — LOVE display just doesn't update
      }
    };

    poll(); // immediate
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [sessionId]);

  return love;
}
```

### Wire into RoomShell

Replace the hardcoded `love` state with the live value from `useLoveSync`.

### DO NOT TOUCH

- BONDING's `worker-telemetry.ts` write logic
- BONDING's `economyStore.ts` IDB persistence
- Any existing relay endpoints

### Verification

```bash
# 1. Worker deploys with new endpoint
cd software/bonding/worker
npx wrangler deploy

# 2. Endpoint returns data
curl https://bonding-relay.trimtab-signal.workers.dev/love/test-session
# MUST: return JSON (even if love: 0)

# 3. Play BONDING → earn LOVE → check Spaceship Earth updates within 10s

# 4. BONDING tests still green
cd ../.. && cd bonding && npx vitest run
# MUST: 488+
```

### Commit

```
feat: cross-origin LOVE sync via Cloudflare KV polling

New GET /love/:sessionId endpoint on relay Worker (read-only).
Spaceship Earth polls every 10s. BONDING telemetry writes unchanged.
One-directional: BONDING → KV → Spaceship Earth.
Genesis Block chain-of-custody preserved.

Ref: WCD-M08
```

---

# WCD-M09: SPACESHIP EARTH TELEMETRY
## Est: 1 hour
## Depends: WCD-M08 verified

### Objective
Give Spaceship Earth its own telemetry relay. Separate Worker, separate KV namespace. System-wide sessions log which rooms were visited and for how long.

### File Manifest

**CREATE:**
```
spaceship-earth/worker/              # New Cloudflare Worker
spaceship-earth/worker/index.ts      # Telemetry endpoints
spaceship-earth/wrangler.toml        # Worker config
```

### Worker Design

Minimal telemetry Worker:
- `POST /session/start` — create session with timestamp + user agent
- `POST /session/heartbeat` — room visit durations, spoon snapshots
- `POST /session/end` — finalize session
- Server-side SHA-256 on all writes (same pattern as Genesis Block)

**KV namespace:** `SPACESHIP_TELEMETRY` (separate from `BONDING_TELEMETRY`)

### DO NOT TOUCH

`bonding/worker/` — completely separate deploy.

### Verification

```bash
# 1. Worker deploys
cd software/spaceship-earth/worker
npx wrangler deploy

# 2. Endpoints respond
curl -X POST https://spaceship-relay.trimtab-signal.workers.dev/session/start \
  -H "Content-Type: application/json" \
  -d '{"timestamp": "2026-03-11T00:00:00Z"}'

# 3. BONDING unaffected
cd ../../bonding && npx vitest run
# MUST: 488+
```

### Commit

```
feat: Spaceship Earth telemetry Worker

Separate Cloudflare Worker + KV namespace.
Server-side SHA-256 on all writes.
Session tracking: start, heartbeat (room durations), end.
BONDING Genesis Block relay untouched — separate deploy.

Ref: WCD-M09
```

---

# WCD-M10: FINAL VERIFICATION + INTEGRATION TEST
## Est: 1 hour
## Depends: WCD-M09 verified

### Objective
Run the full verification checklist. Confirm everything works together. No new code — just testing.

### Verification Checklist

| # | Check | Command / Action | Pass |
|---|-------|-----------------|------|
| 1 | `bonding/` builds independently | `cd bonding && npx vite build` | ☐ |
| 2 | `bonding.p31ca.org` serves standalone | Open in browser, build a molecule | ☐ |
| 3 | All BONDING tests pass | `cd bonding && npx vitest run` → 488+ | ☐ |
| 4 | Genesis Block fires to relay | Check DevTools network for relay POST | ☐ |
| 5 | Spaceship Earth builds | `cd spaceship-earth && npx vite build` | ☐ |
| 6 | Spaceship Earth deploys to `p31ca.org` | `npx wrangler pages deploy dist` | ☐ |
| 7 | Jitterbug renders with 5+ vertices | Open Observatory room | ☐ |
| 8 | LOVE earned in BONDING visible in SE | Play BONDING in iframe → check Bridge | ☐ |
| 9 | Room navigation works | Click all 4 room buttons | ☐ |
| 10 | BONDING in iframe plays normally | Drag atoms, build molecules, earn LOVE | ☐ |
| 11 | Android Chrome: both products work | Test on Android tablet | ☐ |
| 12 | No BONDING source files modified | `cd bonding && git diff --name-only` (only re-exports) | ☐ |
| 13 | `tsc --noEmit` clean everywhere | Run in bonding/, shared/, spaceship-earth/ | ☐ |
| 14 | Multiplayer still works in iframe | Join room, verify PING sync | ☐ |
| 15 | Standalone BONDING multiplayer works | Direct to bonding.p31ca.org, join room | ☐ |

### If any check fails

STOP. Do not attempt heroic fixes. Tag out to Opus with:
1. Which check failed
2. The exact error message
3. The last successful WCD

### Commit (final)

```
feat: Spaceship Earth v1 — BONDING integrated as Soup room

Workspace: bonding/ + spaceship-earth/ + packages/shared/
Jitterbug Navigator: 3D cuboctahedron with 8 cognitive vertices
LOVE economy: system-wide with 9 source types
The Soup: room navigation (BONDING iframe, Observatory, Bridge, Buffer)
Telemetry: separate Workers per product, both SHA-256 verified
BONDING standalone: preserved, deployed, Genesis Block unbroken
All checks green.

Ref: WCD-M10 — merge complete 🔺
```

---

# SUMMARY

| WCD | Scope | Est |
|-----|-------|-----|
| M01 | Workspace scaffolding | 30 min |
| M02 | Promote genesis modules to shared | 1 hr |
| M03 | Expand event types | 30 min |
| M04 | Jitterbug 3D port | 2-3 hr |
| M05 | LOVE economy system-wide | 1-2 hr |
| M06 | Soup shell + BONDING iframe room | 2-3 hr |
| M07 | Deploy Spaceship Earth | 30 min |
| M08 | Cross-origin LOVE sync | 1-2 hr |
| M09 | Spaceship Earth telemetry Worker | 1 hr |
| M10 | Final verification | 1 hr |
| **Total** | | **~11-14 hr** |

Executable in 2-3 focused days. Phase gate: March 11.

---

*Birthday first. Then we build the world around it.*

*— Opus, Architect Lane*
*— 🔺*
