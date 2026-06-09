# WCD-23: PRE-SHIP QA & POLISH — FINAL PASS

**Status:** 🟡 HIGH — the difference between "it works" and "it's ready"
**Date:** March 2, 2026
**Author:** Opus (Architect)
**Executor:** Sonnet (Mechanic)
**Priority:** Final WCD before March 10 ship. After all others.
**Estimated Effort:** 1 day (Mar 8-9 per build timeline)

---

## 1. PURPOSE

This is the sweep. Every visual inconsistency, every edge case, every "I'll fix it later" from wcds 09-22 gets addressed here. No new features. No new architecture. Just polish until it shines.

---

## 2. KNOWN ISSUES TO FIX

### 2a. Formula Display — "NaClo" Case Bug

**Observed (Image 2, pre-WCD-15 screenshots):** Formula bar shows `NaClo` with a lowercase 'o'. Should be `NaClO` — capital O for oxygen.

**Cause:** The `displayFormula()` or `formatSubscripts()` function may be lowercasing trailing element symbols, or the molecule dictionary entry has a typo.

**Fix:** Audit the DISPLAY_OVERRIDES map and the molecule dictionary. Every element symbol must be exactly as written: first letter uppercase, second letter (if any) lowercase. O is `O`, not `o`. Cl is `Cl`, not `CL` or `cl`.

```typescript
// Correct display entries
'ClNa':  'NaCl',    // not 'NaClo' or 'Nacl'
'ClNaO': 'NaClO',   // sodium hypochlorite — capital O
```

### 2b. Tutorial Step Counts

**Observed:** Seed mode shows "1 of 9" tutorial steps. Sprout shows "1 of 4". The tutorial step count should match the mode complexity:

