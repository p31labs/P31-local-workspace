# WCD-19: ATOM SCALE CLAMPING — GIANT ATOMS ON MOBILE

**Status:** 🟡 HIGH — confusing UX, especially for young players
**Date:** March 2, 2026
**Author:** Opus (Architect)
**Executor:** Sonnet (Mechanic)
**Priority:** After WCD-18 (Safari safe area). Before March 10 ship.
**QA Source:** Will Johnson, iPhone — Image 9 shows Cl atom filling ~60% of viewport

---

## 1. DEFECT DESCRIPTION

On mobile, atoms can render at wildly different visual sizes. In one screenshot, a Cl (chlorine) atom fills approximately 60% of the visible viewport — a massive green sphere dominating the screen. In another screenshot from the same session, the same element renders at a reasonable size.

**Impact for kids:** If Willow taps Seed mode and her first H atom fills the entire screen, she'll think the game is broken. If Bash zooms in accidentally and can't zoom back out, he loses his molecule. The atoms need a consistent, bounded visual size regardless of camera position or zoom state.

**Probable Causes:**

1. **No camera zoom clamping.** If the R3F camera allows pinch-zoom or scroll-zoom, the user can fly into the molecule until atoms fill the screen. On mobile, accidental pinch gestures are common.

2. **Atom radius scaling.** Different elements have different atomic radii (Cl is larger than H). If the radius scaling factor is too aggressive, larger atoms become disproportionately huge on small screens.

3. **Camera-to-origin distance.** If atoms are placed at or near the camera's z=0 and the camera is close, perspective projection makes them massive.

---

## 2. FIX

### Strategy: Clamp both the camera and the atom radii

#### Fix A: Camera zoom limits

If using OrbitControls or similar:

```typescript
<OrbitControls
  minDistance={5}       // can't zoom closer than 5 units
  maxDistance={20}      // can't zoom further than 20 units
  enableZoom={true}     // allow zoom but within bounds
  enablePan={false}     // prevent pan on mobile (causes drift)
  // Touch settings
  touches={{
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_ROTATE  // pinch = zoom, not pan
  }}
/>
```

If NOT using OrbitControls (custom camera), add distance clamping in the camera update loop:

```typescript
const distance = camera.position.length();
const clampedDistance = Math.max(5, Math.min(20, distance));
camera.position.normalize().multiplyScalar(clampedDistance);
```

#### Fix B: Atom visual radius cap

Regardless of the element's actual atomic radius, cap the visual sphere radius to a maximum that keeps atoms reasonable on screen:

```typescript
const BASE_RADIUS = 0.3;  // smallest atom (H)
const SCALE_FACTOR = 0.05; // per atomic radius unit

// Current: radius = element.atomicRadius * SCALE_FACTOR
// New: clamp to [BASE_RADIUS, MAX_RADIUS]
const MAX_RADIUS = 0.8;    // no atom visually larger than this

const visualRadius = Math.min(
  MAX_RADIUS,
  Math.max(BASE_RADIUS, element.atomicRadius * SCALE_FACTOR)
);
```

The ratio between smallest (H) and largest (Cl, Ca) should be at most ~2.5:1, not 5:1 or higher. Large atoms should be noticeably bigger, not overwhelmingly bigger.

#### Fix C: Responsive scale based on viewport

On smaller screens, scale all atoms down slightly:

```typescript
const { viewport } = useThree();
const screenScale = viewport.width < 8 ? 0.75 : 1.0; // mobile gets 75% atom size
```

This ensures the same molecule looks proportional on both a phone screen and a desktop monitor.

---

## 3. FILE MANIFEST

Files you WILL touch:

| File | Action |
|------|--------|
| `src/components/MoleculeCanvas.tsx` | Camera zoom clamping (minDistance/maxDistance) |
| `src/components/Atom.tsx` (or AtomSphere, whatever renders the 3D atom) | Cap visual radius |
| `src/config/elements.ts` (or element data) | Verify radius values aren't outsized |

Files you MUST NOT touch:

| File | Reason |
|------|--------|
| `src/chemistry/*` (bonding logic) | Chemistry is correct; this is a visual scaling issue |
| `src/telemetry/*` | Unrelated |

---

## 4. VERIFICATION CHECKLIST

- [ ] **Cl atom:** Visually no more than ~2.5x the size of H atom
- [ ] **Ca atom:** Same constraint
- [ ] **Pinch zoom:** Bounded — can't zoom in until atoms fill screen
- [ ] **Pinch zoom:** Bounded — can't zoom out until atoms are dots
- [ ] **No accidental pan:** Mobile two-finger gesture doesn't drift the camera off the molecule
- [ ] **H atom in Seed mode:** Reasonable size on iPhone viewport
- [ ] **Desktop:** No visual regression — atoms still look proportional
- [ ] **Existing molecules:** H₂O, NaCl, CO₂ all render with balanced atom sizes
- [ ] **Vitest:** All existing tests pass
- [ ] **Build clean:** `npm run build` — zero errors

---

*WCD-19 — Opus — March 2, 2026*
*"An atom that fills the screen isn't an atom. It's a wall."*
