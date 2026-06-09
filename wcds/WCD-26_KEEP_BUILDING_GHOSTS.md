# WCD-26: "KEEP BUILDING" — GHOST SITES MUST REAPPEAR

**Status:** 🟡 HIGH — breaks the core build loop after first molecule
**Date:** March 2, 2026
**Author:** Opus (Architect)
**Executor:** Sonnet (Mechanic)
**Priority:** After WCD-24/25. Before March 10 ship.
**QA Source:** Will Johnson, iPhone — Image 7: H₂ at 100% with stray O floating disconnected, no ghost sites visible

---

## 1. DEFECT DESCRIPTION

After completing a molecule (e.g., H₂ at 100%) and tapping "Keep Building," the player can still drag new atoms onto the canvas, but the **VSEPR ghost sites** (translucent attachment points showing where new atoms can bond) do not reappear. New atoms float disconnected on the canvas with no way to bond them to the existing molecule.

**Observed (Image 7):** H₂ at 100% STABLE. Two bonded H atoms visible. One O atom sitting disconnected to the right — no bond, no ghost site, no attachment point. The O was dragged onto the canvas after tapping "Keep Building" but has nowhere to connect.

**Expected:** After "Keep Building," the completed molecule should transition back to an active building state. Ghost sites should appear at all valid VSEPR positions on the existing molecule, allowing the player to extend it. The stability percentage should drop from 100% (because the new configuration is no longer a matched molecule) and the formula should update.

**Impact:** The "Keep Building" option is a lie. It lets you drag atoms but not bond them. The only working option after completion is "Build Another" (which clears the canvas). This breaks the exploratory sandbox flow where a player builds H₂, then adds an O to discover H₂O.

---

## 2. ROOT CAUSE ANALYSIS

When a molecule hits 100% stability and the completion modal appears, the game likely:

1. Sets a `completed` or `locked` flag on the molecule
2. Disables the VSEPR ghost site calculation
3. Shows the completion modal

When the player taps "Keep Building," step 1 should be reversed but probably isn't. The `completed` flag stays true, so the ghost site calculation skips this molecule.

### Where to look:

```
Player taps "Keep Building"
  → gameStore.keepBuilding() (or equivalent action)
    → Should: set completed = false, recalculate ghosts
    → Actually: sets completed = false (maybe), but ghost recalculation doesn't fire
```

The ghost site system likely runs on a dependency (a reactive calculation in Zustand or a useEffect) that triggers when atoms are added/removed but NOT when the `completed` flag changes. The "Keep Building" action changes the flag but doesn't add/remove atoms, so the reactive chain doesn't fire.

---

## 3. FIX

### Strategy: "Keep Building" must fully re-enter the building state

```typescript
// In gameStore.ts — the "Keep Building" action
keepBuilding: () => {
  set({
    // Re-enter building state
    isCompleted: false,          // or whatever the completion flag is named
    gamePhase: 'building',       // if there's a phase enum
    showCompletionModal: false,  // dismiss the modal

    // DO NOT clear atoms/bonds — that's "Build Another"
    // DO NOT reset stability — let it recalculate from current atoms

    // Force ghost site recalculation
    ghostSitesStale: true,       // if using a staleness flag
  });

  // If ghost sites are calculated reactively, trigger the recalculation
  get().recalculateGhostSites();  // explicit call if needed
},
```

### If ghost sites are calculated in a useEffect:

The useEffect probably depends on `atoms.length` or `bonds.length`. Since "Keep Building" doesn't change these, the effect doesn't re-run.

**Fix option A:** Add `isCompleted` to the dependency array:

```typescript
useEffect(() => {
  if (!isCompleted && atoms.length > 0) {
    calculateAndSetGhostSites(atoms, bonds);
  } else {
    clearGhostSites();
  }
}, [atoms, bonds, isCompleted]);  // <-- add isCompleted
```

**Fix option B:** Force recalculation by incrementing a counter:

