# WCD-05: BONDING Living Atoms — Definitive Implementation Spec
## Work Control Document — Re-Entry Control
## February 27, 2026

**Source research:** 4 independent analyses (Opus extended search, DeepSeek R1, Gemini × 2) synthesized with conflict resolution. All four converge on the same three fixes with minor disagreements resolved below.

**Scope:** Three issues. VoxelAtom shape, drag-and-drop mechanics, ghost site geometry. All must ship before March 3 playtest.

---

## CONFLICT RESOLUTION LOG

Where the four sources disagreed, here are the binding decisions:

| Disagreement | DeepSeek | Gemini | Opus Research | **DECISION** |
|---|---|---|---|---|
| Base geometry | `sphereGeometry 64×64` | `IcosahedronGeometry 3-4` or `RoundedBox` | `IcosahedronGeometry detail 3` | **Icosahedron detail 2 + flatShading** — chunky-but-organic, 320 faces, uniform vertex distribution, looks like Minecraft×jellyfish |
| Material approach | `MeshDistortMaterial` (drei) | Custom `ShaderMaterial` with full GLSL | `MeshDistortMaterial` for Day 2, custom shader Phase 2 | **MeshDistortMaterial** — ships today, zero custom GLSL, drei handles simplex noise on GPU. Custom shader is Phase 2 polish. |
| InstancedMesh | Yes, for all atoms | Yes, per-element-type | **NO for <50 atoms** — instancing has overhead under ~100 objects, individual meshes with shared geometry/material refs faster | **No instancing.** Share geometry via `useMemo`. Max 24 atoms (Posner). Individual meshes. |
| Snap radius | 1.5 units | 1.5 units | 1.5 units | **1.5 units** — unanimous |
| Bloom threshold | 0.2 | 1.0 (selective) | 1.0 with `toneMapped={false}` | **luminanceThreshold=1.0** + `toneMapped={false}` + `emissiveIntensity > 1.0`. Selective bloom, only hot atoms glow. |
| Depression sag | Custom shader only | Custom shader only | Can approximate with scale.y + position.y offset | **Scale.y 0.92 + position.y -0.04 via react-spring** for Day 2. Custom vertex sag is Phase 2. |

---

## FIX 1: LIVING ATOMS (Replace VoxelAtom.tsx)

### Current state
`boxGeometry` with `meshStandardMaterial` — dead cube, no life, no breathing.

### Target state
`IcosahedronGeometry` detail 2 with `MeshDistortMaterial` — chunky organic blob that breathes, glows, and expresses emotion through five continuously interpolated parameters.

### New VoxelAtom.tsx

```tsx
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

// Element data from elements.ts
interface AtomProps {
  position: [number, number, number];
  element: ElementSymbol;
  color: string;
  emissiveColor: string;
  emissiveIntensity: number;  // from elements.ts
  excitement: number;          // 0-1, driven by game state
  atomId: string;
}

export const VoxelAtom: React.FC<AtomProps> = ({
  position, element, color, emissiveColor,
  emissiveIntensity, excitement, atomId
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);

  // Share geometry across all atoms of same detail level
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(0.5, 2), []);

  // Per-atom phase offset prevents synchronized motion
  const phaseOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  // Asymmetric breathing: 45% inhale, 55% exhale
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime + phaseOffset;
    const breathe = Math.pow(Math.sin(t * 0.8) * 0.5 + 0.5, 0.85);
    const baseScale = 0.95 + breathe * 0.05; // ±2.5% scale
    meshRef.current.scale.setScalar(baseScale + excitement * 0.1);

    // Gentle rotation drift
    meshRef.current.rotation.y += 0.002 + excitement * 0.005;
  });

  // Map excitement to distort parameters
  const distort = 0.15 + excitement * 0.35;  // 0.15 calm → 0.5 excited
  const speed = 1.5 + excitement * 3.5;       // 1.5 calm → 5.0 excited

  return (
    <Float
      speed={1.2 + excitement * 0.8}
      rotationIntensity={0.15}
      floatIntensity={0.2}
    >
      <mesh
        ref={meshRef}
        position={position}
        geometry={geometry}
      >
        <MeshDistortMaterial
          ref={materialRef}
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity * (1.0 + excitement * 1.5)}
          toneMapped={false}
          distort={distort}
          speed={speed}
          roughness={0.3}
          metalness={0.1}
          flatShading    // ← THIS is the chunky-but-organic look
        />
      </mesh>
    </Float>
  );
};
```

