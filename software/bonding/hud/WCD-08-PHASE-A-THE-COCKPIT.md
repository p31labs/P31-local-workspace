# WCD-08 Phase A: THE COCKPIT — Spatial Doctrine & HUD Grid

## Classification: WORK CONTROL DOCUMENT
## Author: Opus (Principal Systems Architect)
## Executor: Sonnet (CC / Mechanic)
## Date: 2026-03-01
## Depends On: CWP-03 Rev B (deployed), WCD-07 (JitterbugNavigator), WCD-41 (stress test passed)
## Status: READY FOR EXECUTION

---

## PROBLEM STATEMENT

The BONDING game engine is structurally sound (484 tests, Genesis Block live, telemetry
verified). But the visual surface has three critical UX failures:

1. **DOM/WebGL collision** — Element palette buttons, the LoveCounter, and PingBar
   overlap the R3F canvas on tablet viewports. Touch targets compete. A child tapping
   an atom may accidentally tap a UI button underneath it.

2. **No spatial hierarchy** — Every element floats in the same visual plane. The eye
   has no anchor. For an AuDHD user (or a 6-year-old), this is sensory overload.

3. **Material inconsistency** — UI panels use mixed backgrounds (#111128, #0c0c18,
   inline rgba). No unified material language. The app looks like a prototype, not
   a cockpit.

## SOLUTION: THE COCKPIT

Establish a strict **Spatial Doctrine** — a formal z-index contract that prevents
WebGL and DOM from ever occupying the same visual space. Wrap all HUD elements in a
glassmorphism material system. Lock them to a perimeter grid around the R3F viewport.

The metaphor is literal: the player sits inside a spacecraft. The molecule floats in
the viewport (the window). Instruments line the edges (the HUD). Nothing overlaps.

---

## SECTION 1: THE Z-INDEX CONTRACT

This is a binding layout specification. No component may violate these layer assignments.

```
Layer  z-index   Owner                  pointer-events
─────  ────────  ─────────────────────  ──────────────
  0       0      <body> background       none
  1       1      R3F <Canvas>            auto (Three.js raycaster)
  2      10      HUD Container (grid)    none (passthrough)
  3      11      HUD Panels (interactive) auto (per-panel)
  4      50      Achievement Toast        none (auto-dismiss)
  5      60      Modal / Overlay          auto (when open)
  6      90      Error boundary           auto
```

### Rules

1. **Layer 1 (R3F) and Layer 3 (HUD Panels) never geometrically overlap.**
   The R3F canvas is inset from the viewport edges. HUD panels occupy ONLY
   the perimeter. There is a 0px gap — no overlap, no margin. They tile.

2. **The HUD Container (Layer 2) is `pointer-events: none`.** It covers the
   full viewport but passes all clicks through to the canvas below. Only
   individual HUD panels set `pointer-events: auto`.

3. **No `position: fixed` on any HUD element.** All HUD panels are
   `position: absolute` inside the HUD Container, which itself is
   `position: absolute; inset: 0` inside the app root. This prevents
   mobile keyboard and address bar resize issues.

4. **Achievement Toasts live at z-50** and are `pointer-events: none`.
   They appear, animate, and dismiss. The user never needs to tap them.

---

## SECTION 2: THE VIEWPORT GRID

