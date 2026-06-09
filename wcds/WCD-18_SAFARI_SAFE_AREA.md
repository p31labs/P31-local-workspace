# WCD-18: SAFARI SAFE AREA — BOTTOM NAV EATING THE GAME

**Status:** 🔴 SHIP BLOCKER — game is unplayable on Safari iOS (default browser)
**Date:** March 2, 2026
**Author:** Opus (Architect)
**Executor:** Sonnet (Mechanic)
**Priority:** IMMEDIATE — Safari is the default browser on every iPhone. If the Facebook testers open the link from Facebook on iOS, it opens in Safari.
**QA Source:** Will Johnson, iPhone, Safari with bottom navigation bar

---

## 1. DEFECT DESCRIPTION

Safari on iOS (15.4+) places the URL/navigation bar at the bottom of the screen by default. The game's element palette, command bar, PING bar, and stability meter are all hidden behind Safari's bottom chrome. The HUD at the top is either missing or reduced to floating emoji icons with no background bar.

**Observed (Image 7):** Only three emoji icons visible at top (🥦🫁📱). No BONDING title, no LOVE counter, no top bar background. Palette barely visible, clipped by Safari nav. "Drag an element up to begin" is visible but the elements to drag are behind the browser.

**Observed (Image 8):** Genesis quest panel shows ("In the beginning, there was... 0/4") but palette completely hidden behind Safari bottom nav.

**Observed (Image 3):** Mode select screen — BONDING title flush-left (should be centered), Seed card clipped on left edge, bottom prompt partially obscured.

**Root Cause:** The `fixed inset-0` layout from WCD-09 correctly fills the viewport, but does NOT account for iOS safe area insets. Safari's bottom nav bar overlaps the bottom of the viewport. The CSS `env(safe-area-inset-bottom)` value is nonzero on these devices but the game doesn't use it.

---

## 2. FIX

### The Core Fix: Safe Area Padding

#### Step 1: Viewport meta tag

In `index.html`, the viewport meta tag must include `viewport-fit=cover`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

This tells Safari "I'll handle the safe areas myself." Without `viewport-fit=cover`, the `env()` values are always zero and the browser just clips your content.

**Check if WCD-09 already added this.** If yes, the issue is that the CSS doesn't USE the env values even though they're available.

#### Step 2: Apply safe area insets to the game container

```css
.game-container {
  /* Existing from WCD-09 */
  position: fixed;
  inset: 0;

  /* NEW: Safe area padding */
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
}
```

The `env(safe-area-inset-bottom)` is ~34px on iPhone with Safari bottom nav, ~44px on iPhone with notch/Dynamic Island. The fallback `0px` means non-Safari browsers are unaffected.

#### Step 3: Apply to the palette dock specifically

The palette is the most critical element being hidden. Even if the container has safe area padding, verify the palette explicitly respects it:

```css
.palette-dock {
  /* Existing */
  flex-shrink: 0;
  height: 80px;

  /* NEW: Push above Safari bottom nav */
  padding-bottom: env(safe-area-inset-bottom, 0px);
  /* OR: margin-bottom: env(safe-area-inset-bottom, 0px); */
}
```

#### Step 4: Apply to the command bar (PING bar, stability meter)

The bottom toolbar row (💚🤔😂🔺, stability %, mode icons) also needs safe area inset:

```css
.command-bar {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

#### Step 5: Apply to the top HUD

If the top HUD is disappearing on Safari, the top safe area inset may be pushing it offscreen:

```css
.top-bar {
  padding-top: env(safe-area-inset-top, 0px);
}
```

Or if the top bar uses `top: 0`, it needs:

```css
.top-bar {
  top: env(safe-area-inset-top, 0px);
}
```

#### Step 6: Apply to mode select screen

The mode select screen (Image 3) needs the same treatment:

```css
.mode-select-container {
  padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px);
}
```

The Seed card clipping on the left edge suggests either missing left padding or the horizontal card layout isn't centered.

---

## 3. FILE MANIFEST

Files you WILL touch:

| File | Action |
|------|--------|
| `index.html` | Verify `viewport-fit=cover` in meta tag |
| `src/index.css` | Add `env(safe-area-inset-*)` to root game container |
| `src/components/CockpitLayout.tsx` | Apply safe area to the outer layout wrapper |
| `src/components/ElementPalette.tsx` | Add bottom safe area padding |
| `src/components/CommandBar.tsx` (or bottom toolbar) | Add bottom safe area padding |
| `src/components/TopBar.tsx` | Add top safe area padding |
| `src/components/ModeSelect.tsx` | Fix centering + add safe area insets |

Files you MUST NOT touch:

| File | Reason |
|------|--------|
| `src/chemistry/*` | Unrelated |
| `src/telemetry/*` | Unrelated |
| `worker-telemetry.ts` | Unrelated |

---

## 4. TESTING STRATEGY

This fix MUST be tested on Safari iOS specifically. The `env()` values are only nonzero on devices with safe area insets (iPhone X and later with notch, and Safari with bottom nav enabled).

**Testing without a device:** You can approximate by using Chrome DevTools responsive mode with an iPhone preset, BUT the safe area insets won't actually be present. Real device testing is required.

**Quick verification:** After deploying, open bonding.p31ca.org in Safari on iPhone. If the palette is fully visible above the Safari nav bar, the fix is working.

---

## 5. VERIFICATION CHECKLIST

- [ ] **Safari iOS (bottom nav):** Palette fully visible above Safari navigation
- [ ] **Safari iOS (bottom nav):** Command bar (PING, stability, mode icons) fully visible
- [ ] **Safari iOS (bottom nav):** Top HUD shows BONDING title + LOVE counter + icons
- [ ] **Safari iOS (bottom nav):** Mode select — all three cards fully visible, centered
- [ ] **Safari iOS (top address bar):** No regression if user has Safari in top-bar mode
- [ ] **Firefox iOS:** No regression
- [ ] **Chrome Android:** No regression (env values are 0, padding is 0)
- [ ] **Desktop Chrome:** No regression
- [ ] **Notch/Dynamic Island:** Content doesn't overlap the notch area
- [ ] **Vitest:** All existing tests pass
- [ ] **Build clean:** `npm run build` — zero errors

---

*WCD-18 — Opus — March 2, 2026*
*"Safari is the default browser on the device your kids will use to open the link you send them. If it doesn't work on Safari, it doesn't work."*
