# WCD-28: ATOM LABEL BILLBOARDING — FIX MIRRORED TEXT

**Status:** 🟡 HIGH — atom labels read backwards when camera rotates
**Date:** March 3, 2026
**Author:** Opus (Architect)
**Executor:** Sonnet (Mechanic)
**Priority:** Before March 10 ship. Visual polish.
**QA Source:** Will Johnson, Desktop Chrome — Image 4 shows "eF", "nM", "lC", "2" (reversed labels)

---

## 1. DEFECT DESCRIPTION

Atom labels (element symbols rendered on the 3D spheres) rotate with the atom mesh. When the camera orbits past ~90°, the labels appear mirrored:

- **Fe** → reads as **eF**
- **Mn** → reads as **nM**
- **Cl** → reads as **lC**
- **S** → reads as **2** (S mirrored looks like 2)

The labels are rendered as part of the 3D atom geometry (likely a Text or Sprite attached to the atom mesh). When the mesh rotates or the camera orbits, the text rotates with it instead of always facing the viewer.

---

## 2. FIX: BILLBOARD THE LABELS

### What is billboarding?

A billboarded element always faces the camera regardless of the camera's position or the parent object's rotation. Think of how nameplates in MMOs always face you.

### Implementation in R3F

#### Option A: `<Billboard>` from drei (RECOMMENDED)

```typescript
import { Billboard, Text } from '@react-three/drei';

function AtomLabel({ symbol, position }: { symbol: string; position: [number, number, number] }) {
  return (
    <Billboard position={position} follow={true} lockX={false} lockY={false} lockZ={false}>
      <Text
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="black"
      >
        {symbol}
      </Text>
    </Billboard>
  );
}
```

The `<Billboard>` component from drei automatically rotates its children to face the camera every frame. `follow={true}` ensures it updates continuously during orbit.

#### Option B: Manual billboard in useFrame

If you're not using drei's Billboard, or if the label is a Sprite:

```typescript
import { useFrame } from '@react-three/fiber';

function AtomLabel({ symbol, position }) {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame(({ camera }) => {
    if (ref.current) {
      ref.current.quaternion.copy(camera.quaternion);
    }
  });
  
  return (
    <mesh ref={ref} position={position}>
      {/* text geometry */}
    </mesh>
  );
}
```

`camera.quaternion` gives the camera's orientation. Copying it to the label mesh makes the label face the camera.

#### Option C: Use `<Sprite>` (built-in billboard)

Three.js Sprites always face the camera by default:

```typescript
<sprite position={position} scale={[0.5, 0.25, 1]}>
  <spriteMaterial map={textTexture} />
</sprite>
```

This is the simplest approach but requires generating text textures (Canvas2D → Texture), which is more work.

**Recommendation: Option A** if drei is already imported (it is — you use it for other things). Wrap every atom label in `<Billboard>`.

---

## 3. ALSO FIX: displayFormula() for mega-molecules

Image 3 shows the formula bar reading `CHNOPSNaCaMnClFe` at 83%. This is raw Hill system without subscripts. The `displayFormula()` function from WCD-14 may not handle formulas with 10+ elements, or it may not be applied to this code path.

**Check:** Is `displayFormula()` called for the formula bar in ALL cases, or only for known molecules in the dictionary? For uncatalogued molecules (the "NEW DISCOVERY!" case from Image 5), the raw Hill key may bypass `displayFormula()`.

**Fix:** Ensure `displayFormula()` is the ONLY path to the UI for any formula string. Even uncatalogued molecules should display with proper conventional notation and subscripts.

```typescript
// WRONG: sometimes uses raw formula
const display = knownMolecule ? displayFormula(formula) : formula;

// RIGHT: always uses displayFormula
const display = displayFormula(formula);
```

---

## 4. FILE MANIFEST

Files you WILL touch:

| File | Action |
|------|--------|
| `src/components/Atom.tsx` (or AtomSphere, AtomLabel) | Wrap label in `<Billboard>` from drei |
| `src/components/StabilityMeter.tsx` or `CommandBar.tsx` | Ensure displayFormula() is called for ALL formula display paths |

Files you MUST NOT touch:

| File | Reason |
|------|--------|
| `src/chemistry/*` | Chemistry is correct — this is a rendering issue |
| `src/telemetry/*` | Unrelated |

---

## 5. VERIFICATION CHECKLIST

- [ ] **Fe label:** Reads "Fe" from all camera angles, never "eF"
- [ ] **Mn label:** Reads "Mn" from all camera angles, never "nM"
- [ ] **Cl label:** Reads "Cl" from all camera angles, never "lC"
- [ ] **S label:** Reads "S" from all camera angles, never "2"
- [ ] **H label:** Still correct (symmetric, but verify)
- [ ] **Camera orbit:** Labels remain readable during continuous orbit animation
- [ ] **Multiple atoms:** Labels don't overlap when atoms are close together (they may — acceptable for now)
- [ ] **Mobile:** Labels readable at mobile resolution
- [ ] **Desktop:** Labels crisp at desktop resolution
- [ ] **Mega-formula display:** CHNOPSNaCaMnClFe displays with proper subscripts and conventional notation
- [ ] **Uncatalogued formula:** "NEW DISCOVERY" molecules display with subscripts
- [ ] **Performance:** Billboard updates don't drop below 60fps (drei's Billboard is optimized)
- [ ] **Vitest:** All existing tests pass
- [ ] **Build clean:** `npm run build` — zero errors

---

*WCD-28 — Opus — March 3, 2026*
*"If the player has to tilt their head to read the label, it's not a label. It's a puzzle."*
