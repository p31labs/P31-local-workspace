# WCD-09: MOBILE VIEWPORT FIX — ELEMENT PALETTE BELOW FOLD

**Status:** 🔴 SHIP BLOCKER
**Date:** March 2, 2026
**Author:** Opus (Architect)
**Executor:** Sonnet (Mechanic)
**Priority:** Immediate — blocks all tester interaction on mobile
**QA Source:** Carrie Johnson (sister), Android device, bonding.p31ca.org

---

## 1. DEFECT DESCRIPTION

On mobile browsers (Android Chrome confirmed, iOS Safari suspected), the element palette (H and O atoms in Seed mode) is clipped below the visible viewport. The canvas occupies the full screen. Users see "Drag an element up to begin" but cannot see or reach the element tray to drag from.

**Impact:** 100% of mobile users cannot play the game. This is not a cosmetic bug. The game is non-functional on the primary target devices (2× Android tablets for Bash and Willow).

**Root Cause (Probable):** The R3F `<Canvas>` is sized to `100vh`, which on mobile browsers includes the area behind the URL bar chrome. The element palette sits below the canvas in the DOM, pushing it offscreen. This is the well-documented `100vh` vs dynamic viewport height discrepancy on iOS Safari and Android Chrome.

---

## 2. FILE MANIFEST

Files you WILL touch:

| File | Action |
|------|--------|
| `src/App.tsx` (or root layout component) | Modify viewport layout structure |
| `src/components/Palette.tsx` (or equivalent) | Verify palette height is fixed, not dynamic |
| `src/components/Canvas.tsx` (or equivalent R3F wrapper) | Make canvas fill REMAINING space, not 100vh |
| `index.html` | Add viewport meta if missing |

Files you MUST NOT touch:

| File | Reason |
|------|--------|
| `src/stores/*` | Zustand stores are stable. No state changes needed. |
| `src/chemistry/*` | Chemistry engine is unrelated to layout. |
| `src/telemetry/*` | Genesis Block is locked. Do not modify. |
| `src/economy/*` | L.O.V.E. ledger is locked. Do not modify. |
| `worker-telemetry.ts` | Cloudflare Worker is deployed and stable. |

---

## 3. WIRING GUIDE

### Strategy: Fixed palette dock + flex-fill canvas

The layout must guarantee the palette is always visible, and the canvas takes remaining space. Do NOT use `100vh` anywhere.

```
┌─────────────────────────┐
│  HUD bar (icons)        │  ← fixed height, top
├─────────────────────────┤
│                         │
│    R3F <Canvas>         │  ← flex: 1 (fills remaining)
│                         │
│                         │
├─────────────────────────┤
│  Element Palette        │  ← fixed height, bottom (min 80px)
│  [ H ] [ O ]            │
└─────────────────────────┘
```

### Implementation Steps

**Step 1: Root layout → flexbox column, height: 100dvh**

```css
/* Use 100dvh with 100vh fallback */
.game-container {
  display: flex;
  flex-direction: column;
  height: 100dvh;        /* dynamic viewport height — respects mobile chrome */
  height: 100vh;         /* fallback for older browsers (put BEFORE dvh line) */
  overflow: hidden;
  touch-action: none;
}

/* Actually: put the fallback first so dvh overrides it */
.game-container {
  display: flex;
  flex-direction: column;
  height: 100vh;         /* fallback */
  height: 100dvh;        /* override where supported */
  overflow: hidden;
}
```

**Step 2: Canvas wrapper → flex: 1**

```css
.canvas-wrapper {
  flex: 1;
  min-height: 0;         /* critical: allows flex child to shrink below content size */
  position: relative;
  touch-action: none;
}
```

**Step 3: Palette → fixed height at bottom**

```css
.palette-dock {
  flex-shrink: 0;        /* never shrink */
  height: 80px;          /* fixed — adjust to match current design */
  min-height: 80px;
  touch-action: none;
  z-index: 10;           /* per Cockpit z-index contract */
}
```

**Step 4: Viewport meta in index.html**

Verify this exists. If not, add it:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

The `viewport-fit=cover` handles iOS safe areas (notch). The `user-scalable=no` prevents pinch-zoom interfering with drag gestures.

**Step 5: Body/html overflow lock**

```css
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  overscroll-behavior: none;
  -webkit-overflow-scrolling: none;
  position: fixed;       /* prevents iOS rubber-banding */
  width: 100%;
  height: 100%;
}
```

---

## 4. VERIFICATION CHECKLIST

All checks must pass before WCD-09 is closed.

- [ ] **Android Chrome (phone):** Element palette visible without scrolling on load
- [ ] **Android Chrome (tablet):** Element palette visible without scrolling on load
- [ ] **iOS Safari (if available):** Element palette visible without scrolling on load
- [ ] **Desktop Chrome:** No layout regression — game still fills window correctly
- [ ] **Drag interaction works:** Can drag H from palette to canvas on mobile touch
- [ ] **HUD icons visible:** Seed/Sprout/Sapling mode icons still accessible at top
- [ ] **Canvas not clipped:** 3D scene renders fully in remaining space
- [ ] **No scroll:** Page does not scroll on any axis on mobile
- [ ] **Existing Vitest suite:** `npm run test` — all 484 tests still green
- [ ] **Build clean:** `npm run build` — zero errors
- [ ] **TypeScript clean:** `tsc --noEmit` — zero errors

---

## 5. NOTES

This WCD overlaps with the "Touch Hardening" track scoped for March 10 ship (Passport §4, Track 3). If touch-action and viewport lock are addressed here, mark Touch Hardening as partially complete.

The `100dvh` unit is supported in Chrome 108+, Safari 15.4+, Firefox 94+. The fallback to `100vh` covers older browsers. For the target devices (Android tablets with current Chrome), `dvh` will be used.

Do not attempt to fix the multiplayer room creation error in this WCD. That is WCD-10.

---

*WCD-09 — Opus — March 2, 2026*
*"The palette must be visible. If the player can't reach the elements, there is no game."*