```typescript
// In gameStore
ghostVersion: 0,

keepBuilding: () => {
  set(state => ({
    isCompleted: false,
    showCompletionModal: false,
    ghostVersion: state.ghostVersion + 1,  // force reactivity
  }));
},

// In the ghost site effect
useEffect(() => {
  calculateAndSetGhostSites(atoms, bonds);
}, [atoms, bonds, ghostVersion]);
```

Option A is cleaner. Use it.

### The stability must also recalculate

After "Keep Building," if the player adds an O to H₂, the formula becomes H₂O (or H₃O or whatever the actual composition is). The stability should update from 100% to the new formula's match percentage. Verify that the stability calculation runs whenever atoms change, not just when `isCompleted` is false.

---

## 4. ALSO VERIFY: "BUILD ANOTHER" STILL WORKS

"Build Another" should:
1. Clear all atoms from canvas
2. Clear all bonds
3. Reset stability to 0%
4. Reset formula to null
5. Dismiss completion modal
6. Return to "Drag an element up to begin" state

This is the WCD-16 `reset()` behavior. Verify it still works after fixing "Keep Building."

---

## 5. FILE MANIFEST

Files you WILL touch:

| File | Action |
|------|--------|
| `src/stores/gameStore.ts` | Fix `keepBuilding` action: clear completion flag, trigger ghost recalculation |
| `src/components/MoleculeCanvas.tsx` (or ghost site logic) | Ensure ghost site effect depends on completion state |
| `src/components/CompletionModal.tsx` (or equivalent) | Verify "Keep Building" calls the correct action |

Files you MUST NOT touch:

| File | Reason |
|------|--------|
| `src/chemistry/vsepr.ts` (or ghost site calculation) | The calculation logic is correct — it's the TRIGGER that's missing |
| `src/chemistry/molecules.ts` | Dictionary is correct |
| `src/telemetry/*` | Unrelated |

---

## 6. VERIFICATION CHECKLIST

- [ ] **Keep Building → ghost sites appear:** After completing H₂ and tapping "Keep Building," VSEPR ghost attachment points are visible on the molecule
- [ ] **Can attach new atom:** Drag O to a ghost site on H₂ → O bonds to H₂ → formula updates to H₂O (or current composition)
- [ ] **Stability recalculates:** After adding O to completed H₂, stability drops from 100% to the new match percentage
- [ ] **Formula updates:** Formula bar shows new composition after adding atoms to completed molecule
- [ ] **Can complete new molecule:** Adding O to H₂ to form H₂O → new 100% completion → new completion modal
- [ ] **Build Another still works:** Tapping "Build Another" clears canvas completely, returns to idle state
- [ ] **Quest progress unaffected:** Completing H₂ still registers as Genesis step 1 regardless of whether player chose "Keep Building" or "Build Another"
- [ ] **Multiple keep-building cycles:** Complete H₂ → Keep Building → add O → complete H₂O → Keep Building → add more → no errors
- [ ] **Vitest:** All existing tests pass + new test for keep-building ghost restoration
- [ ] **Build clean:** `npm run build` — zero errors
- [ ] **tsc clean:** `tsc --noEmit` — zero errors

---

## 7. THE UX STORY

This bug breaks the most magical moment in the game.

A kid builds H₂. First molecule. Celebration. Then the game asks: "Build Another?" or "Keep Building?" The kid thinks: "What if I add oxygen?" They tap "Keep Building." They drag O toward the hydrogen molecule. The ghost site glows. They drop it. Water forms. H₂O. They just discovered water by following their curiosity.

Without ghost sites, the O floats uselessly. The curiosity dies. The kid taps "Build Another" and starts over. The discovery moment never happens.

Fix the ghost sites. Protect the discovery.

---

*WCD-26 — Opus — March 2, 2026*
*"The 'Keep Building' button is a promise: your molecule isn't finished yet. The ghost sites are how you keep that promise."*
