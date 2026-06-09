# WCD-20: ADAPTIVE HUD — CONSISTENT MENU ACROSS BROWSERS

**Status:** 🟡 HIGH — HUD disappears or degrades across browser configurations
**Date:** March 2, 2026
**Author:** Opus (Architect)
**Executor:** Sonnet (Mechanic)
**Priority:** After WCD-18 (Safari safe area) and WCD-19 (atom scale). Polish pass.
**QA Source:** Will Johnson, iPhone — Safari shows floating emoji icons with no bar; Firefox shows full HUD

---

## 1. DEFECT DESCRIPTION

The game HUD renders inconsistently across browsers:

- **Firefox iOS (working):** Full top bar with BONDING title, LOVE counter (💛 247.0), triangle icon, wifi icon, glassmorphism background.
- **Safari iOS (broken):** Three floating emoji icons (🥦🫁📱) at top-left with no background bar, no BONDING title, no LOVE counter. The HUD is effectively gone.

The command bar at the bottom shows similar inconsistency — Firefox renders the full bar (💚🤔😂🔺 + stability % + mode icons), while Safari shows partial or no command bar.

**Root Cause (Probable):** The HUD layout likely depends on available viewport height or uses conditional rendering based on a height threshold. Safari's safe area insets reduce the available height, potentially triggering a "compact mode" that strips the HUD to icons only. Or the HUD bar's absolute/fixed positioning places it behind Safari's chrome.

---

## 2. THE DESIGN PROBLEM

The current HUD has too many elements competing for space on mobile:

**Top bar (current):**
- Warning triangle icon
- WiFi/network icon
- "BONDING" title
- LOVE counter (💛 247.0)

**Below top bar (current):**
- Genesis badge (🔥 Genesis 0/4)
- Formula + progress bar + percentage
- Tutorial step indicator

**Bottom bar (current):**
- PING reactions (💚🤔😂🔺)
- Stability percentage
- Mode icons (🌱🌿🌳)
- Additional icons scrolling off-right

On a phone with browser chrome, that's ~120px of UI at the top and ~120px at the bottom, leaving maybe 60% of the screen for actual gameplay. The HUD needs to be smarter about what it shows and when.

---

## 3. FIX: PROGRESSIVE HUD DISCLOSURE

### Principle: Show what matters NOW. Hide what doesn't.

Instead of showing everything at once, the HUD reveals information contextually:

#### State: IDLE (no atoms on canvas)

```
┌────────────────────────────────────┐
│ 🌿  BONDING           💛 247.0    │  ← mode icon + title + LOVE (minimal)
├────────────────────────────────────┤
│                                    │
│     "Drag an element up to begin"  │
│                                    │
├────────────────────────────────────┤
│    [ H ]  [ C ]  [ N ]  [ O ]     │  ← palette only
└────────────────────────────────────┘
```

No Genesis badge. No stability meter. No PING bar. No tutorial (until first atom placed).

#### State: BUILDING (atoms on canvas, no match yet)

```
┌────────────────────────────────────┐
│ 🌿  CHN₂O            💛 260.0    │
│     ████████░░░░░░░░░ 62%         │  ← formula + progress replaces title
├────────────────────────────────────┤
│          [molecule]                │
│                                    │
├────────────────────────────────────┤
│    [ H ]  [ C ]  [ N ]  [ O ]     │
│  💚🤔😂🔺   62% STABLE   🌿🌳   │  ← command bar appears
└────────────────────────────────────┘
```

Formula bar appears (it has content now). Command bar appears (stability is relevant now). PING bar appears only in multiplayer.

#### State: COMPLETE (molecule matched, 100%)

```
┌────────────────────────────────────┐
│ 🌿  NaCl — Table Salt  💛 280.0  │
│     ████████████████████ 100%  ✓  │
├────────────────────────────────────┤
│          [molecule glows]          │
│                                    │
│   🎉 Achievement: "Rock Solid"    │  ← toast overlay
├────────────────────────────────────┤
│    [ H ]  [ C ]  [ N ]  [ O ]     │
│  💚🤔😂🔺  100% STABLE   🌿🌳   │
└────────────────────────────────────┘
```

### Implementation: Conditional rendering based on game state, NOT viewport size

