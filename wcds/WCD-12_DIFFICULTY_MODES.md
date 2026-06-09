# WCD-12: DIFFICULTY MODES — SEED / SPROUT / SAPLING

**Status:** 🔴 SHIP CRITICAL — core gameplay differentiation for Willow (6) and Bash (10)
**Date:** March 2, 2026
**Author:** Opus (Architect)
**Executor:** Sonnet (Mechanic)
**Priority:** Immediate — next in build sequence after WCD-09/10/11
**Estimated Effort:** 0.5 day

---

## 1. FEATURE DESCRIPTION

Three difficulty modes that control which elements appear in the palette and which molecules are achievable. One codebase, one game loop. The mode is a filter, not a fork.

| Mode | Icon | Elements | Target Audience | Target Molecules |
|------|------|----------|----------------|-----------------|
| **Seed** 🌱 | Seedling | H, O | Willow (age 6, pre-reader) | H₂, O₂, H₂O, H₂O₂ |
| **Sprout** 🌿 | Herb | H, C, N, O | Bash (age 10) | Everything in Seed + CO₂, CH₄, NH₃, C₆H₁₂O₆, amino acids |
| **Sapling** 🌳 | Tree | Full palette (H, C, N, O, Ca, P, Na, Cl, K, S, Fe, Mn...) | Advanced / adults | Full 40+ molecule catalog including neurotransmitter chains, Posner molecule |

### Design Principle

**The element palette IS the difficulty curve.** A 6-year-old taps 🌱 and sees two big, friendly elements. A 10-year-old taps 🌿 and gets carbon and nitrogen to chase glucose. There is no "kids mode toggle." The constraint teaches through limitation.

---

## 2. FILE MANIFEST

Files you WILL touch:

| File | Action |
|------|--------|
| `src/config/modes.ts` | **CREATE** — mode definitions: element lists, molecule targets, achievement filters |
| `src/stores/gameStore.ts` | **MODIFY** — add `currentMode` state, `setMode` action |
| `src/components/Palette.tsx` | **MODIFY** — filter displayed elements by `currentMode` |
| `src/components/ModeSelect.tsx` | **MODIFY** — wire mode selection to `setMode` (buttons likely exist from WCD-10 work) |
| `src/chemistry/molecules.ts` (or dictionary) | **MODIFY** — add `minMode` field to each molecule entry if not present |
| `src/components/Achievements.tsx` (or equivalent) | **MODIFY** — filter visible achievements by current mode |
| `src/components/TopBar.tsx` | **MODIFY** — display current mode icon in HUD |

Files you MUST NOT touch:

| File | Reason |
|------|--------|
| `src/telemetry/*` | Genesis Block is locked |
| `src/economy/*` | L.O.V.E. economy is mode-agnostic — all modes earn LOVE |
| `worker-telemetry.ts` | Worker doesn't need to know about modes |
| `src/components/BugReport.tsx` | Just created in WCD-11, leave it alone |

---

## 3. DATA STRUCTURE

### modes.ts

```typescript
export type GameMode = 'seed' | 'sprout' | 'sapling';

export interface ModeConfig {
  id: GameMode;
  label: string;
  icon: string;          // emoji
  description: string;   // shown on mode select screen
  elements: string[];    // element symbols available in palette
  color: string;         // accent color for mode UI
}

export const MODES: Record<GameMode, ModeConfig> = {
  seed: {
    id: 'seed',
    label: 'Seed',
    icon: '🌱',
    description: 'Hydrogen & Oxygen',
    elements: ['H', 'O'],
    color: '#4ade80',    // green
  },
  sprout: {
    id: 'sprout',
    label: 'Sprout',
    icon: '🌿',
    description: 'Add Carbon & Nitrogen',
    elements: ['H', 'C', 'N', 'O'],
    color: '#facc15',    // yellow
  },
  sapling: {
    id: 'sapling',
    label: 'Sapling',
    icon: '🌳',
    description: 'Full Periodic Table',
    elements: null,       // null = show all elements in dictionary
    color: '#f97316',    // orange
  },
};
```

### Molecule Dictionary Enhancement

Each molecule in the dictionary needs a `minMode` field indicating the easiest mode where it's achievable. This is derived from its constituent elements:

```typescript
// Utility: determine minimum mode for a molecule based on its elements
export function getMinMode(elements: string[]): GameMode {
  const seedElements = new Set(['H', 'O']);
  const sproutElements = new Set(['H', 'C', 'N', 'O']);

  if (elements.every(el => seedElements.has(el))) return 'seed';
  if (elements.every(el => sproutElements.has(el))) return 'sprout';
  return 'sapling';
}
```

Apply this to each molecule entry. Examples:

| Molecule | Elements | minMode |
|----------|----------|---------|
| H₂ | H | seed |
| H₂O | H, O | seed |
| O₂ | O | seed |
| H₂O₂ | H, O | seed |
| CO₂ | C, O | sprout |
| CH₄ | H, C | sprout |
| NH₃ | H, N | sprout |
| C₆H₁₂O₆ | C, H, O | sprout |
| NaCl | Na, Cl | sapling |
| Ca₉(PO₄)₆ | Ca, P, O | sapling |

---

## 4. WIRING GUIDE

### Step 1: Create modes.ts config

Create `src/config/modes.ts` with the `MODES` constant and `getMinMode` utility as specified above.

### Step 2: Add mode to game store

```typescript
// In gameStore.ts
import { GameMode } from '../config/modes';

interface GameState {
  // ... existing state
  currentMode: GameMode;
  setMode: (mode: GameMode) => void;
}

// Default to 'seed' — safest starting point, always works
currentMode: 'seed',
setMode: (mode) => set({ currentMode: mode }),
```

### Step 3: Filter palette by mode

In `Palette.tsx` (or wherever the element buttons render):

```typescript
const { currentMode } = useGameStore();
const modeConfig = MODES[currentMode];

// Filter elements
const visibleElements = modeConfig.elements === null
  ? allElements                                    // sapling: show everything
  : allElements.filter(el => modeConfig.elements.includes(el.symbol));
```

### Step 4: Filter achievements by mode

Achievements tied to molecules that require elements outside the current mode should be hidden (not grayed out — hidden). A 6-year-old in Seed mode should not see "Build Glucose" taunting them.

```typescript
const visibleAchievements = allAchievements.filter(a => {
  const moleculeMinMode = getMinMode(a.requiredElements);
  const modeOrder = ['seed', 'sprout', 'sapling'];
  return modeOrder.indexOf(moleculeMinMode) <= modeOrder.indexOf(currentMode);
});
```

### Step 5: Wire mode selection screen

The ModeSelect component (which already exists from WCD-10 work where "Play Together" was gated) should present three large, tappable cards:

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│    🌱    │  │    🌿    │  │    🌳    │
│   Seed   │  │  Sprout  │  │ Sapling  │
│  H & O   │  │ + C & N  │  │   All    │
└──────────┘  └──────────┘  └──────────┘
```

Cards should be large (min 100px tall), high contrast, no text-heavy descriptions. Willow needs to be able to pick 🌱 without reading. Each card taps through to the game with that mode set.

### Step 6: Display mode in HUD

Show the current mode icon (🌱/🌿/🌳) in the TopBar. Tapping it returns to mode select.

### Step 7: Telemetry

The mode should be included in telemetry events so the Genesis Block knows which mode was active during gameplay. Add `currentMode` to the context payload of existing telemetry events (atom placed, molecule completed, achievement unlocked). Do NOT create new event types — just enrich existing payloads.

---

## 5. VERIFICATION CHECKLIST

- [ ] **Seed mode:** Only H and O appear in palette
- [ ] **Seed mode:** Can build H₂, H₂O, O₂, H₂O₂
- [ ] **Seed mode:** CO₂, NaCl, and other non-seed molecules are NOT in achievements
- [ ] **Sprout mode:** H, C, N, O appear in palette
- [ ] **Sprout mode:** Can build all seed molecules + CO₂, CH₄, NH₃, glucose
- [ ] **Sprout mode:** NaCl, Posner molecule NOT in achievements
- [ ] **Sapling mode:** All elements appear in palette
- [ ] **Sapling mode:** All molecules available
- [ ] **Mode persists:** Switching to mode, playing, doesn't reset mode
- [ ] **Mode in telemetry:** Atom placement events include `currentMode` field
- [ ] **Mode select screen:** Three large cards, tappable on mobile (48px+ touch targets)
- [ ] **🌱 card is visually default/prominent:** Willow picks first, Seed should feel like home
- [ ] **HUD shows mode icon:** Current mode visible in TopBar
- [ ] **L.O.V.E. works in all modes:** Building H₂O in Seed earns the same LOVE as in Sapling
- [ ] **Vitest:** All existing tests pass + new tests for mode filtering
- [ ] **Build clean:** `npm run build` — zero errors
- [ ] **tsc clean:** `tsc --noEmit` — zero errors

---

## 6. NOTES

- **Do NOT make Seed "easier" mechanically.** The atoms behave the same way in all modes. The constraint is palette size, not physics. Willow learns by having fewer choices, not by having different rules.
- **Mode selection should be the FIRST screen after loading.** Before the canvas, before the tutorial. Three big buttons. Pick one. Go.
- **If mode select already exists** from the current ModeSelect.tsx, verify it's wired to actually filter the palette. It's possible the UI exists but the filtering doesn't.

---

*WCD-12 — Opus — March 2, 2026*
*"Two elements for a six-year-old. Four for a ten-year-old. Forty for everyone else. The palette IS the curriculum."*