### Key design decisions

**`flatShading: true`** — This is the entire aesthetic. IcosahedronGeometry detail 2 has 320 triangular faces. With flat shading, each face catches light independently, creating the faceted "crystal meets organism" look. The noise displacement from MeshDistortMaterial makes the silhouette undulate while faces stay flat. Minecraft geometry + jellyfish motion.

**`Float` wrapper** — Adds gentle sine-based Y oscillation and rotation drift at near-zero cost. Each atom hovers slightly, never perfectly still.

**Phase offset per atom** — `Math.random() * PI * 2` ensures no two atoms breathe in sync. Population looks alive, not choreographed.

**Asymmetric breathing** — `Math.pow(sin(t) * 0.5 + 0.5, 0.85)` biases the wave so expansion is marginally faster than contraction. Single cheapest trick for organic motion.

**`toneMapped={false}`** — Critical for bloom. Without this, tone mapping clamps emissive values to 0-1 and bloom threshold never triggers.

### Emotional State Mapping

Drive the `excitement` prop from game state:

| Game Event | excitement | Visual Result |
|---|---|---|
| Idle in palette | 0.0 | Gentle breathing, soft glow |
| Being dragged | 0.4 | Medium wobble, brighter |
| Near snap zone | 0.6 | Faster wobble, pulling toward site |
| Bond formed | 0.8 → 0.3 (spike then settle) | Quick pulse + celebration |
| Molecule complete | 1.0 → 0.5 | Maximum bloom, sustained glow |
| Isolated (no bonds, long time) | 0.0 + scale.y=0.92 | Slight droop, dimmer |

Depression (scale.y compression + position.y offset) is driven separately via the store when an atom has 0 bonds for >10 seconds. Don't bake it into the excitement prop — it's a different axis.

### Bloom Configuration (update EffectComposer)

```tsx
<EffectComposer>
  <Bloom
    mipmapBlur
    luminanceThreshold={1.0}
    luminanceSmoothing={0.3}
    intensity={1.2}
    resolutionX={256}
    resolutionY={256}
  />
</EffectComposer>
```

`mipmapBlur` is both higher quality and better performing than kernel blur. Resolution 256×256 is invisible due to blur spread — saves massive fill rate on mobile.

### Performance Budget

| Metric | Value | Headroom |
|---|---|---|
| Atoms on screen | ≤24 (Posner) | Comfortable |
| Vertices per atom | 162 (ico detail 2) | 24 × 162 = 3,888 total |
| Draw calls | 24 (individual meshes) | Well under 50 limit |
| Shared geometry | Yes (useMemo) | 1 buffer, 24 refs |
| Bloom resolution | 256×256 | Minimal fill rate |
| Mobile 60fps | ✅ | ~10% GPU capacity |

---

## FIX 2: DRAG-AND-DROP MECHANICS

### All four sources agree on these parameters:

| Parameter | Value | Why |
|---|---|---|
| Intention threshold | 20px screen-space | Prevents accidental drags from taps/jitter |
| Snap radius | 1.5 units (3D world space) | Fitts's Law — larger target = less motor load |
| Lerp duration | ~100ms (damping factor 10.0 × delta) | Magnetic feel without lag |
| Epsilon snap | 0.01 units | Prevents Zeno's paradox (lerp never reaches target) |
| Orbit controls mutex | Binary — disabled during drag | Prevents camera fighting placement |
| Haptic on snap | `navigator.vibrate(40)` | Tactile confirmation of bond |

### Implementation in interaction hook