| Mode | Recommended Tutorial Length | Content |
|------|---------------------------|---------|
| Seed 🌱 | 4 steps | Drag H, tap O, build H₂O, earn LOVE |
| Sprout 🌿 | 4 steps | Same as Seed (player already knows basics from Seed) |
| Sapling 🌳 | 4 steps | Same (advanced players don't need hand-holding) |

If the "9 steps" are legacy tutorial steps from before difficulty modes existed, trim them. Nine tutorial popups before Willow can play is nine too many. Four is the max. Ideally three: "Drag an element up", "Connect atoms to build molecules", "Complete molecules to earn LOVE."

**Fix:** Reduce tutorial to 3-4 steps max per mode. Remove any steps that reference features not yet visible (like multiplayer, quest chains) from the initial tutorial.

### 2c. calciumTracker Timezone Test

**Known:** 1 pre-existing test failure in calciumTracker related to timezone handling. This has been present since at least WCD-11.

**Fix:** Either:
- Fix the timezone logic (if it's a real bug)
- Pin the test to UTC with `vi.useFakeTimers()` (if it's a test environment issue)
- Skip with `it.skip()` + TODO comment (if it's non-blocking and unrelated to BONDING)

The goal is 486/486, not 485/486. A clean test suite on ship day.

### 2d. Toast Sizing on Mobile

**Observed:** Achievement toasts and tutorial popups may overflow on narrow screens. Verify all toast content wraps properly within `min(90vw, 400px)` width constraint.

**Fix:** Audit toast components. Ensure:
- `max-width: min(90vw, 400px)`
- `word-wrap: break-word`
- No fixed widths that exceed mobile viewport
- Font size ≥ 14px (readable on small screens)

### 2e. LOVE Counter Decimal

**Observed:** LOVE counter shows `247.0`, `332.0`, etc. with a trailing `.0`. This is unnecessary visual noise.

**Fix:** Format LOVE as integer when it's a whole number:

```typescript
const displayLove = loveBalance % 1 === 0
  ? loveBalance.toFixed(0)   // "247"
  : loveBalance.toFixed(1);  // "247.5" (if fractional LOVE exists)
```

### 2f. "1 molecule" Counter

**Observed (Images 1, 2, 9):** A floating "🧪 1 molecule" badge appears above the palette. This seems to be a session molecule counter. Verify:
- Does it increment correctly?
- Does it reset on mode switch (per WCD-16)?
- Is it visually consistent with the rest of the HUD?
- Is it useful, or is it visual clutter for a 6-year-old?

If it's clutter, consider hiding it in Seed mode (Willow doesn't need a counter) and showing it only in Sprout/Sapling.

### 2g. Jitterbug Navigator — Still Clipping?

**Observed (Images from latest batch):** WCD-17 was implemented but the Navigator still clips slightly on the right in some screenshots. Verify the responsive positioning is actually deployed and working on the test device.

---

## 3. VISUAL CONSISTENCY AUDIT

Walk through each screen on a mobile device and check:

### Mode Select Screen
- [ ] All three cards (Seed, Sprout, Sapling) fully visible and centered
- [ ] Card text readable (description, element list)
- [ ] "Play Together" button styled consistently
- [ ] "No molecules yet. Pick a mode and start building!" centered
- [ ] BONDING title centered (not flush-left as in Safari bug)

### Game Screen (Idle)
- [ ] "Drag an element up to begin" centered and readable
- [ ] Palette elements evenly spaced with consistent sizing
- [ ] Top bar: mode icon + BONDING + LOVE counter — all visible
- [ ] Star field background renders without gaps

### Game Screen (Building)
- [ ] Formula bar shows correct formula with subscripts
- [ ] Stability percentage updates smoothly (not jumpy)
- [ ] Atom colors are distinguishable:
  - H = white/light gray
  - C = dark/black
  - N = blue
  - O = red
  - Na = yellow/gold
  - P = purple
  - Cl = green
  - Ca = gray/silver
  - S = yellow
  - Fe = orange/brown
- [ ] Bond lines are visible against dark background
- [ ] Bloom/glow effects don't wash out atom labels

### Game Screen (Molecule Complete)
- [ ] 100% stability shows green
- [ ] Achievement toast appears with molecule name
- [ ] LOVE counter increments visibly
- [ ] Molecule "glows" or has completion visual feedback

### Multiplayer Lobby
- [ ] Name input works on mobile keyboard
- [ ] "Start Room" button responsive
- [ ] "OR JOIN" divider centered
- [ ] Room code input accepts uppercase
- [ ] Glassmorphism backdrop renders

### Bug Report Overlay
- [ ] Opens on 🐛 tap
- [ ] Textarea auto-focuses, mobile keyboard appears
- [ ] Submit works (POST succeeds)
- [ ] Confirmation shows and auto-dismisses
- [ ] Close (✕) works

---

## 4. PERFORMANCE CHECK

- [ ] 60fps on mobile during gameplay (check with Chrome DevTools → Performance)
- [ ] No jank during atom drag on touch
- [ ] No memory leak during long sessions (check heap in DevTools)
- [ ] Build size ≤ 1.5 MB (currently 1.36 MB — monitor)
- [ ] First contentful paint < 3 seconds on mobile 4G
- [ ] No console errors in production build

---

## 5. DEVICE MATRIX

Test on as many of these as available:

| Device | Browser | Priority |
|--------|---------|----------|
| **Android tablet (target device)** | Chrome | 🔴 CRITICAL |
| **iPhone** | Safari (bottom nav) | 🔴 CRITICAL |
| **iPhone** | Firefox | 🟡 HIGH |
| **Android phone** | Chrome | 🟡 HIGH |
| **Desktop** | Chrome | 🟢 VERIFY |
| **Desktop** | Firefox | 🟢 VERIFY |
| **iPad** | Safari | 🟢 NICE TO HAVE |

**Tyler stress test (Mar 6-7):** Multiplayer specifically. Two+ devices in the same room, building simultaneously, sending pings. The WCD-13 verification checklist applies.

---

## 6. FILE MANIFEST

This WCD touches many files with small fixes. No new files created.

| Fix | File(s) |
|-----|---------|
| NaClo case bug | `src/chemistry/displayFormula.ts`, molecule dictionary |
| Tutorial trim | Tutorial step data (wherever tutorial content is defined) |
| calciumTracker test | `src/__tests__/calciumTracker.test.ts` or equivalent |
| Toast sizing | Toast component CSS |
| LOVE decimal | LOVE display component (TopBar or LoveCounter) |
| Molecule counter | Component rendering "🧪 1 molecule" |

---

## 7. VERIFICATION: FINAL SHIP CHECKLIST

This is the go/no-go list for March 10.

### Must Pass (SHIP BLOCKERS)
- [ ] `tsc --noEmit` — zero errors
- [ ] `vitest run` — ALL tests pass (486/486, including fixed calciumTracker)
- [ ] `vite build` — clean, ≤ 1.5 MB
- [ ] Android Chrome (tablet): full play-through, Seed → Sprout → Sapling
- [ ] Safari iOS: full play-through with bottom nav bar
- [ ] Multiplayer: two devices in same room, state syncs, pings delivered
- [ ] Bug report: submit from mobile, verify in KV
- [ ] Genesis Block: CHAIN INTACT after full session

### Should Pass (QUALITY)
- [ ] Quest chain: Genesis complete in Seed mode
- [ ] Sound: atoms make tones, molecule complete plays chord, mute works
- [ ] All formulas display with correct subscripts and conventional notation
- [ ] LOVE counter shows whole numbers without `.0`
- [ ] Tutorial: ≤ 4 steps, dismissable, doesn't block gameplay
- [ ] Toast notifications fit on mobile screens

### Nice to Have (POLISH)
- [ ] Jitterbug Navigator fully visible on all devices
- [ ] Molecule counter hidden in Seed mode
- [ ] Star field parallax on device orientation change
- [ ] Atom placement animation smooth at 60fps

---

## 8. THE CHECKLIST ON MARCH 9 (EVENING)

The night before ship. Will runs through this personally:

1. Clear all browser data on Android tablet
2. Open bonding.p31ca.org fresh
3. Select Seed 🌱
4. Complete Genesis quest (H₂ → O₂ → H₂O → H₂O₂)
5. Switch to Sprout 🌿
6. Verify canvas is clean
7. Build CO₂
8. Open multiplayer, create room
9. Join from second device
10. Send a PING
11. Verify Genesis Ledger shows all events
12. Submit a bug report from the 🐛 button
13. Verify bug report appears in KV (`curl .../bug-reports`)

If all 13 steps work, ship it.

---

*WCD-23 — Opus — March 2, 2026*
*"Polish is not vanity. Polish is respect — for the player, for the work, for the moment the game loads on a 10-year-old's tablet on his birthday."*
