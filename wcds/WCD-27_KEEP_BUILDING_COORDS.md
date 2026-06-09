# WCD-27: KEEP BUILDING — COORDINATE FIX

**Status:** 🔴 SHIP BLOCKER — new atoms land disconnected, core loop broken
**Date:** March 3, 2026
**Author:** Opus (Architect)
**Executor:** Sonnet (Mechanic)
**Priority:** IMMEDIATE — the H₂ → H₂O discovery path doesn't work
**QA Source:** Will Johnson, Pixel — Images show H₂O₃ and H₂O₃ with disconnected atom fragments

---

## 1. DEFECT DESCRIPTION

After completing a molecule and tapping "Keep Building," new atoms placed on the canvas land as disconnected fragments. They do NOT bond to the existing molecule. The formula bar treats the entire canvas as one aggregated formula (H₂O₃, H₃O₃) but the atoms are visually and structurally separate — no bond lines connect them to the completed molecule.

**Observed (Image 6):** H₃O₃ at 89%. Canvas shows what appears to be an H₂O cluster plus a separate H-O fragment floating nearby. No bond between the two groups.

**Observed (Image 7):** H₂O₃ at 75%. Main molecule cluster with a solo O atom floating to the lower-right. Disconnected. No ghost site, no bond.

**Root Cause:** WCD-26 implemented a "free-placement extension point" that offsets new atoms +1.5x from the molecule center when all existing atoms are bond-saturated. This creates the atom at a position too far from any existing atom's bond radius, so the auto-bonding logic doesn't fire. The atom lands disconnected.

The fundamental problem: after a molecule is "complete" (all VSEPR sites filled), there are genuinely no open bond sites. The extension point hack creates a new atom in empty space but doesn't CREATE a new bond site on the existing molecule. You can't bond to something that has no open valence.

---

## 2. THE REAL FIX

### Stop treating "Keep Building" as extending a complete molecule

When a molecule is complete (100%, all bonds saturated), "Keep Building" should NOT try to extend that molecule. Instead, it should:

1. **Bank the completed molecule** — mark it as done, add it to the molecule counter, freeze it in place
2. **Start a fresh build on the same canvas** — the player can now drag new atoms that form a NEW molecule alongside the completed one
3. **Allow the canvas to hold multiple independent molecules**

This is actually what the screenshots show happening — the player IS building separate molecules on the same canvas. The problem is that the formula bar aggregates all atoms into one formula (`H₂O₃` = the H₂O plus a solo O), which doesn't match anything in the dictionary.

### Option A: Separate molecule tracking (RECOMMENDED)

```typescript
// After "Keep Building":
keepBuilding: () => {
  const currentAtoms = get().atoms;
  const currentBonds = get().bonds;
  
  // Freeze completed molecule as a "banked" group
  set({
    isCompleted: false,
    showCompletionModal: false,
    bankedMolecules: [
      ...get().bankedMolecules,
      { atoms: currentAtoms.map(a => ({...a, frozen: true})), bonds: [...currentBonds] }
    ],
    // Start fresh active build
    activeAtoms: [],     // new atoms go here
    activeBonds: [],     // new bonds go here
    currentFormula: null,
    stability: 0,
  });
},
```

The formula bar and stability meter only track `activeAtoms` / `activeBonds`. Banked molecules render on canvas but are inert (no ghost sites, no interaction).

**Complexity:** This requires separating "banked" vs "active" atoms throughout the rendering pipeline. Medium effort.

### Option B: Clear and start fresh (SIMPLER)

"Keep Building" behaves identically to "Build Another" except:
- The completed molecule stays VISIBLE on the canvas (rendered but frozen)
- A new empty build begins on top of it
- The formula bar resets to empty
- Ghost sites appear for the new build only

```typescript
keepBuilding: () => {
  // Freeze all current atoms visually
  const frozenAtoms = get().atoms.map(a => ({ ...a, frozen: true, interactive: false }));
  
  set({
    isCompleted: false,
    showCompletionModal: false,
    atoms: frozenAtoms,           // keep on canvas but non-interactive
    activeAtomIds: [],            // new Set() — nothing is "active"
    currentFormula: null,
    stability: 0,
  });
  
  // New atoms added will be "active" and only bond to other active atoms
},
```

### Option C: Just make it "Build Another" with a label change (SIMPLEST)

If separating molecule tracking is too complex for the ship deadline:

```typescript
keepBuilding: () => {
  // Identical to buildAnother — canvas clears
  get().reset();
  set({ showCompletionModal: false });
},
```

Rename the button from "Keep Building" to "Build Next" or "New Molecule." The canvas clears. The player starts fresh. No confusion about disconnected atoms.

**Recommendation:** Option C for March 10 ship, Option A for post-birthday. The current "Keep Building" behavior is actively confusing — it creates disconnected atoms that pollute the formula calculation. Better to clear and start fresh than to create a broken sandbox.

---

## 3. FORMULA AGGREGATION FIX

Regardless of which option above is chosen, the formula bar must NOT aggregate atoms across disconnected groups. If there's an H₂O cluster and a solo O, the formula bar should show the ACTIVE molecule's formula, not "H₂O₂" (which implies a single molecule with that composition).

If Option A (banked molecules): formula only counts `activeAtoms`.
If Option B (frozen atoms): formula only counts non-frozen atoms.
If Option C (clear canvas): not an issue — only one molecule on canvas at a time.

---

## 4. FILE MANIFEST

Files you WILL touch:

| File | Action |
|------|--------|
| `src/stores/gameStore.ts` | Fix `keepBuilding`/`continueBuilding` — use Option A, B, or C |
| `src/components/MoleculeCanvas.tsx` | If Option A/B: render banked/frozen atoms differently (dimmer, no interaction) |
| `src/chemistry/formulaCalculator.ts` (or equivalent) | Only calculate formula from active (non-frozen) atoms |

Files you MUST NOT touch:

| File | Reason |
|------|--------|
| `src/chemistry/molecules.ts` | Dictionary is correct |
| `src/telemetry/*` | Unrelated |

---

## 5. VERIFICATION CHECKLIST

- [ ] **"Keep Building" after H₂:** Canvas clears (Option C) OR molecule freezes and new build starts fresh (Option A/B)
- [ ] **No disconnected atoms:** New atoms either bond to something or start a clean new molecule
- [ ] **Formula bar accurate:** Shows only the active molecule's formula, not aggregated canvas atoms
- [ ] **Stability accurate:** Reflects only the active molecule
- [ ] **Banked molecule visible (Option A/B):** Completed molecule renders dimmer on canvas
- [ ] **New molecule can complete:** After "Keep Building" from H₂, building H₂O triggers new completion
- [ ] **"Build Another" unchanged:** Still clears canvas completely
- [ ] **Molecule counter increments:** "3 molecules" reflects completed molecules, not canvas groups
- [ ] **Vitest:** All existing tests pass
- [ ] **Build clean:** `npm run build` — zero errors

---

*WCD-27 — Opus — March 3, 2026*
*"A disconnected atom isn't 'keep building.' It's 'keep confusing.'"*
