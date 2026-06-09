# WCD-25: CLIPPY-STYLE POPUP REPOSITIONING

**Status:** 🟡 HIGH — top of screen is a stack of overlapping UI layers
**Date:** March 2, 2026
**Author:** Opus (Architect)
**Executor:** Sonnet (Mechanic)
**Priority:** After WCD-24. Before March 10 ship.
**QA Source:** Will Johnson, iPhone — Images show 3 layers stacked at top: HUD bar + quest icon row + tutorial popup

---

## 1. DEFECT DESCRIPTION

The top of the screen is overcrowded. On mobile, three UI layers compete for the same vertical space:

1. **Top HUD bar:** △ wifi 🐛 🔬 BONDING 💛 419 🔥2d
2. **Quest/feature icon row:** 🌱 🫁 📋 (mode, breathing, clipboard)
3. **Tutorial popup:** "Drag an element up to build!" with step counter

All three are positioned at or near the top of the viewport. On a phone, this stack consumes ~200px — roughly 30% of the visible game area — before the player sees any atoms or canvas.

**Will's request:** "All popups need to show up to the left of the jitterbug. Like Clippy remember."

---

## 2. DESIGN: THE CLIPPY PATTERN

### The metaphor

Clippy lived in the bottom-right corner. Unobtrusive. Available when you needed it. Didn't block your document.

The Jitterbug Navigator already lives in the bottom-right. The tutorial assistant should live **to the left of the Jitterbug** — bottom-center or bottom-left of the canvas area, above the palette dock but below the molecule.

### Layout zones (revised)

```
┌─────────────────────────────────────┐
│  [HUD BAR — single row, compact]    │  ← ONLY the top HUD, nothing else
├─────────────────────────────────────┤
│                                     │
│          [Canvas / Atoms]           │
│                                     │
│                                     │
│  ┌─────────────┐    ┌────────────┐  │
│  │ Tutorial /   │    │ Jitterbug  │  │  ← Clippy zone: popups LEFT of Jitterbug
│  │ Popup        │    │ Navigator  │  │
│  └─────────────┘    └────────────┘  │
├─────────────────────────────────────┤
│  [Palette dock]                     │
│  [Command bar]                      │
└─────────────────────────────────────┘
```

### What moves

| Element | Current Position | New Position |
|---------|-----------------|--------------|
| Tutorial popups ("Drag an element up to build!") | Top, overlapping HUD | Bottom-left, above palette, left of Jitterbug |
| Quest step hints ("✨ Hydrogen!") | Inside tutorial popup at top | Same — part of the tutorial popup, now at bottom |
| Achievement toasts ("Hydrogen Gas +10 LOVE") | Bottom (already correct) | Keep as-is |
| Quest HUD row (🌱 🫁 📋) | Below top bar | **Merge into top bar or remove** (see §3) |
| Genesis badge ("🔥 Genesis 0/4") | Below top bar | **Merge into top bar** (WCD-15 already collapses it) |

### What stays

| Element | Position | Reason |
|---------|----------|--------|
| Top HUD bar | Top | Always visible — mode + LOVE + essential icons |
| Formula/stability bar | Below HUD when building | Shows what you're building |
| Palette dock | Bottom | Fixed — always accessible |
| Command bar (PING, stability %, modes) | Below palette | Active during gameplay |
| Completion modal (H₂ / Build Another) | Center overlay | Modal — needs attention |

---

## 3. MERGE THE ICON ROWS INTO ONE TOP BAR

Currently there are two rows at the top:
- **Row 1 (HUD):** △ wifi 🐛 🔬 BONDING 💛 419 🔥2d
- **Row 2 (Quest icons):** 🌱 🫁 📋

**Merge them.** One top bar. The quest/feature icons move into the HUD bar alongside the existing icons:

```
┌──────────────────────────────────────────┐
│ 🌱 🫁 📋 🐛 🔬  BONDING    💛 423  🔥2d │
└──────────────────────────────────────────┘
```

Or, if the bar is too crowded with all icons:

```
┌──────────────────────────────────────────┐
│ 🌱       BONDING              💛 423 🔥  │
│ [formula bar when building]              │
└──────────────────────────────────────────┘
```