Target device: Android tablet, portrait orientation (the kids' primary mode).
Secondary: landscape tablet, desktop. The grid must flex across all three.

```
PORTRAIT TABLET (768 × 1024 example)
┌─────────────────────────────────────────────────┐
│                  TOP BAR (h: 56px)              │  z-11
│  [☰ Nav]        BONDING        [💛 142.5 🔥3d] │
├─────────────────────────────────────────────────┤
│                                                 │
│                                                 │
│              R3F VIEWPORT                       │  z-1
│              (flex: 1, fills remaining height)  │
│              Atoms, bonds, ghosts, bloom        │
│                                                 │
│                                                 │
├─────────────────────────────────────────────────┤
│              ELEMENT DOCK (h: 72px)             │  z-11
│  [H] [C] [N] [O] [Na] [P] [S] [Cl] [Ca]  →   │
├─────────────────────────────────────────────────┤
│              COMMAND BAR (h: 56px)              │  z-11
│  [💚][🤔][😂][🔺]    ████ 87%    [🌱|🌿|🌳]  │
│   Ping reactions    Stability     Difficulty    │
└─────────────────────────────────────────────────┘

Total HUD height: 56 + 72 + 56 = 184px
Canvas gets: 100vh - 184px (env(safe-area-inset-*) adjusted)
```

```
LANDSCAPE TABLET / DESKTOP (1024 × 768 example)
┌───────┬──────────────────────────────────┬──────┐
│       │         TOP BAR (h: 48px)        │      │
│       │  BONDING          [💛 142.5 🔥3] │      │
│       ├──────────────────────────────────┤      │
│  NAV  │                                  │ INFO │
│  72px │       R3F VIEWPORT               │ 72px │
│       │       (fills center)             │      │
│  [☰]  │                                  │ 87%  │
│  [🌱] │                                  │ stab │
│       ├──────────────────────────────────┤      │
│       │     ELEMENT DOCK (h: 64px)       │      │
│       │  [H] [C] [N] [O] ... [Ca]       │      │
│       ├──────────────────────────────────┤      │
│       │     PING BAR (h: 48px)           │      │
│       │  [💚] [🤔] [😂] [🔺]            │      │
└───────┴──────────────────────────────────┴──────┘
```

### Breakpoints

```
PORTRAIT:   max-width: 839px   (single column, stacked)
LANDSCAPE:  min-width: 840px   (three column, nav + center + info)
```

Use Tailwind's `md:` prefix for the breakpoint (840px ≈ md).

---

## SECTION 3: THE GLASSMORPHISM MATERIAL SYSTEM

### Design Tokens (Tailwind config extension)

```javascript
// tailwind.config.js extend
module.exports = {
  theme: {
    extend: {
      colors: {
        void: '#050505',
        'hud-bg': 'rgba(0, 0, 0, 0.40)',
        'hud-border': 'rgba(255, 255, 255, 0.08)',
        'hud-border-active': 'rgba(255, 255, 255, 0.15)',
        phosphor: '#39FF14',
        amber: '#FFD700',
        'amber-dim': 'rgba(255, 215, 0, 0.15)',
        cyan: '#06B6D4',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        hud: '12px',
      },
    },
  },
};
```

### Font Loading

Add to `index.html` `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

### The Glass Panel Component

Every HUD panel uses this base. Create `src/components/hud/GlassPanel.tsx`:

```tsx
import { type ReactNode, type CSSProperties } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  interactive?: boolean;
}

export function GlassPanel({
  children,
  className = '',
  style,
  interactive = true,
}: GlassPanelProps) {
  return (
    <div
      className={`
        bg-black/40
        backdrop-blur-[12px]
        border border-white/[0.08]
        rounded-2xl
        ${interactive ? 'pointer-events-auto' : 'pointer-events-none'}
        ${className}
      `}
      style={style}
    >
      {children}
    </div>
  );
}
```

### Typography Rules

| Context              | Font            | Weight | Size  | Color         | Tracking    |
|---------------------|-----------------|--------|-------|---------------|-------------|
| LOVE counter value  | JetBrains Mono  | 700    | 18px  | #FFD700       | normal      |
| Telemetry labels    | JetBrains Mono  | 500    | 11px  | white/40      | 0.1em       |
| Element symbols     | JetBrains Mono  | 700    | 16px  | element color | normal      |
| UI labels           | Inter           | 500    | 13px  | white/60      | 0.02em      |
| Toast title         | Inter           | 600    | 15px  | white/90      | normal      |
| Toast description   | Inter           | 400    | 12px  | white/50      | normal      |

---

## SECTION 4: COMPONENT SPECIFICATIONS

### 4.1 App Root — `CockpitLayout.tsx` (NEW)

This is the top-level layout wrapper. It replaces whatever `<div>` currently wraps
the game. ALL existing game logic stays inside the R3F canvas. This component only
manages the spatial grid.

```tsx
// src/components/hud/CockpitLayout.tsx

import { type ReactNode } from 'react';

interface CockpitLayoutProps {
  /** The R3F <Canvas> component */
  viewport: ReactNode;
  /** Top bar content */
  topBar: ReactNode;
  /** Element palette */
  elementDock: ReactNode;
  /** Ping + stability + difficulty */
  commandBar: ReactNode;
  /** Achievement toasts (portaled) */
  toastLayer?: ReactNode;
}

