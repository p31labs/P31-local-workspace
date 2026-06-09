# WCD-16: CANVAS STATE LEAK ON MODE SWITCH

**Status:** 🟡 HIGH — will confuse kids on launch day
**Date:** March 2, 2026
**Author:** Opus (Architect)
**Executor:** Sonnet (Mechanic)
**Priority:** Before March 10 ship. After WCD-15.
**QA Source:** Will Johnson, iPhone — Image 1 shows Seed mode (H, O palette) with complex Sapling molecule on canvas

---

## 1. DEFECT DESCRIPTION

When a player switches difficulty modes, the atoms and bonds from the previous session remain on the canvas. Observed: Seed mode (🌱) active with only H and O in the palette, but the canvas shows a complex molecule containing Cl, P, Ca, Na, and O atoms — elements that only exist in Sapling mode.

**The problem for kids:** Willow (age 6) taps 🌱 Seed. She sees a molecule she can't understand, can't modify, and can't clear. She has two elements in her palette and a screen full of atoms she's never seen. The game is immediately confusing instead of welcoming.

**Root Cause:** Mode switch updates the palette filter (`currentMode` in gameStore) but does NOT clear the canvas atoms. The 3D scene persists across mode changes.

---

## 2. FIX

### Strategy: Clear canvas on mode change

When `setMode()` is called in the game store, also clear the canvas state: atoms, bonds, current formula, stability percentage. Reset to the "Drag an element up to begin" empty state.

### Implementation

In `gameStore.ts` (or wherever `setMode` is defined):

```typescript
setMode: (mode: GameMode) => set({
  currentMode: mode,
  // Clear canvas state
  atoms: [],
  bonds: [],
  currentFormula: null,
  stability: 0,
  // Keep these — they persist across modes:
  // loveBalance (earned LOVE doesn't reset)
  // achievementsUnlocked (achievements are permanent)
  // moleculesCompleted (history is permanent)
  // sessionId (same session)
}),
```

### What resets vs. what persists

| State | On Mode Switch |
|-------|---------------|
| `atoms` | **RESET** — clear canvas |
| `bonds` | **RESET** — clear canvas |
| `currentFormula` | **RESET** — no active molecule |
| `stability` | **RESET** — back to 0% |
| `loveBalance` | **KEEP** — LOVE is earned, never lost |
| `achievementsUnlocked` | **KEEP** — achievements are permanent |
| `moleculesCompleted` | **KEEP** — history is permanent |
| `currentMode` | **UPDATE** — new mode |

### Edge case: Mode switch mid-build

If the player has atoms on the canvas and switches modes, those atoms are simply cleared. No confirmation dialog. No "save your work?" prompt.

Rationale: The target users are ages 6 and 10. A confirmation dialog adds a decision. Decisions freeze executive dysfunction. The atoms were free — drag new ones. The LOVE earned from placing them is already banked.

### Edge case: Returning to a previous mode

If Bash plays Sprout, switches to Sapling, then back to Sprout, he gets a fresh canvas each time. No persistence of canvas state across mode switches in either direction. His LOVE balance and achievements carry over, but the canvas is always fresh.

---

## 3. FILE MANIFEST

Files you WILL touch:

| File | Action |
|------|--------|
| `src/stores/gameStore.ts` | Modify `setMode` to clear canvas state fields |

Files you MIGHT touch:

| File | Action |
|------|--------|
| `src/components/MoleculeCanvas.tsx` | Verify canvas re-renders to empty when atoms array clears |
| `src/components/ModeSelect.tsx` | Verify setMode is called when mode card is tapped |

Files you MUST NOT touch:

| File | Reason |
|------|--------|
| `src/economy/*` | LOVE persists across modes by design |
| `src/telemetry/*` | Telemetry doesn't need to change |
| `src/config/modes.ts` | Mode definitions are correct |
| `worker-telemetry.ts` | Worker is unrelated |

---

## 4. TELEMETRY

Emit a `difficulty_changed` event on mode switch (this may already exist — the Genesis Ledger screenshot shows `difficulty_changed` at 17:34:43). Verify the event includes the new mode value. No new event type needed if it already fires.

---

## 5. VERIFICATION CHECKLIST

- [ ] **Sapling → Seed:** Canvas clears completely. Only "Drag an element up to begin" shown.
- [ ] **Sapling → Sprout:** Canvas clears. Palette shows H, C, N, O.
- [ ] **Sprout → Seed:** Canvas clears. Palette shows H, O only.
- [ ] **Seed → Sapling:** Canvas clears. Full palette available.
- [ ] **LOVE preserved:** Switching modes does NOT reset LOVE balance
- [ ] **Achievements preserved:** Switching modes does NOT hide/lose earned achievements
- [ ] **Molecules completed preserved:** History list unchanged after mode switch
- [ ] **Mid-build switch:** Atoms on canvas disappear with no error, no orphan state
- [ ] **Return to mode:** Going back to a previously used mode gives fresh canvas
- [ ] **Genesis Ledger:** `difficulty_changed` event fires on each mode switch
- [ ] **Vitest:** All existing tests pass + new test for mode-switch state clearing
- [ ] **Build clean:** `npm run build` — zero errors

---

*WCD-16 — Opus — March 2, 2026*
*"Seed mode is Willow's space. When she walks in, the room is clean. Her two elements are waiting. Nothing else."*
