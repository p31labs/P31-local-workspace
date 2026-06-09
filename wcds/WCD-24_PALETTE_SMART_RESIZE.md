# WCD-24: PALETTE SMART RESIZE — SCROLLABLE, RESPONSIVE, NO DEAD SPACE

**Status:** 🔴 SHIP BLOCKER — Sapling mode elements inaccessible (clipped at edges)
**Date:** March 2, 2026
**Author:** Opus (Architect)
**Executor:** Sonnet (Mechanic)
**Priority:** IMMEDIATE — players in Sapling mode cannot access N (left edge) or S+ (right edge)
**QA Source:** Will Johnson, iPhone — Image 6 shows N and S clipped at palette edges

---

## 1. DEFECT DESCRIPTION

Two problems with the element palette dock:

### Problem A: Sapling elements clipped at edges (BLOCKER)

In Sapling mode, the palette shows N, O, Na, P, Ca, Cl, S (and presumably more offscreen). The N element is clipped on the left edge and S is clipped on the right edge. There is no scroll indicator, no swipe affordance, and no way for the player to reach elements beyond the visible viewport width.

**Impact:** A Sapling player literally cannot access all elements. The game is broken for advanced mode.

### Problem B: Seed mode dead space

In Seed mode, the palette shows only H and O — two elements centered in a dock that spans the full viewport width. The remaining ~70% of the dock is empty space. This wastes valuable screen real estate and looks unfinished.

---

## 2. FIX

### Strategy: Scrollable palette with centered content and visual affordance

#### Step 1: Make the palette horizontally scrollable

```css
.palette-dock {
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;  /* smooth momentum scrolling on iOS */
  scroll-snap-type: x proximity;      /* optional: snap to elements */
  scrollbar-width: none;              /* hide scrollbar — ugly on mobile */
  -ms-overflow-style: none;
}

.palette-dock::-webkit-scrollbar {
  display: none;                      /* hide scrollbar on WebKit */
}
```

#### Step 2: Center elements when they fit, scroll when they don't

```css
.palette-dock {
  justify-content: center;  /* centers H and O in Seed mode */
}

.palette-elements-container {
  display: flex;
  flex-direction: row;
  gap: 12px;
  padding: 8px 16px;
  /* When content exceeds container: scrolls
     When content fits: centers via parent justify-content */
}
```

The key behavior:
- **Seed (2 elements):** H and O sit centered in the dock. No dead space feel because they're centered, not left-aligned with emptiness to the right.
- **Sprout (4 elements):** H, C, N, O fill the dock evenly. Likely fits without scrolling on most phones.
- **Sapling (7+ elements):** Elements scroll horizontally. All elements are accessible.

#### Step 3: Scroll affordance — fade edges

When there are more elements than fit on screen, show a subtle gradient fade on the clipped edge(s) to indicate scrollability:

```css
.palette-dock {
  position: relative;
}

/* Left fade — only when scrolled right */
.palette-dock.can-scroll-left::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 32px;
  background: linear-gradient(to right, rgba(10, 15, 30, 0.9), transparent);
  z-index: 2;
  pointer-events: none;
}

/* Right fade — only when more content to the right */
.palette-dock.can-scroll-right::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 32px;
  background: linear-gradient(to left, rgba(10, 15, 30, 0.9), transparent);
  z-index: 2;
  pointer-events: none;
}
```

Detect scroll position with a scroll event listener:

```typescript
const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
  const el = e.currentTarget;
  const canScrollLeft = el.scrollLeft > 4;
  const canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 4;
  // Set classes or state accordingly
};
```

#### Step 4: Responsive element sizing

Elements should be a consistent, comfortable touch target:

```css
.palette-element {
  flex-shrink: 0;          /* never squish elements to fit */
  width: 56px;
  height: 56px;
  min-width: 56px;         /* enforce minimum */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  touch-action: none;
}
```

`flex-shrink: 0` is critical — without it, the browser will squish elements to avoid overflow, resulting in tiny unusable circles.

#### Step 5: Remove dead space in dock background

The dock background should hug the content, not span the full viewport. Or if it does span the full viewport (for visual continuity), the elements should be centered within it:

```css
.palette-dock {
  background: rgba(10, 15, 30, 0.85);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 8px 0;
  /* Full width background is fine — elements center inside */
}
```

---

## 3. FILE MANIFEST

Files you WILL touch:

| File | Action |
|------|--------|
| `src/components/ElementPalette.tsx` (or Palette.tsx) | Add overflow-x: auto, flex-shrink: 0 on elements, centered layout, scroll affordance |
| `src/index.css` or component CSS | Palette dock styling, fade gradients, scrollbar hiding |

Files you MUST NOT touch:

| File | Reason |
|------|--------|
| `src/config/modes.ts` | Element lists are correct — this is a layout issue |
| `src/chemistry/*` | Unrelated |
| `src/telemetry/*` | Unrelated |

---

## 4. VERIFICATION CHECKLIST

- [ ] **Seed (2 elements):** H and O centered in dock, no awkward dead space
- [ ] **Sprout (4 elements):** H, C, N, O fit comfortably, likely no scroll needed
- [ ] **Sapling (7+ elements):** All elements accessible via horizontal scroll
- [ ] **Sapling scroll:** N (leftmost) fully visible when scrolled left
- [ ] **Sapling scroll:** S, Fe, Mn (rightmost) fully visible when scrolled right
- [ ] **Scroll affordance:** Fade gradient appears on edge(s) with hidden content
- [ ] **Touch targets:** All elements ≥ 48px (56px recommended)
- [ ] **Drag still works:** Can drag element from scrollable palette to canvas
- [ ] **Scroll doesn't interfere with drag:** Horizontal scroll and vertical drag (to canvas) don't conflict
- [ ] **iOS momentum scrolling:** Smooth scroll on iPhone/iPad
- [ ] **Android Chrome:** Smooth scroll on Android
- [ ] **Desktop:** Mouse scroll or click-drag works on palette overflow
- [ ] **Vitest:** All existing tests pass
- [ ] **Build clean:** `npm run build` — zero errors

---

*WCD-24 — Opus — March 2, 2026*
*"If the player can't reach the element, the element doesn't exist."*