export function CockpitLayout({
  viewport,
  topBar,
  elementDock,
  commandBar,
  toastLayer,
}: CockpitLayoutProps) {
  return (
    <div
      className="relative w-screen h-[100dvh] bg-void overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* Layer 1: R3F Canvas — fills the entire background */}
      <div className="absolute inset-0 z-[1]">
        {viewport}
      </div>

      {/* Layer 2: HUD Container — pointer-events passthrough */}
      <div className="absolute inset-0 z-[10] pointer-events-none flex flex-col">

        {/* TOP BAR */}
        <div className="shrink-0 h-14 px-3 pt-[env(safe-area-inset-top)]">
          {topBar}
        </div>

        {/* VIEWPORT SPACER — the gap where the canvas shows through */}
        <div className="flex-1" />

        {/* ELEMENT DOCK */}
        <div className="shrink-0 h-[72px] px-2">
          {elementDock}
        </div>

        {/* COMMAND BAR */}
        <div className="shrink-0 h-14 px-2 pb-[env(safe-area-inset-bottom)]">
          {commandBar}
        </div>
      </div>

      {/* Layer 4: Toast layer */}
      {toastLayer && (
        <div className="absolute inset-0 z-[50] pointer-events-none flex items-end justify-center pb-[200px]">
          {toastLayer}
        </div>
      )}
    </div>
  );
}
```

**Key design choice:** The R3F canvas is `absolute inset-0` — it fills the ENTIRE
screen, rendering behind the HUD. The HUD panels sit on top with their glass
backgrounds. The canvas content (atoms, bonds) should be visually centered in the
gap between TopBar and ElementDock. This is controlled by the R3F camera, not by
CSS. The camera's vertical framing should account for the 184px of HUD at top/bottom.

### 4.2 TopBar — `TopBar.tsx` (NEW)

Wraps JitterbugNavigator (left), title (center), LoveCounter (right).

```tsx
// src/components/hud/TopBar.tsx

import { GlassPanel } from './GlassPanel';
import { LoveCounter } from '../genesis/LoveCounter'; // or wherever it lives
// import { JitterbugNav } from './JitterbugNav'; // WCD-07 component