The key icons (mode indicator, LOVE counter, Genesis fire) are essential. The others (🫁 breathing, 📋 clipboard, 🔬 microscope, △ warning, wifi) can be accessed via a "..." overflow menu or hidden entirely for launch. Every icon that isn't immediately useful to a 6-year-old is a distraction.

**Minimum viable top bar:**

```
🌱  BONDING  💛 423
```

That's it. Mode. Title. LOVE. Everything else is noise for launch day.

---

## 4. TUTORIAL POPUP SPEC (CLIPPY POSITION)

### Position

```css
.tutorial-popup {
  position: fixed;
  bottom: calc(160px + env(safe-area-inset-bottom, 0px));
    /* 160px = palette height + command bar height */
    /* adjust based on actual dock heights */
  left: 16px;
  right: auto;          /* anchor left, not full-width */
  max-width: min(70vw, 320px);
  z-index: 50;          /* toast layer per Cockpit contract */
}
```

### Appearance

Keep the current glassmorphism style. The popup should look like a speech bubble pointing toward the canvas, not toward the top bar.

### Interaction

- **Tap anywhere to advance** (current behavior — keep it)
- **✕ to dismiss** (current behavior — keep it)
- **Step counter:** "1 of 4" (current behavior — keep it)
- **Auto-dismiss:** If the player performs the action the tutorial describes (e.g., drags an element), advance automatically without requiring a tap.

### Content (already trimmed to 4 steps in WCD-23)

| Step | Popup Text | Trigger to Auto-Advance |
|------|-----------|------------------------|
| 1 | 👋 "Drag an element up to build!" ✨ Hydrogen! | Player drags first element to canvas |
| 2 | ⚛️ "Drag H again to connect atoms!" | Player drags second element, bond forms |
| 3 | 💛 "Complete molecules to earn LOVE!" | Player completes first molecule |
| 4 | 🎉 "You're a scientist!" | Auto-dismiss after 3 seconds |

---

## 5. FILE MANIFEST

Files you WILL touch:

| File | Action |
|------|--------|
| `src/components/Tutorial.tsx` (or TutorialPopup) | Reposition to bottom-left (Clippy zone) |
| `src/components/TopBar.tsx` | Merge quest icon row into main bar; simplify to essential icons |
| `src/components/QuestHUD.tsx` | Move Genesis badge into top bar; remove separate row |
| `src/index.css` or component CSS | Update positioning, z-index |

Files you MIGHT touch:

| File | Action |
|------|--------|
| `src/components/CockpitLayout.tsx` | Remove separate quest icon row from layout |

Files you MUST NOT touch:

| File | Reason |
|------|--------|
| `src/components/Jitterbug.tsx` | Navigator is correctly positioned from WCD-17 |
| `src/chemistry/*` | Unrelated |
| `src/telemetry/*` | Unrelated |

---

## 6. VERIFICATION CHECKLIST

- [ ] **Top of screen:** Single HUD bar only. No second row of icons below it.
- [ ] **HUD bar content:** Mode icon + BONDING + LOVE counter + Genesis indicator (minimal)
- [ ] **Tutorial popup position:** Bottom-left, above palette, left of Jitterbug Navigator
- [ ] **Tutorial popup width:** No wider than 70vw / 320px
- [ ] **Tutorial doesn't block palette:** Popup sits above the palette dock, not on top of it
- [ ] **Tutorial doesn't block atoms:** Popup sits below the main canvas build area
- [ ] **Tutorial auto-advances:** Dragging first element advances Step 1 automatically
- [ ] **Tutorial dismissable:** ✕ button works, "Tap anywhere" works
- [ ] **Achievement toasts:** Still appear at bottom (no change)
- [ ] **Completion modal (H₂ screen):** Still appears center (no change)
- [ ] **Safari iOS:** Popup visible above safe area, not behind Safari nav
- [ ] **Mobile portrait:** Popup fits without overflow
- [ ] **Vitest:** All existing tests pass
- [ ] **Build clean:** `npm run build` — zero errors

---

*WCD-25 — Opus — March 2, 2026*
*"Clippy knew where to stand. Bottom corner. Out of the way. Ready when you need it. That's where the tutorial lives."*
