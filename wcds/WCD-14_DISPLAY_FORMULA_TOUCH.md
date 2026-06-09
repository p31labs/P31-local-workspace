# WCD-14: DISPLAY FORMULA + TOUCH HARDENING

**Status:** 🟡 HIGH — polish pass required before March 10 ship
**Date:** March 2, 2026
**Author:** Opus (Architect)
**Executor:** Sonnet (Mechanic)
**Priority:** After WCD-13 (multiplayer). Two small tracks combined into one WCD.
**Estimated Effort:** 0.5 day

---

## PART A: displayFormula() — CONVENTIONAL NOTATION

### 1. Problem

The chemistry engine uses Hill system ordering internally (C first, H second, then alphabetical). This is correct for the internal dictionary key. But the UI displays the Hill formula directly to the player, which produces non-standard notation:

- `OCa` instead of `CaO` (calcium oxide)
- `HCl` is correct by accident (Hill: C before H doesn't apply when no carbon)
- `ClNa` instead of `NaCl`

Kids (and adults) expect to see conventional chemical notation: CaO, NaCl, H₂O — not the Hill-sorted internal key.

### 2. Solution

Create a `displayFormula(hillFormula: string): string` utility that converts internal Hill notation to conventional notation for UI display. The molecule dictionary should store both:

- `formula`: Hill system key (used internally for matching, lookups)
- `display`: Conventional notation (used in UI, toasts, achievements)

### 3. Implementation

```typescript
// src/chemistry/displayFormula.ts

/**
 * Each molecule in the dictionary already has a formula (Hill).
 * Add a 'display' field with conventional notation.
 * This is a MANUAL mapping, not algorithmic — chemical naming
 * conventions don't follow a single rule.
 */

// For molecules already in the dictionary, add display overrides
// only where Hill notation differs from conventional:
export const DISPLAY_OVERRIDES: Record<string, string> = {
  'CaO':   'CaO',     // Hill would sort Ca, O → same, but confirm
  'ClH':   'HCl',     // Hill: Cl before H (no carbon); conventional: HCl
  'ClNa':  'NaCl',    // Hill: Cl before Na; conventional: NaCl
  'ClK':   'KCl',     // Hill: Cl before K; conventional: KCl
  'HO':    'OH',      // hydroxyl radical
  'FeO':   'FeO',     // matches already
  'H2O4S': 'H₂SO₄',  // sulfuric acid
  'Fe2O3': 'Fe₂O₃',  // iron oxide
  // Add more as needed from the 62-molecule dictionary
};

/**
 * Convert internal formula to display notation.
 * Also handles subscript formatting for UI rendering.
 */
export function displayFormula(formula: string): string {
  // Check override map first
  if (DISPLAY_OVERRIDES[formula]) {
    return DISPLAY_OVERRIDES[formula];
  }

  // Default: add subscript formatting to the Hill formula
  return formatSubscripts(formula);
}

/**
 * Convert "H2O" → "H₂O" for display.
 * Uses Unicode subscript digits.
 */
export function formatSubscripts(formula: string): string {
  const subscriptMap: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  };

  return formula.replace(/(\d+)/g, (match) =>
    match.split('').map(d => subscriptMap[d] || d).join('')
  );
}
```

### 4. Where to Apply

Replace ALL user-facing formula text with `displayFormula()` calls:

| Location | Current | After |
|----------|---------|-------|
| Achievement toast | "You built H2O!" | "You built H₂O!" |
| Achievement list | "H2O - Water" | "H₂O — Water" |
| Molecule label (on canvas) | "H2O" | "H₂O" |
| Multiplayer toast (WCD-13) | "Bash built CO2!" | "Bash built CO₂!" |
| Checkpoint UI | "CO2" | "CO₂" |
| Bug report context | raw formula | display formula |

**Do NOT change:**
- Internal dictionary keys (keep Hill for matching)
- Telemetry payloads (keep raw formula for data consistency)
- Test assertions that match on Hill formula

---

## PART B: TOUCH HARDENING

### 1. What WCD-09 Already Fixed

- Viewport: `100dvh` / `fixed inset-0`
- `user-scalable=no`, `maximum-scale=1.0`
- Overflow/scrolling locked on html/body
- Canvas sized to parent (100% not 100vh)

### 2. What Remains

#### 2a. touch-action: none on interactive elements

Every draggable element and the canvas need `touch-action: none` to prevent browser default gestures (scroll, zoom, back-swipe) from hijacking drag operations.

```css
/* Canvas container */
.canvas-wrapper {
  touch-action: none;
}

/* Draggable atoms in palette */
.palette-atom {
  touch-action: none;
  -webkit-touch-callout: none;   /* prevent iOS long-press menu */
  -webkit-user-select: none;
  user-select: none;
}

/* Atoms on canvas (during drag) */
.draggable-atom {
  touch-action: none;
}
```

#### 2b. 48px minimum touch targets

Per WCAG 2.5.8 and mobile UX best practices, all interactive elements must have a minimum 44×44px touch target (we use 48px for extra margin).

Audit and fix these elements:

| Element | Current Size (check) | Required |
|---------|---------------------|----------|
| Palette atoms (H, O, etc.) | Verify ≥ 48px | 48×48px min |
| HUD icons (mode, lungs, code, bug) | Verify ≥ 48px | 48×48px min |
| Achievement toast dismiss (✕) | Often too small | 48×48px min |
| Mode select cards | Should be large | 100px+ height |
| Bug report submit button | 48px (set in WCD-11) | ✓ Already correct |
| PING emoji buttons (WCD-13) | Must be 48px+ | 48×48px min |

For elements that are visually smaller than 48px, use padding or `::before` pseudo-element to expand the touch target without changing visual size:

```css
.small-icon-button {
  position: relative;
  /* Visual size */
  width: 32px;
  height: 32px;
}

.small-icon-button::before {
  content: '';
  position: absolute;
  /* Expanded touch target */
  top: -8px;
  left: -8px;
  right: -8px;
  bottom: -8px;
}
```

#### 2c. Drag-off-screen handling

When a user drags an atom and their finger slides off the edge of the screen:

- The drag MUST cancel gracefully (atom returns to palette or stays at last valid position)
- No orphaned drag state (no invisible atom stuck to the finger)
- No JavaScript errors

Listen for these events on the window/document:

```typescript
// Handle drag cancellation
window.addEventListener('pointerup', handleDragEnd);
window.addEventListener('pointercancel', handleDragEnd);  // critical for mobile
window.addEventListener('blur', handleDragEnd);            // tab switch mid-drag
document.addEventListener('visibilitychange', () => {
  if (document.hidden) handleDragEnd();
});
```

The R3F pointer events may already handle some of this, but verify explicitly on mobile. Test by dragging an atom to the edge of the screen and releasing outside the browser viewport.

#### 2d. Prevent pull-to-refresh on Android Chrome

```css
body {
  overscroll-behavior-y: contain;  /* may already be set from WCD-09 */
}
```

Also verify that `overscroll-behavior: none` from WCD-09's CSS additions covers this.

---

## 3. FILE MANIFEST

Files you WILL touch:

| File | Action |
|------|--------|
| `src/chemistry/displayFormula.ts` | **CREATE** — display formula utility + override map |
| `src/components/Achievements.tsx` | **MODIFY** — use displayFormula() for all formula text |
| `src/components/MoleculeCanvas.tsx` | **MODIFY** — use displayFormula() for canvas label |
| `src/components/TopBar.tsx` | **MODIFY** — touch-action on HUD icons, 48px targets |
| `src/components/Palette.tsx` | **MODIFY** — touch-action on atoms, 48px targets |
| `src/index.css` (or global styles) | **MODIFY** — touch-action, overscroll-behavior |
| `src/components/Toast.tsx` (or equivalent) | **MODIFY** — use displayFormula() in toast text |
| Drag handler (wherever drag logic lives) | **MODIFY** — add pointercancel/blur listeners |

Files you MUST NOT touch:

| File | Reason |
|------|--------|
| `src/chemistry/molecules.ts` internal keys | Hill keys are the source of truth for matching |
| `src/telemetry/*` | Raw formulas in telemetry, not display formulas |
| `src/multiplayer/*` | Just built in WCD-13, don't modify |
| `worker-telemetry.ts` | Worker doesn't render formulas |

---

## 4. VERIFICATION CHECKLIST

### displayFormula
- [ ] **H₂O displays correctly** with subscript ₂ (not H2O)
- [ ] **CaO displays as CaO** (not OCa)
- [ ] **NaCl displays as NaCl** (not ClNa)
- [ ] **HCl displays as HCl** (not ClH)
- [ ] **Glucose displays as C₆H₁₂O₆** with proper subscripts
- [ ] **All achievement text** uses displayFormula()
- [ ] **All toast text** uses displayFormula()
- [ ] **Canvas molecule label** uses displayFormula()
- [ ] **Internal dictionary keys unchanged** — Hill formula still used for matching

### Touch Hardening
- [ ] **Palette atoms:** touch-action: none, no browser gestures on drag
- [ ] **Canvas:** touch-action: none, no scroll/zoom during interaction
- [ ] **48px touch targets:** All HUD icons, palette atoms, dismiss buttons ≥ 48px
- [ ] **Drag off-screen:** Atom returns gracefully, no orphaned state
- [ ] **Pull-to-refresh blocked:** Android Chrome doesn't trigger refresh on downward swipe
- [ ] **Long-press blocked:** iOS doesn't show callout menu on atom long-press
- [ ] **Tab switch mid-drag:** Drag cancels cleanly on blur/visibilitychange

### Regression
- [ ] **Vitest:** All existing tests pass
- [ ] **Build clean:** `npm run build` — zero errors
- [ ] **tsc clean:** `tsc --noEmit` — zero errors
- [ ] **Desktop:** No regression on mouse interaction
- [ ] **Mobile (Android Chrome):** Full play-through works with touch only

---

*WCD-14 — Opus — March 2, 2026*
*"H₂O, not H2O. CaO, not OCa. The display layer speaks human. The engine speaks chemistry."*