export function TopBar() {
  return (
    <GlassPanel className="h-full flex items-center justify-between px-4 gap-3">
      {/* Left: Navigation trigger */}
      <button
        className="pointer-events-auto w-10 h-10 flex items-center justify-center
                   rounded-xl border border-white/[0.08] hover:border-white/[0.15]
                   transition-colors"
        aria-label="Navigation"
      >
        {/* JitterbugNavigator mini (collapsed tetrahedron icon) */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2L18 17H2Z" stroke="currentColor" strokeWidth="1.5"
                strokeLinejoin="round" className="text-phosphor opacity-60" />
        </svg>
      </button>

      {/* Center: Title */}
      <span className="font-mono text-sm font-medium text-white/40 tracking-[0.1em] uppercase">
        Bonding
      </span>

      {/* Right: LOVE Counter — mounted from genesis/economyStore */}
      <LoveCounter />
    </GlassPanel>
  );
}
```

**LoveCounter changes:** The existing `LoveCounter` from CWP-03 Rev B uses inline
styles with `position: absolute; top: 12; right: 12`. Remove those positioning
styles. The counter is now a flex child inside TopBar. Keep only the content
(emoji + value + streak). Let the parent handle layout.

**Revised LoveCounter (strip positioning):**

```tsx
// Update in src/genesis/ or src/components/hud/

import { useEconomyStore } from '../genesis/economyStore';

export function LoveCounter() {
  const totalLove = useEconomyStore(s => s.totalLove);
  const currentStreak = useEconomyStore(s => s.currentStreak);
  const hasHydrated = useEconomyStore(s => s._hasHydrated);

  if (!hasHydrated) return null;

  return (
    <div className="pointer-events-auto flex items-center gap-2
                    font-mono text-lg font-bold text-amber">
      <span className="text-xl">💛</span>
      <span>{totalLove.toFixed(1)}</span>
      {currentStreak > 1 && (
        <span className="text-xs opacity-50">🔥{currentStreak}d</span>
      )}
    </div>
  );
}
```

### 4.3 ElementDock — `ElementDock.tsx` (REFACTOR)

The existing element palette is a row of `<button>` elements with inline styles.
Wrap it in GlassPanel. Convert to Tailwind. Add horizontal scroll for overflow.

```tsx
// src/components/hud/ElementDock.tsx

import { GlassPanel } from './GlassPanel';
// Import your existing element data + game store hooks

interface ElementDockProps {
  elements: Array<{ symbol: string; color: string; maxBonds: number }>;
  selected: string | null;
  onSelect: (symbol: string) => void;
  difficulty: 'seed' | 'sprout' | 'sapling' | 'posner';
}

export function ElementDock({ elements, selected, onSelect, difficulty }: ElementDockProps) {
  return (
    <GlassPanel className="h-full flex items-center gap-2 px-3 overflow-x-auto
                           scrollbar-none">
      {/* Difficulty badge */}
      <span className="shrink-0 text-xs font-mono text-white/30 uppercase tracking-widest mr-1">
        {difficulty === 'seed' ? '🌱' : difficulty === 'sprout' ? '🌿' : '🌳'}
      </span>

      {/* Element buttons — horizontal scroll on overflow */}
      {elements.map(el => (
        <button
          key={el.symbol}
          onClick={() => onSelect(el.symbol)}
          className={`
            shrink-0 w-12 h-12 rounded-xl
            flex flex-col items-center justify-center
            font-mono text-base font-bold
            border transition-all duration-150
            active:scale-95
            ${selected === el.symbol
              ? 'border-white/20 bg-white/10 shadow-[0_0_12px_rgba(255,255,255,0.05)]'
              : 'border-white/[0.06] bg-white/[0.03] hover:border-white/10'
            }
          `}
          style={{ color: el.color }}
          aria-label={`${el.symbol}, ${el.maxBonds} bonds`}
        >
          <span>{el.symbol}</span>
          <span className="text-[9px] font-normal opacity-40">{el.maxBonds}b</span>
        </button>
      ))}
    </GlassPanel>
  );
}
```

**Touch hardening:** Each element button is 48×48 (w-12 h-12). Meets WCAG 2.5.8.
`active:scale-95` gives tactile feedback. `scrollbar-none` hides scrollbar on
mobile (add `.-webkit-scrollbar { display: none }` in global CSS if Tailwind
plugin isn't installed).

### 4.4 CommandBar — `CommandBar.tsx` (NEW)

Bottom bar: Ping reactions (left), Stability gauge (center), Difficulty selector (right).

```tsx
// src/components/hud/CommandBar.tsx

import { GlassPanel } from './GlassPanel';

interface CommandBarProps {
  stability: number;
  onPing: (reaction: '💚' | '🤔' | '😂' | '🔺') => void;
  difficulty: 'seed' | 'sprout' | 'sapling' | 'posner';
  onDifficultyChange: (d: 'seed' | 'sprout' | 'sapling') => void;
  canPing: boolean;
}

const REACTIONS = ['💚', '🤔', '😂', '🔺'] as const;

export function CommandBar({
  stability,
  onPing,
  difficulty,
  onDifficultyChange,
  canPing,
}: CommandBarProps) {
  return (
    <GlassPanel className="h-full flex items-center justify-between px-3 gap-3">

      {/* Left: Ping reactions */}
      <div className="flex gap-1.5">
        {REACTIONS.map(r => (
          <button
            key={r}
            onClick={() => onPing(r)}
            disabled={!canPing}
            className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06]
                       flex items-center justify-center text-lg
                       hover:bg-white/[0.08] active:scale-90
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition-all duration-100"
            aria-label={`Send ${r} reaction`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Center: Stability gauge */}
      <div className="flex-1 max-w-[180px] flex flex-col items-center gap-1">
        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${stability}%`,
              background: stability === 100
                ? '#39FF14'
                : stability > 60
                  ? '#FFD700'
                  : '#EF4444',
            }}
          />
        </div>
        <span className="font-mono text-[10px] text-white/30 tracking-wider">
          {stability}% STABLE
        </span>
      </div>

      {/* Right: Difficulty selector */}
      <div className="flex gap-1">
        {(['seed', 'sprout', 'sapling'] as const).map(d => (
          <button
            key={d}
            onClick={() => onDifficultyChange(d)}
            className={`
              w-9 h-9 rounded-lg flex items-center justify-center text-sm
              border transition-all duration-150
              ${difficulty === d
                ? 'border-amber/30 bg-amber-dim'
                : 'border-white/[0.06] bg-transparent hover:border-white/10'
              }
            `}
            aria-label={`${d} difficulty`}
          >
            {d === 'seed' ? '🌱' : d === 'sprout' ? '🌿' : '🌳'}
          </button>
        ))}
      </div>
    </GlassPanel>
  );
}
```

### 4.5 AchievementToast — `AchievementToast.tsx` (REFACTOR)

Move to glassmorphism. Position controlled by CockpitLayout's toast layer (z-50).

```tsx
// src/components/hud/AchievementToast.tsx

interface AchievementToastProps {
  title: string;
  description?: string;
  visible: boolean;
}

export function AchievementToast({ title, description, visible }: AchievementToastProps) {
  if (!visible) return null;

  return (
    <div
      className="bg-black/60 backdrop-blur-[16px] border border-phosphor/20
                 rounded-2xl px-6 py-4 max-w-[320px] w-full
                 animate-toast-slide"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">🏆</span>
        <div>
          <div className="font-sans text-[15px] font-semibold text-white/90">
            {title}
          </div>
          {description && (
            <div className="font-sans text-xs text-white/50 mt-1">
              {description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

Add to Tailwind config:

```javascript
// tailwind.config.js extend.keyframes + extend.animation
keyframes: {
  'toast-slide': {
    '0%':   { transform: 'translateY(100%) scale(0.95)', opacity: '0' },
    '10%':  { transform: 'translateY(0) scale(1)', opacity: '1' },
    '85%':  { transform: 'translateY(0) scale(1)', opacity: '1' },
    '100%': { transform: 'translateY(100%) scale(0.95)', opacity: '0' },
  },
},
animation: {
  'toast-slide': 'toast-slide 3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
},
```

---

## SECTION 5: R3F CAMERA ADJUSTMENT

The canvas fills the entire viewport (inset-0), but the visual content must be
framed within the gap between TopBar and ElementDock. This means the Three.js
camera needs to account for the HUD.

**Do NOT resize the canvas.** A full-viewport canvas gives the glassmorphism
panels their transparent overlay effect. Instead, adjust the camera frustum.

```tsx
// In the R3F <Canvas> setup, adjust camera position:
// The HUD occupies 56px top + 128px bottom = 184px of a ~1024px viewport
// That's roughly 18% of the screen. Shift the camera target slightly upward
// so the molecule appears centered in the VISIBLE gap, not the full canvas.

<Canvas
  camera={{
    position: [0, 0.3, 5],  // Slight upward offset
    fov: 50,
  }}
  // Do NOT set style={{ height: 'calc(100vh - 184px)' }}
  // The canvas must be full-viewport for the glass overlay effect
>
```

The exact offset depends on the game's current camera rig. Sonnet should
adjust the `position` Y value until the molecule is visually centered in
the gap between TopBar bottom edge and ElementDock top edge.

---

## SECTION 6: GLOBAL CSS

Add to the global stylesheet (or Tailwind's `@layer base`):

```css
@layer base {
  /* Deep void background */
  html, body, #root {
    background: #050505;
    color: #E0E0F0;
    -webkit-font-smoothing: antialiased;
    overscroll-behavior: none;
    overflow: hidden;
  }

  /* Kill scroll on the whole page — the game is a fixed viewport */
  body {
    position: fixed;
    inset: 0;
    touch-action: none;
  }

  /* Hide scrollbars in element dock */
  .scrollbar-none::-webkit-scrollbar { display: none; }
  .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
}
```

---

## SECTION 7: WIRING GUIDE

### What Changes

| Current Component        | Action                                      |
|-------------------------|---------------------------------------------|
| App.tsx / Game root div  | Replace with `<CockpitLayout>`              |
| Element palette buttons  | Move content into `<ElementDock>`           |
| LoveCounter (CWP-03)    | Strip absolute positioning, mount inside TopBar |
| PingBar / reactions      | Move into `<CommandBar>` left section       |
| Stability bar            | Move into `<CommandBar>` center section     |
| Difficulty selector      | Move into `<CommandBar>` right section      |
| Achievement toast        | Move into CockpitLayout toast layer         |
| JitterbugNavigator       | Collapse to icon-button in TopBar left slot |
| R3F `<Canvas>`           | Pass as `viewport` prop to CockpitLayout    |

### What Does NOT Change

| Untouched                   | Reason                                 |
|----------------------------|----------------------------------------|
| gameStore.ts               | No refactor (WCD-07 post-birthday)     |
| genesis/ (all 4 files)     | CWP-03 Rev B is deployed and tested    |
| Chemistry engine            | moleculeData, VSEPR logic untouched    |
| Multiplayer relay           | Worker endpoints untouched             |
| Sound system                | Web Audio untouched                    |
| endDrag() monolith          | DO NOT REFACTOR (WCD-07)              |
| eventBus emit sites         | Already wired, do not re-wire         |
| 484 existing tests          | Must still pass green                  |

---

## SECTION 8: FILE MANIFEST

### New Files

```
src/components/hud/
├── GlassPanel.tsx         — Base glass material component
├── CockpitLayout.tsx      — Top-level spatial grid
├── TopBar.tsx             — Nav + title + LoveCounter
├── ElementDock.tsx         — Element palette (refactored)
├── CommandBar.tsx          — Ping + stability + difficulty
└── AchievementToast.tsx   — Refactored toast (glassmorphism)
```

### Modified Files

```
src/App.tsx (or game root)  — Use CockpitLayout as wrapper
src/genesis/LoveCounter.tsx — Strip absolute positioning, keep content
tailwind.config.js          — Add color tokens, fonts, keyframes
index.html                  — Add Google Fonts link
src/index.css (or global)   — Add @layer base rules
```

### Total New Code Estimate

~350 lines across 6 new components + ~40 lines of config changes.

---

## SECTION 9: VERIFICATION CHECKLIST

### Visual
- [ ] Background is #050505 deep void (no gray, no blue tint)
- [ ] All HUD panels show glassmorphism (blur visible when atoms pass behind them)
- [ ] NO UI element overlaps the R3F viewport center area
- [ ] Element buttons are 48×48 minimum (measure with DevTools)
- [ ] Fonts load: JetBrains Mono on LOVE counter, Inter on labels

### Interaction
- [ ] Tapping an atom in the R3F viewport does NOT accidentally trigger a HUD button
- [ ] Element dock scrolls horizontally when more elements than screen width
- [ ] Ping buttons fire correctly (check eventBus PING_SENT in console)
- [ ] Difficulty change fires DIFFICULTY_CHANGED event
- [ ] Achievement toast appears centered above the dock, auto-dismisses

### Layout
- [ ] Portrait tablet: single column, stacked layout, no horizontal overflow
- [ ] Landscape tablet: three-column layout activates at ≥840px
- [ ] Safe area insets respected (no content under rounded corners/notches)
- [ ] `100dvh` used (not `100vh`) — accounts for mobile browser chrome

### Integrity
- [ ] `tsc --noEmit` passes
- [ ] `npm run build` succeeds
- [ ] All 484 tests pass green
- [ ] LoveCounter still ticks when atoms are placed
- [ ] Telemetry still flushes every 30 seconds (check Network tab)
- [ ] Genesis Block logic completely untouched

---

## SECTION 10: WHAT WCD-08 PHASE A IS *NOT*

Phase A is ONLY the spatial doctrine and HUD grid. It does NOT include:

- **Phase B (Glass Core Atoms)** — meshPhysicalMaterial, transmission, inner glow.
  That's a separate R3F shader WCD. Do not touch atom materials in Phase A.

- **Phase C (Tensegrity Bonds)** — Light-pulse bond animations. Separate WCD.

- **Wallet page** — LOVE spending UI. Separate WCD.

- **Jitterbug full animation** — TopBar just shows the collapsed tetrahedron icon.
  The full VE→tetrahedron animation opens as a modal/overlay on tap. Separate WCD.

Phase A establishes the spatial container. Phases B and C fill it with beauty.
Ship Phase A first. Verify the grid holds. Then proceed.

---

*The cockpit is where the pilot sits.*
*The instruments are where the pilot looks.*
*The viewport is where the universe lives.*
*Nothing crosses the glass.*

*— WCD-08 Phase A: THE COCKPIT*
*— P31 Labs 🔺*