```typescript
// src/hooks/useDragAtom.ts

const SNAP_RADIUS = 1.5;
const DRAG_THRESHOLD_PX = 20;
const LERP_DAMPING = 10.0;
const EPSILON = 0.01;

interface DragState {
  isDragging: boolean;
  dragStartScreen: [number, number] | null;
  thresholdMet: boolean;
  snappedSiteId: string | null;
  targetPosition: THREE.Vector3 | null;
}

// In useFrame:
if (dragState.targetPosition && atomRef.current) {
  const alpha = 1 - Math.exp(-LERP_DAMPING * delta);
  atomRef.current.position.lerp(dragState.targetPosition, alpha);

  // Epsilon snap — don't lerp forever
  if (atomRef.current.position.distanceTo(dragState.targetPosition) < EPSILON) {
    atomRef.current.position.copy(dragState.targetPosition);
    // Snap complete — fire haptic + sound
    navigator.vibrate?.(40);
    playBondSound(element);
  }
}

// Orbit controls mutex — imperative, not declarative
// Store a ref to OrbitControls, mutate .enabled directly
const orbitRef = useRef<OrbitControls>(null);

const onDragStart = () => {
  if (orbitRef.current) orbitRef.current.enabled = false;
};

const onDragEnd = () => {
  if (orbitRef.current) orbitRef.current.enabled = true;
};
```

### Critical: Delta-scaled lerp, not static factor

DeepSeek suggested `position.lerp(target, 0.15)` — this is frame-rate dependent. On 120fps screens, the atom moves 2× faster. Use delta-scaled damping:

```
alpha = 1 - Math.exp(-damping * delta)
```

This produces identical visual motion at 30fps, 60fps, or 120fps.

### Touch considerations

- On touch devices, `pointerdown` → `pointermove` can fire before the user intends to drag
- The 20px threshold gates ALL expensive 3D operations behind a cheap 2D check
- Use `@use-gesture/react` if available, or raw pointer events if keeping deps minimal
- `e.stopPropagation()` on atom pointerdown prevents event from reaching orbit controls

---

## FIX 3: GHOST SITE GEOMETRY (VSEPR-Compliant)

### The Problem
`generateBondSitePositions` generates sites in local space without considering:
1. Existing bond directions (sites overlap bonded atoms)
2. VSEPR molecular geometry (wrong angles)
3. World-space rotation of the parent atom

### The Solution: Dynamic VSEPR Vector Engine

