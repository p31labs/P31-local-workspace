# WCD-29: CHROME REDUCTION — LESS BAR, MORE CANVAS

**Status:** 🟡 HIGH — UI chrome consuming too much screen real estate
**Date:** March 3, 2026
**Author:** Opus (Architect)
**Executor:** Sonnet (Mechanic)
**Priority:** After WCD-27/28. Polish pass for March 10.
**QA Source:** Will Johnson — "flashy lettering would do in 90 percent of the cases vice an entire glassy bar"

---

## 1. DEFECT DESCRIPTION

The game has too many glassmorphism bars competing for screen space. On mobile, the current layout stacks:

```
[TOP BAR — glassmorphism, ~48px]     🌱 🔊  BONDING  💛 368  🔥2d
[FORMULA BAR — glassmorphism, ~40px]  H₂O ████████ 100%
[CANVAS — the actual game]
[MOLECULE COUNTER — floating, ~36px]  🧪 2 molecules
[PALETTE DOCK — glassmorphism, ~72px] [ H ] [ O ]
[COMMAND BAR — glassmorphism, ~48px]  💚🤔😂🔺  0% STABLE  🌱🌿🌳
```

That's four glassmorphism bars plus a floating badge eating ~244px of vertical space. On a 700px viewport (mobile minus browser chrome), that's **35% of the screen** before you see a single atom.

**The operator's directive:** Flashy text. Not bars. 90% of this can be bare text floating over the canvas with a subtle text-shadow for legibility. The glassmorphism is beautiful but it's stealing space from the game.

---

## 2. DESIGN PRINCIPLE: TRANSPARENT HUD

Games solve this with transparent HUDs — text and icons rendered directly over the game canvas with just enough shadow/outline for legibility. No background boxes. No borders. No blur effects. Just information floating in space.

### Think: flight simulator HUD, not desktop app toolbar.

```
Before (current):
┌─────────────────────────────────┐
│ ░░ 🌱 BONDING  💛 368 🔥2d ░░  │  ← glassmorphism bar
├─────────────────────────────────┤
│ ░░ H₂O ████████░░ 75% ░░░░░░  │  ← glassmorphism bar
├─────────────────────────────────┤
│                                 │
│          [atoms]                │
│                                 │
├─────────────────────────────────┤
│ ░░ [ H ] [ O ] ░░░░░░░░░░░░░  │  ← glassmorphism bar
├─────────────────────────────────┤
│ ░░ 💚🤔😂🔺  75% STABLE ░░░░  │  ← glassmorphism bar
└─────────────────────────────────┘

After (transparent HUD):

  🌱 BONDING           💛 368 🔥
       H₂O ━━━━━━━━━░░ 75%

          [atoms]

         🧪 2 molecules

      [ H ] [ O ]
  💚🤔😂🔺    75% STABLE   🌱🌿
```

Same information. No boxes. The canvas shows through everywhere.

---

## 3. IMPLEMENTATION

### Step 1: Remove background from top bar

```css
.top-bar {
  /* REMOVE */
  background: rgba(10, 15, 30, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  
  /* REPLACE WITH */
  background: transparent;
  backdrop-filter: none;
  border: none;
}

.top-bar-text {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.5);
  font-weight: 600;
}
```

### Step 2: Remove background from formula/stability bar

```css
.formula-bar {
  /* Same treatment */
  background: transparent;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.progress-track {
  /* Keep the progress bar itself visible */
  background: rgba(255, 255, 255, 0.15);
  height: 4px;
  border-radius: 2px;
}

.progress-fill {
  background: linear-gradient(90deg, #4ade80, #22c55e);
  height: 4px;
  border-radius: 2px;
}
```

### Step 3: Remove background from command bar

```css
.command-bar {
  background: transparent;
  backdrop-filter: none;
  border: none;
}

/* Mode icons and PING emoji get text-shadow for legibility */
.command-bar button {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}
```

### Step 4: Keep glassmorphism ONLY where it earns it

Some UI elements benefit from a background because they need visual separation from the canvas:

| Element | Keep Glass? | Reason |
|---------|-------------|--------|
| **Palette dock** | ✅ YES (subtle) | Elements need a clear visual zone to drag FROM. But reduce opacity. |
| **Completion modal** | ✅ YES | Modal overlay — needs to command attention |
| **Tutorial popup** | ✅ YES (Clippy bubble) | Needs to be readable as a distinct popup |
| **Top bar** | ❌ NO | Transparent text with shadow |
| **Formula bar** | ❌ NO | Transparent text with shadow |
| **Command bar** | ❌ NO | Transparent text/icons with shadow |
| **Molecule counter** | ❌ NO | Small floating text |
| **Toast notifications** | ✅ YES (brief) | Need to pop visually, but they auto-dismiss |

### Step 5: Reduce palette dock opacity

The palette keeps its background but goes subtler:

```css
.palette-dock {
  background: rgba(10, 15, 30, 0.5);  /* was 0.75-0.85 */
  backdrop-filter: blur(8px);          /* was 12px */
  border-top: 1px solid rgba(255, 255, 255, 0.05);  /* was 0.08 */
}
```

### Step 6: Layout shift — command bar doesn't push palette

When the command bar appears (on first atom placement), it should overlay the bottom of the canvas, NOT push the palette down. Both the palette and command bar are fixed-position — the command bar sits just ABOVE the palette:

```css
.palette-dock {
  position: fixed;
  bottom: 0;
  /* plus safe-area-inset-bottom from WCD-18 */
}

.command-bar {
  position: fixed;
  bottom: calc(72px + env(safe-area-inset-bottom, 0px));
  /* 72px = palette height */
  /* Sits directly above palette, doesn't push it */
}
```

No layout shift. The palette is always at the bottom. The command bar fades in above it when atoms are on the canvas.

---

## 4. WHAT THE HUD LOOKS LIKE PER STATE

### IDLE (no atoms)

```
🌱                    💛 368 🔥

     Drag an element up to begin




                          [Jitterbug]
      🧪 2 molecules

     [ H ]  [ O ]
```

Minimal. Mode icon, LOVE, fire streak at top. Invitation text centered. Palette at bottom. Everything else hidden.

### BUILDING (atoms on canvas)

```
🌱                    💛 383 🔥
      H₂O ━━━━━━░░░ 75%

     [molecule building]




                          [Jitterbug]
      🧪 3 molecules

     [ H ]  [ O ]
💚🤔😂🔺    75% STABLE   🌱🌿
```

Formula + progress appear (transparent text). Command bar fades in (transparent). PING emoji visible only in multiplayer.

### COMPLETE (100%)

```
🌱                    💛 422 🔥
      H₂O₂ ━━━━━━━━━ 100%

    ┌──────────────────────┐
    │   H₂O₂               │
    │   Hydrogen Peroxide   │  ← THIS keeps glassmorphism (modal)
    │   Complete!           │
    │                       │
    │ [Build Another] [Keep]│
    └──────────────────────┘

                          [Jitterbug]
```

Only the completion modal has a background. Everything else is transparent.

---

## 5. FILE MANIFEST

Files you WILL touch:

| File | Action |
|------|--------|
| `src/components/TopBar.tsx` | Remove glassmorphism, add text-shadow |
| `src/components/StabilityMeter.tsx` / `FormulaBar` | Remove glassmorphism, add text-shadow |
| `src/components/CommandBar.tsx` (or bottom toolbar) | Remove glassmorphism, fix position above palette |
| `src/components/ElementPalette.tsx` | Reduce opacity, keep subtle glass |
| `src/components/CockpitLayout.tsx` | Ensure command bar doesn't shift palette position |
| `src/index.css` | Text-shadow utility class, reduced glass variables |

Files you MUST NOT touch:

| File | Reason |
|------|--------|
| `src/components/CompletionModal.tsx` | Keeps glassmorphism — it's a modal |
| `src/components/Tutorial.tsx` | Keeps glassmorphism — it's a Clippy bubble |
| `src/chemistry/*` | Unrelated |
| `src/telemetry/*` | Unrelated |

---

## 6. VERIFICATION CHECKLIST

- [ ] **Top bar:** Text readable over starfield with no background box
- [ ] **Formula bar:** Text + thin progress bar visible with no background box
- [ ] **Command bar:** Icons/text visible with no background box
- [ ] **Palette dock:** Subtle glass remains, reduced opacity
- [ ] **Completion modal:** Full glassmorphism (unchanged)
- [ ] **Tutorial popup:** Glassmorphism Clippy bubble (unchanged)
- [ ] **Text legibility:** All HUD text readable over both dark starfield AND bright atoms
- [ ] **text-shadow:** Applied to all transparent HUD text for contrast
- [ ] **Layout shift:** Placing first atom does NOT shift palette position
- [ ] **Command bar position:** Sits above palette, doesn't push it down
- [ ] **Mobile:** HUD text large enough to read (≥14px)
- [ ] **Desktop:** HUD doesn't look sparse on wide screens
- [ ] **Dark mode only:** (game is always dark — no light mode concerns)
- [ ] **Vitest:** All existing tests pass
- [ ] **Build clean:** `npm run build` — zero errors

---

## 7. SCOPE BOUNDARY

This WCD is about REMOVING backgrounds, not redesigning the HUD. Same layout. Same information. Same positions. Just: transparent backgrounds, text-shadow for legibility, and the palette stays put when the command bar appears.

Do NOT:
- Redesign the HUD layout (that was WCD-20/25)
- Add new HUD elements
- Change the information displayed
- Modify the Jitterbug Navigator
- Touch the 3D rendering

Remove the glass. Add the shadow. Ship it.

---

*WCD-29 — Opus — March 3, 2026*
*"A HUD should feel like it's painted on the inside of your visor, not bolted to the outside of it."*
