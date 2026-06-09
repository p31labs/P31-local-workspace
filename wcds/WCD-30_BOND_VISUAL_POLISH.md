# WCD-30: BOND CONNECTOR VISUAL POLISH

**Status:** 🟡 HIGH — ghost sites look mechanical, bonds look disconnected
**Date:** March 3, 2026
**Author:** Opus (Architect)
**Executor:** Sonnet (Mechanic)
**Priority:** Before March 10 ship. Visual quality.
**QA Source:** Will Johnson, Chromebook — Image 1 shows oversized ghost site cylinders + disconnected Fe atom

---

## 1. DEFECT DESCRIPTION

Two visual problems with bonds and ghost sites:

### Problem A: Ghost site cylinders are too prominent

The VSEPR ghost attachment points are rendered as semi-transparent cylinders protruding from each atom. They're too large, too opaque, and too geometric. They look like mechanical joints or pipe fittings, not potential bond sites in a chemistry game.

**Current:** ~0.3-0.4 unit radius cylinders, 30-50% opacity, visible at all times
**Expected:** Subtle, ethereal indicators that suggest "something can connect here" without looking like hardware

### Problem B: Nearby atoms appear disconnected

In Image 1, Fe is visually adjacent to the molecule cluster but has no bond line connecting it. Either:
- Fe is genuinely unbonded (placed near but not snapped to a ghost site)
- Fe IS bonded but the bond line doesn't render at that distance
- The bond snapping radius is too small for larger atoms

---

## 2. FIX: GHOST SITES

### Make ghost sites ethereal, not mechanical

```typescript
// Ghost site sphere (not cylinder)
<mesh position={ghostPosition}>
  <sphereGeometry args={[0.12, 16, 16]} />  {/* was 0.3+ */}
  <meshBasicMaterial
    color="#ffffff"
    transparent={true}
    opacity={0.15}            {/* was 0.3-0.5 */}
  />
</mesh>
```

Changes:
1. **Shape:** Sphere, not cylinder. A soft dot, not a pipe.
2. **Size:** 0.12 radius (small, subtle), not 0.3+
3. **Opacity:** 15%, not 30-50%. Barely visible until you're looking for it.
4. **Animation:** Gentle pulse (opacity oscillates 0.1–0.2 over 2 seconds). Breathing, not blinking.

```typescript
// Pulse animation
useFrame(({ clock }) => {
  if (materialRef.current) {
    materialRef.current.opacity = 0.1 + Math.sin(clock.elapsedTime * 2) * 0.05;
  }
});
```

### Show ghost sites only during drag

Ghost sites should be INVISIBLE when the player isn't actively dragging an atom. They appear (fade in) when a drag starts and disappear (fade out) when the drag ends or completes.

```typescript
const isDragging = useGameStore(s => s.isDragging);

// Only render ghost sites during active drag
{isDragging && ghostSites.map(site => (
  <GhostSite key={site.id} position={site.position} />
))}
```

This eliminates visual clutter during normal gameplay and makes the ghost sites feel like a helpful guide during the specific moment you need them.

### Highlight nearest ghost site during drag

When dragging an atom, the ghost site closest to the cursor should glow brighter:

```typescript
const distToPointer = ghostPosition.distanceTo(pointerPosition);
const isNearest = distToPointer < 0.5; // snap radius

<meshBasicMaterial
  color={isNearest ? "#4ade80" : "#ffffff"}  // green when snappable
  opacity={isNearest ? 0.4 : 0.15}
/>
```

The nearest ghost site lights up green, telling the player "drop here to bond."

---

## 3. FIX: BOND LINES

### Verify bond line rendering at all distances

The bond between two atoms should render as a line/cylinder connecting their centers regardless of atom size or distance. If the bond line length calculation subtracts atom radii to avoid overlap, large atoms (Fe, Na, Cl) may reduce the visible bond to near-zero or negative length.

```typescript
// Bond cylinder between two atoms
const distance = posA.distanceTo(posB);
const radiusA = atomA.visualRadius;
const radiusB = atomB.visualRadius;

// WRONG: bond only renders between sphere surfaces
const bondLength = distance - radiusA - radiusB; // can be ≤ 0 for large atoms!

// RIGHT: bond always renders between centers, overlapping spheres
const bondLength = distance; // full center-to-center
// The cylinder renders through the atom spheres, which is fine because
// the spheres are semi-transparent and the bond line is visible inside them
```

Or, if the bond line between surfaces IS desired:

```typescript
const bondLength = Math.max(0.1, distance - radiusA * 0.7 - radiusB * 0.7);
// Clamp to minimum 0.1 so the bond is always visible
// Use 0.7x radius so bond overlaps slightly into each atom
```

### Bond line visual style

```typescript
<mesh position={midpoint} rotation={lookAtRotation}>
  <cylinderGeometry args={[0.04, 0.04, bondLength, 8]} />  {/* thin cylinder */}
  <meshStandardMaterial
    color={bondColor}         // colored by bond type
    emissive={bondColor}
    emissiveIntensity={0.3}   // subtle glow
    transparent={true}
    opacity={0.8}
  />
</mesh>
```

Bonds should be thin (0.04 radius), slightly glowing, and clearly visible against the dark background.

---

## 4. FILE MANIFEST

Files you WILL touch:

| File | Action |
|------|--------|
| `src/components/GhostSite.tsx` (or equivalent in MoleculeCanvas) | Resize to small spheres, reduce opacity, add pulse, show only during drag |
| `src/components/Bond.tsx` (or BondLine, or bond rendering in MoleculeCanvas) | Fix bond length calculation for large atoms, ensure minimum visible length |
| `src/stores/gameStore.ts` | Expose `isDragging` state if not already |

Files you MUST NOT touch:

| File | Reason |
|------|--------|
| `src/chemistry/vsepr.ts` | Ghost site POSITIONS are correct — this is how they LOOK |
| `src/chemistry/*` | Bond LOGIC is correct — this is how bonds RENDER |

---

## 5. VERIFICATION CHECKLIST

- [ ] **Ghost sites idle:** NOT visible when no drag is active
- [ ] **Ghost sites during drag:** Small, subtle, pulsing dots appear at valid bond positions
- [ ] **Nearest ghost site:** Glows green when dragged atom is within snap radius
- [ ] **Ghost site size:** ~0.12 radius sphere (not 0.3+ cylinder)
- [ ] **Ghost site opacity:** 15% base, 40% when highlighted
- [ ] **Bond between H-H:** Visible thin line connecting the two atoms
- [ ] **Bond between large atoms (Fe-C, Na-N):** Visible bond line, not hidden by atom overlap
- [ ] **Bond glow:** Slight emissive glow on bond lines for visibility against dark background
- [ ] **Multiple bonds from one atom:** All bonds render clearly, no z-fighting
- [ ] **Mobile:** Ghost sites and bonds visible at phone resolution
- [ ] **Performance:** Ghost site pulse animation maintains 60fps
- [ ] **Vitest:** All existing tests pass
- [ ] **Build clean:** `npm run build` — zero errors

---

*WCD-30 — Opus — March 3, 2026*
*"A ghost site should whisper 'connect here.' Not shout 'PIPE FITTING.'"*