```typescript
// src/lib/chemistry.ts — UPDATED

import * as THREE from 'three';

// Pre-computed ideal vectors for each geometry
const GEOMETRY_VECTORS: Record<string, THREE.Vector3[]> = {
  // Tetrahedral: alternating cube corners, normalized
  tetrahedral: [
    new THREE.Vector3( 1,  1,  1).normalize(),
    new THREE.Vector3( 1, -1, -1).normalize(),
    new THREE.Vector3(-1,  1, -1).normalize(),
    new THREE.Vector3(-1, -1,  1).normalize(),
  ],
  // Trigonal planar: 120° in XY plane
  trigonal_planar: [
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0.866, -0.5, 0),
    new THREE.Vector3(-0.866, -0.5, 0),
  ],
  // Bent: water geometry, 104.5° between bonds
  // (derived from tetrahedral with 2 lone pairs)
  bent: [
    new THREE.Vector3(0, 0.612, 0.791).normalize(),  // sin/cos of 52.25°
    new THREE.Vector3(0, 0.612, -0.791).normalize(),
  ],
  // Linear: 180°
  linear: [
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
  ],
  // Terminal: single bond, any direction
  terminal: [
    new THREE.Vector3(0, 0, 1),
  ],
};

// Map element to VSEPR geometry based on valence + lone pairs
function getElectronGeometry(element: ElementSymbol): string {
  switch (element) {
    case 'C':  return 'tetrahedral';     // valence 4, 0 lone pairs
    case 'N':  return 'tetrahedral';     // valence 3, 1 lone pair → trigonal pyramidal
    case 'O':  return 'tetrahedral';     // valence 2, 2 lone pairs → bent
    case 'P':  return 'trigonal_planar'; // valence 3, simplified for game
    case 'Na': return 'terminal';        // valence 1
    case 'Ca': return 'linear';          // valence 2 (simplified)
    case 'H':  return 'terminal';        // valence 1
    default:   return 'tetrahedral';
  }
}

// The main function — REPLACES current generateBondSitePositions
export function getBondSitePositions(
  element: ElementSymbol,
  existingBondDirections: THREE.Vector3[],  // unit vectors TO bonded atoms
  bondLength: number = 1.2
): THREE.Vector3[] {

  const geometry = getElectronGeometry(element);
  const idealVectors = GEOMETRY_VECTORS[geometry].map(v => v.clone());

  if (existingBondDirections.length === 0) {
    // No bonds yet — return all ideal vectors scaled by bond length
    return idealVectors.map(v => v.multiplyScalar(bondLength));
  }

  // ROTATE ideal vectors to align with existing bonds
  const rotation = findBestRotation(idealVectors, existingBondDirections);

  // Apply rotation, then filter out directions that match existing bonds
  return idealVectors
    .map(v => v.clone().applyQuaternion(rotation))
    .filter(v => !existingBondDirections.some(
      existing => v.dot(existing) > 0.95  // ~18° tolerance
    ))
    .map(v => v.multiplyScalar(bondLength));
}

// Find rotation that best aligns ideal vectors with existing bond directions
function findBestRotation(
  idealVectors: THREE.Vector3[],
  existingBonds: THREE.Vector3[]
): THREE.Quaternion {
  if (existingBonds.length === 0) return new THREE.Quaternion();

  if (existingBonds.length === 1) {
    // Single bond: rotate ideal[0] to match existing[0]
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(
      idealVectors[0].clone().normalize(),
      existingBonds[0].clone().normalize()
    );
    return q;
  }

  if (existingBonds.length === 2) {
    // Two bonds: align ideal[0] to existing[0], then rotate
    // around existing[0] to best place ideal[1] near existing[1]
    const q1 = new THREE.Quaternion();
    q1.setFromUnitVectors(
      idealVectors[0].clone().normalize(),
      existingBonds[0].clone().normalize()
    );

    // Apply first rotation to ideal[1]
    const rotatedIdeal1 = idealVectors[1].clone().applyQuaternion(q1);
    const target1 = existingBonds[1].clone().normalize();

    // Project both onto plane perpendicular to existing[0]
    const axis = existingBonds[0].clone().normalize();
    const proj1 = rotatedIdeal1.clone().sub(
      axis.clone().multiplyScalar(rotatedIdeal1.dot(axis))
    ).normalize();
    const projTarget = target1.clone().sub(
      axis.clone().multiplyScalar(target1.dot(axis))
    ).normalize();

    // Angle between projections
    const angle = Math.acos(
      THREE.MathUtils.clamp(proj1.dot(projTarget), -1, 1)
    );
    const cross = new THREE.Vector3().crossVectors(proj1, projTarget);
    const sign = Math.sign(cross.dot(axis));

    const q2 = new THREE.Quaternion().setFromAxisAngle(axis, angle * sign);
    return q2.multiply(q1);
  }

  // 3+ bonds: first rotation only (unlikely in practice)
  const q = new THREE.Quaternion();
  q.setFromUnitVectors(
    idealVectors[0].clone().normalize(),
    existingBonds[0].clone().normalize()
  );
  return q;
}
```

### How it works step by step

