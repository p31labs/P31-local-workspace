# WCD-17: JITTERBUG NAVIGATOR VIEWPORT CLIPPING

**Status:** 🟢 LOW — cosmetic, not a ship blocker
**Date:** March 2, 2026
**Author:** Opus (Architect)
**Executor:** Sonnet (Mechanic)
**Priority:** Polish pass. After WCD-15 and WCD-16. Nice-to-have for March 10.
**QA Source:** Will Johnson, iPhone — wireframe cuboctahedron clipped at right edge in 8 of 9 screenshots

---

## 1. DEFECT DESCRIPTION

The Jitterbug Navigator (wireframe cuboctahedron/IVM visualization in the bottom-right corner) is consistently clipped by the right edge of the viewport on mobile. Approximately 10-20% of the geometry extends beyond the visible area.

The Navigator is rendered at a fixed position in the bottom-right of the R3F canvas. On mobile viewports (narrower than desktop), the fixed position pushes the right portion offscreen.

**Impact:** Cosmetic only. The Navigator is a background ambient element — it shows the IVM geometry but is not interactive in the current build. No gameplay is affected. However, it looks unfinished, and testers will notice.

---

## 2. FIX OPTIONS

### Option A: Responsive positioning (RECOMMENDED)

Scale and reposition the Navigator based on viewport width. On narrow screens, move it further left and/or scale it down.

```typescript
// In the Navigator component or its parent positioning logic
const viewportWidth = window.innerWidth;
const isMobile = viewportWidth < 768;

const navigatorPosition: [number, number, number] = isMobile
  ? [2.5, -2.5, -5]    // pulled left on mobile
  : [3.5, -2.5, -5];   // original desktop position

const navigatorScale = isMobile ? 0.7 : 1.0;
```

If this is rendered inside R3F (which it appears to be, given the 3D wireframe), the position is in Three.js world units relative to the camera. Adjusting the x-position inward by ~1 unit on mobile should bring it fully into view.

### Option B: CSS overflow visible

If the Navigator is positioned via CSS (unlikely given it's a 3D wireframe):

```css
.navigator-container {
  right: 16px;          /* instead of right: 0 or negative value */
  bottom: 120px;        /* above palette dock */
  transform: scale(0.8); /* scale down on mobile */
}
```

### Option C: Hide on mobile

If the Navigator is purely decorative and adds visual clutter on small screens, hide it below a breakpoint:

```typescript
const isMobile = window.innerWidth < 768;
if (isMobile) return null; // don't render
```

This is the lowest-effort fix but loses the visual identity element. Not recommended unless time is critical.

---

## 3. FILE MANIFEST

Files you WILL touch:

| File | Action |
|------|--------|
| `src/components/JitterbugNavigator.tsx` (or equivalent) | Adjust position/scale based on viewport width |
| OR: Parent canvas component where Navigator is positioned | Adjust the position prop |

Files you MUST NOT touch:

| File | Reason |
|------|--------|
| Everything else | This is a single-component position adjustment |

---

## 4. IMPLEMENTATION NOTES

### Detecting viewport width in R3F

Inside an R3F component, use the `useThree` hook:

```typescript
import { useThree } from '@react-three/fiber';

function JitterbugNavigator() {
  const { viewport } = useThree();
  
  // viewport.width is in Three.js world units
  // For responsive positioning, use window.innerWidth or viewport.aspect
  const isMobile = viewport.aspect < 1; // portrait = mobile
  
  const position: [number, number, number] = isMobile
    ? [2.0, -2.0, -5]
    : [3.5, -2.5, -5];
    
  const scale = isMobile ? 0.65 : 1.0;
  
  return (
    <group position={position} scale={scale}>
      {/* existing wireframe geometry */}
    </group>
  );
}
```

### Alternative: useMediaQuery outside R3F

If the Navigator's position is set via props from a parent component:

```typescript
const isMobile = window.innerWidth < 768;
// Or use a React hook for resize listening

<JitterbugNavigator
  position={isMobile ? [2.0, -2.0, -5] : [3.5, -2.5, -5]}
  scale={isMobile ? 0.65 : 1.0}
/>
```

### Resize handling

Add a window resize listener or use R3F's built-in viewport reactivity so the Navigator repositions if the device orientation changes (portrait → landscape):

```typescript
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth < 768);
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

---

## 5. VERIFICATION CHECKLIST

- [ ] **iPhone portrait:** Navigator fully visible within viewport bounds
- [ ] **iPhone landscape:** Navigator repositions appropriately
- [ ] **Android tablet portrait:** Navigator visible
- [ ] **Desktop (wide):** No regression — Navigator at original position and scale
- [ ] **Navigator still animates:** Rotation/pulsing animation (if any) still works at reduced scale
- [ ] **No overlap with palette:** Navigator doesn't collide with element palette dock
- [ ] **No overlap with atoms:** Navigator stays behind game atoms (z-depth)
- [ ] **Vitest:** All existing tests pass
- [ ] **Build clean:** `npm run build` — zero errors

---

## 6. SCOPE BOUNDARY

This WCD is ONLY about positioning the Navigator within the viewport. Do NOT:

- Change the wireframe geometry itself
- Add interactivity to the Navigator
- Connect it to the Q-Factor system (that's Spaceship Earth post-merge)
- Change its colors or line styles

Move it left. Scale it down. Ship it.

---

*WCD-17 — Opus — March 2, 2026*
*"The geometry should fit the screen, not the other way around."*