```typescript
const { atoms, currentFormula, stability, isMultiplayer } = useGameStore();
const isIdle = atoms.length === 0;
const isBuilding = atoms.length > 0;
const isComplete = stability >= 100;

return (
  <div className="hud-container">
    {/* Top bar: always present, content varies */}
    <TopBar>
      <ModeIcon />
      {isIdle && <Title>BONDING</Title>}
      {isBuilding && <FormulaBar formula={currentFormula} stability={stability} />}
      <LoveCounter />
    </TopBar>

    {/* Genesis badge: only when idle or tapped */}
    {isIdle && <GenesisBadge />}

    {/* Canvas: always present */}
    <Canvas />

    {/* Palette: always present */}
    <Palette />

    {/* Command bar: only when building */}
    {isBuilding && (
      <CommandBar>
        {isMultiplayer && <PingBar />}
        <StabilityMeter />
        <ModeSelector />
      </CommandBar>
    )}
  </div>
);
```

### Result: Fewer elements competing for space at any given moment

- **Idle:** 1 bar (top) + palette = ~100px of UI
- **Building:** 1 bar (top, now formula) + palette + command bar = ~160px of UI
- **Complete:** Same as building + toast overlay (temporary)

Compared to current: all bars always visible = ~240px of UI. The progressive approach gives back ~80px to the canvas.

---

## 4. SPECIFIC FIXES FOR SAFARI

Even with progressive disclosure, Safari needs explicit handling:

### Fix the floating emoji icons

The three emoji icons (🥦🫁📱) visible in Safari screenshots are likely:
- 🥦 = Sapling mode indicator
- 🫁 = Breathing room / lungs (feature icon)
- 📱 = Multiplayer / device (feature icon)

These are rendering as standalone icons because the parent bar that contains them has either:
- Zero height (collapsed due to safe area math)
- `display: none` triggered by a viewport height check
- `overflow: hidden` clipping the bar background but not the icons

**Fix:** Ensure the top bar has `min-height: 48px` and its background renders regardless of viewport height. The icons should be INSIDE the bar, not floating above it.

### Fix the bottom bar vanishing

If the bottom command bar uses a viewport height check to decide whether to render:

```typescript
// BAD: fragile viewport check
const showCommandBar = window.innerHeight > 600;

// GOOD: state-based
const showCommandBar = atoms.length > 0;
```

Remove any `innerHeight` conditional rendering. Use game state instead.

---

## 5. FILE MANIFEST

Files you WILL touch:

| File | Action |
|------|--------|
| `src/components/TopBar.tsx` | Conditional content based on game state (idle vs building) |
| `src/components/CommandBar.tsx` | Render only when building; remove viewport height checks |
| `src/components/QuestHUD.tsx` | Show Genesis badge only when idle |
| `src/components/CockpitLayout.tsx` | Ensure min-height on bars, safe area integration |
| `src/components/StabilityMeter.tsx` | Move into CommandBar if not already |

Files you MUST NOT touch:

| File | Reason |
|------|--------|
| `src/chemistry/*` | Unrelated |
| `src/telemetry/*` | Unrelated |
| `src/components/BugReport.tsx` | Stable from WCD-11 |

---

## 6. VERIFICATION CHECKLIST

- [ ] **Safari iOS:** Top bar renders with background, title/formula, LOVE counter — not floating icons
- [ ] **Safari iOS:** Bottom command bar visible when building
- [ ] **Safari iOS:** Palette visible (WCD-18 dependency)
- [ ] **Firefox iOS:** No regression — HUD still renders correctly
- [ ] **Chrome Android:** No regression
- [ ] **Desktop:** No regression
- [ ] **Idle state:** Only top bar + palette visible. No Genesis badge, no command bar, no stability
- [ ] **Building state:** Formula replaces title in top bar. Command bar appears below palette.
- [ ] **Complete state:** Achievement toast appears. Command bar shows 100%.
- [ ] **Multiplayer building:** PING bar appears in command bar
- [ ] **Solo building:** No PING bar
- [ ] **Mode switch:** HUD resets to idle state (clean canvas from WCD-16)
- [ ] **All HUD elements ≥ 48px touch targets**
- [ ] **Vitest:** All existing tests pass
- [ ] **Build clean:** `npm run build` — zero errors

---

## 7. SCOPE BOUNDARY

This WCD is about WHEN elements appear in the HUD, not WHAT the elements look like. Do not:

- Redesign the visual style of any HUD component
- Change the glassmorphism, colors, or fonts
- Add new HUD features
- Modify the Jitterbug Navigator (that's WCD-17)

Show less, at the right time. That's the entire scope.

---

*WCD-20 — Opus — March 2, 2026*
*"A 6-year-old doesn't need to see the stability meter before she's placed her first atom. Show her what matters now."*