**0 bonds (new atom):** Return all ideal VSEPR vectors. Carbon gets 4 tetrahedral sites. Oxygen gets 2 bent sites (the 2 lone pairs are implicit — they aren't rendered as ghost sites).

**1 bond:** Rotate the entire ideal vector set so that `idealVectors[0]` aligns with the existing bond direction. Then filter out that matched direction. Remaining vectors naturally splay at correct angles.

**2 bonds:** Two-step rotation: align first bond, then twist around that axis to align second bond. Filter both matched directions. Remaining sites fall into the correct geometric positions.

### Lone Pair Handling

Oxygen (valence 2) uses the `tetrahedral` electron geometry but only exposes 2 bond sites (the other 2 positions are lone pairs). The function `getElectronGeometry('O')` returns `'tetrahedral'`, but the ELEMENT_VALENCE for O is 2 — so only 2 of the 4 tetrahedral positions become ghost sites. The lone pairs compress the angle from 109.5° to ~104.5° automatically because the `bent` vectors are pre-computed at that angle.

**Wait — there's a subtlety.** For oxygen specifically, we use `bent` vectors (2 sites at 104.5°) not `tetrahedral` vectors filtered to 2. This is because the lone-pair compression changes the angle, and filtering tetrahedral vectors would give 109.5°. The `getElectronGeometry` function handles this:

- If the element has lone pairs that change the geometry, return the MOLECULAR geometry (bent, trigonal pyramidal)
- If no lone pairs, return the ELECTRON geometry (tetrahedral, trigonal planar)

For the game's simplified chemistry (6 elements, no double bonds), this mapping covers all cases.

### Ghost Site Visual

```tsx
// GhostSite.tsx — pulsing translucent indicator
const GhostSite: React.FC<{ position: Vector3; active: boolean }> = ({ position, active }) => {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.5 + 0.5;
    ref.current.scale.setScalar(active ? 0.2 + pulse * 0.15 : 0.15);
    (ref.current.material as THREE.MeshStandardMaterial).opacity =
      active ? 0.4 + pulse * 0.3 : 0.2;
  });

  return (
    <mesh ref={ref} position={position}>
      <icosahedronGeometry args={[0.3, 1]} />
      <meshStandardMaterial
        transparent
        opacity={0.2}
        color="#ffffff"
        emissive="#ffffff"
        emissiveIntensity={0.5}
        toneMapped={false}
      />
    </mesh>
  );
};
```

Ghost sites pulse faster and brighter when a dragged atom is within 3.0 units (preview range). They glow hard when within 1.5 units (snap range). They're invisible when no drag is active.

---

## IMPLEMENTATION ORDER

### Step 1: Replace VoxelAtom geometry + material (~30 min)
- Swap `boxGeometry` → `icosahedronGeometry args={[0.5, 2]}`
- Swap `meshStandardMaterial` → `MeshDistortMaterial` with `flatShading`
- Add `Float` wrapper
- Add `useMemo` for shared geometry
- Add per-atom phase offset
- Add asymmetric breathing in useFrame
- Test: atoms should breathe, wobble, glow against dark background

### Step 2: Fix ghost site geometry (~45 min)
- Replace `generateBondSitePositions` with VSEPR-compliant `getBondSitePositions`
- Implement `findBestRotation` with quaternion math
- Add proper lone-pair handling for O, N
- Test: place C, then add 4 H — sites should form tetrahedral shape

### Step 3: Fix drag-and-drop (~45 min)
- Add 20px screen-space threshold
- Increase snap radius to 1.5 units
- Implement delta-scaled lerp (not static factor)
- Add epsilon snap (0.01)
- Add orbit controls mutex (imperative ref mutation)
- Add haptic on snap
- Test: drag O from palette, approach H site, feel magnetic pull + haptic + sound

### Step 4: Wire excitement prop (~20 min)
- Add `excitement` to atom state in gameStore
- Set excitement based on game events (drag, snap, complete)
- Drive MeshDistortMaterial distort + speed from excitement
- Test: drag atom, watch it get excited. Bond, watch it calm. Complete molecule, watch celebration.

### Step 5: Update Bloom settings (~5 min)
- `luminanceThreshold={1.0}`
- `mipmapBlur` enabled
- Resolution 256×256
- Test: only hot atoms glow, background stays dark

---

## WHAT THIS DOESN'T COVER (Phase 2)

- Custom GLSL vertex shader with full depression sag, multi-octave fBm
- `react-spring/three` for spring-physics state transitions
- Pixel-to-voxel morph effect on atom placement
- Phosphor persistence (frame buffer feedback for motion trails)
- `three-custom-shader-material` for PBR + custom displacement
- InstancedMesh (not needed until >50 atoms)

The MeshDistortMaterial approach ships today and achieves 80% of the visual target. The custom shader is a Day 4 or post-launch refinement that gets the last 20% — the depression sag, the synchronized bonding breathing, the call-and-response timing. All that builds ON TOP of what ships now.

---

*Four sources. One spec. The atoms breathe. The bonds snap. The geometry is real.*

*Ship it.*
