# WCD-21: QUEST CHAINS — GENESIS / KITCHEN / POSNER

**Status:** 🟡 HIGH — progression system that gives BONDING a narrative arc
**Date:** March 2, 2026
**Author:** Opus (Architect)
**Executor:** Sonnet (Mechanic)
**Priority:** After WCD-18/19/20. Core gameplay feature for March 10.
**Estimated Effort:** 1 day
**Passport Reference:** §4 Track 5 (Quest Chains)

---

## 1. FEATURE DESCRIPTION

Quests give the game direction. Without quests, BONDING is a sandbox — drag elements, make molecules, earn LOVE. With quests, it's a story: "Build water. Now build the air you breathe. Now build the molecule that holds your bones together."

Three quest chains, one per difficulty mode:

| Quest | Mode | Theme | Molecules (in order) |
|-------|------|-------|---------------------|
| **Genesis** 🌅 | Seed 🌱 | "In the beginning..." | H₂ → O₂ → H₂O → H₂O₂ |
| **The Kitchen** 🍳 | Sprout 🌿 | "Everything in your kitchen" | CO₂ → CH₄ → NH₃ → C₆H₁₂O₆ |
| **The Posner Quest** 🦴 | Sapling 🌳 | "Build the molecule that protects you" | NaCl → CaO → HCl → Ca₉(PO₄)₆ |

Each quest is a linear sequence. Build the molecules in order. Each completion unlocks the next target. Completing the final molecule in a chain earns a major LOVE bonus and a unique achievement.

---

## 2. DESIGN PRINCIPLES

**Quests are SUGGESTIONS, not gates.** A player can always free-build any molecule available in their mode. Quests highlight a path, not a wall. If Bash wants to skip CO₂ and go straight for glucose, he can. He just won't get quest completion credit for CO₂.

**One active quest per mode.** When Willow is in Seed, she sees the Genesis quest. When Bash is in Sprout, he sees The Kitchen. No quest selection screen. The mode IS the quest selector.

**Quest progress persists.** If Willow builds H₂ and H₂O, then switches to Sprout and back to Seed, her Genesis progress is still 2/4. Quest progress is stored in the game store alongside achievements.

**Quest UI is minimal.** The Genesis badge already exists ("🔥 Genesis 0/4"). This just needs to be wired to actual quest data and show the current target molecule.

---

## 3. DATA STRUCTURE

### quests.ts

```typescript
import { GameMode } from './modes';

export interface QuestStep {
  formula: string;        // Hill formula (internal key)
  displayName: string;    // human name: "Water"
  hint: string;           // brief encouragement: "Two hydrogens, one oxygen"
}

export interface QuestChain {
  id: string;
  name: string;
  icon: string;
  mode: GameMode;
  description: string;
  steps: QuestStep[];
  completionReward: number;    // bonus LOVE on chain completion
  completionAchievement: string; // achievement ID to unlock
}

export const QUESTS: QuestChain[] = [
  {
    id: 'genesis',
    name: 'Genesis',
    icon: '🌅',
    mode: 'seed',
    description: 'In the beginning, there was hydrogen...',
    steps: [
      { formula: 'H2',   displayName: 'Hydrogen Gas',     hint: 'Two of the same' },
      { formula: 'O2',   displayName: 'Oxygen',           hint: 'The air you breathe' },
      { formula: 'H2O',  displayName: 'Water',            hint: 'Two H, one O — life itself' },
      { formula: 'H2O2', displayName: 'Hydrogen Peroxide', hint: 'One more oxygen...' },
    ],
    completionReward: 50,
    completionAchievement: 'genesis_complete',
  },
  {
    id: 'kitchen',
    name: 'The Kitchen',
    icon: '🍳',
    mode: 'sprout',
    description: 'Everything in your kitchen is chemistry',
    steps: [
      { formula: 'CO2',     displayName: 'Carbon Dioxide',  hint: 'What you breathe out' },
      { formula: 'CH4',     displayName: 'Methane',         hint: 'Gas stove fuel' },
      { formula: 'NH3',     displayName: 'Ammonia',         hint: 'Cleaning supplies' },
      { formula: 'C6H12O6', displayName: 'Glucose',         hint: 'Sugar — the big one!' },
    ],
    completionReward: 100,
    completionAchievement: 'kitchen_complete',
  },
  {
    id: 'posner',
    name: 'The Posner Quest',
    icon: '🦴',
    mode: 'sapling',
    description: 'Build the molecule that holds your bones together',
    steps: [
      { formula: 'ClNa',             displayName: 'Table Salt',      hint: 'Na + Cl = dinner' },
      { formula: 'CaO',              displayName: 'Calcium Oxide',   hint: 'Ca + O = rock solid' },
      { formula: 'ClH',              displayName: 'Hydrochloric Acid', hint: 'H + Cl = stomach acid' },
      { formula: 'Ca9O24P6',         displayName: 'Posner Molecule',  hint: 'The calcium cage. 9 Ca, 6 P, 24 O.' },
    ],
    completionReward: 250,
    completionAchievement: 'posner_complete',
  },
];

// Helper: get quest for a mode
export function getQuestForMode(mode: GameMode): QuestChain | undefined {
  return QUESTS.find(q => q.mode === mode);
}
```

**NOTE:** The `formula` values above use Hill system keys. Verify these match your actual molecule dictionary keys exactly. The Posner molecule formula key may differ — check your 62-molecule dictionary.

---

## 4. GAME STORE ADDITIONS

```typescript
// Add to gameStore.ts

interface QuestProgress {
  [questId: string]: {
    completedSteps: string[];  // formulas completed in order
    chainComplete: boolean;
  };
}

// State
questProgress: {} as QuestProgress,

// Actions
completeQuestStep: (questId: string, formula: string) => {
  const quest = QUESTS.find(q => q.id === questId);
  if (!quest) return;
  
  const progress = get().questProgress[questId] || { completedSteps: [], chainComplete: false };
  
  // Only count if this is the NEXT step in sequence
  const nextIndex = progress.completedSteps.length;
  if (nextIndex >= quest.steps.length) return; // already complete
  if (quest.steps[nextIndex].formula !== formula) return; // wrong order
  
  const newCompleted = [...progress.completedSteps, formula];
  const chainComplete = newCompleted.length === quest.steps.length;
  
  set({
    questProgress: {
      ...get().questProgress,
      [questId]: { completedSteps: newCompleted, chainComplete }
    }
  });
  
  if (chainComplete) {
    // Award bonus LOVE
    get().addLove(quest.completionReward);
    // Unlock achievement
    get().unlockAchievement(quest.completionAchievement);
  }
},
```

### Quest Progress Check on Molecule Completion

When a molecule is completed (100% stability, formula matched), check if it advances any active quest:

```typescript
// In the molecule completion handler (wherever stability hits 100%)
const currentMode = get().currentMode;
const quest = getQuestForMode(currentMode);
if (quest) {
  get().completeQuestStep(quest.id, completedFormula);
}
```

---

## 5. UI: QUEST HUD

The Genesis badge already exists. Repurpose it for all quests:

### Idle state (no atoms):

```
┌─────────────────────────────────────┐
│ 🌅 Genesis                         │
│ In the beginning, there was         │
│ hydrogen...                         │
│ Step 1/4: Hydrogen Gas              │
│ "Two of the same"                   │
│ 0/4 ████░░░░░░░░░░░░               │
└─────────────────────────────────────┘
```

Expanded quest panel showing name, description, current target, hint, and progress bar. This is the `isIdle` state from WCD-20.

### Building state (atoms on canvas):

```
🌅 1/4 ─── H₂O ████████░░ 62%
```

Collapsed to icon + step count + formula + progress. Same compact bar from WCD-15/WCD-20.

### Quest complete:

```
🎉 Genesis Complete! +50 LOVE
```

Toast notification. Major visual celebration. Then advance to showing "Quest complete ✓" in the badge area.

### All quests for mode complete:

```
🌅 ✓  Free build mode
```

Show completion checkmark. Player continues in sandbox mode with no active quest target.

---

## 6. TELEMETRY

New Genesis Block events:

```typescript
eventBus.emit({ type: 'QUEST_STEP_COMPLETED', data: { questId, formula, stepIndex } });
eventBus.emit({ type: 'QUEST_CHAIN_COMPLETED', data: { questId, totalSteps, bonusLove } });
```

These are engagement proof. "Player followed a structured learning path and completed all steps." Valuable for demonstrating educational outcomes.

---

## 7. FILE MANIFEST

Files you WILL create:

| File | Purpose |
|------|---------|
| `src/config/quests.ts` | Quest chain definitions + helper functions |

Files you WILL modify:

| File | Action |
|------|--------|
| `src/stores/gameStore.ts` | Add questProgress state + completeQuestStep action |
| `src/components/QuestHUD.tsx` | Wire to quest data instead of hardcoded Genesis |
| `src/telemetry/eventBus.ts` | Add QUEST_STEP_COMPLETED, QUEST_CHAIN_COMPLETED events |
| Molecule completion handler | Check quest progress on each completion |

Files you MUST NOT touch:

| File | Reason |
|------|--------|
| `src/chemistry/*` | Chemistry engine doesn't know about quests |
| `src/config/modes.ts` | Mode definitions are correct |
| `worker-telemetry.ts` | Worker stores events, doesn't need quest logic |

---

## 8. VERIFICATION CHECKLIST

- [ ] **Genesis (Seed):** Build H₂ → progress shows 1/4. Build O₂ → 2/4. Build H₂O → 3/4. Build H₂O₂ → 4/4 + completion toast + 50 LOVE bonus
- [ ] **Kitchen (Sprout):** Build CO₂ → 1/4. Continue through CH₄, NH₃, C₆H₁₂O₆ → completion + 100 LOVE
- [ ] **Posner (Sapling):** Build NaCl → 1/4. Continue through CaO, HCl, Ca₉(PO₄)₆ → completion + 250 LOVE
- [ ] **Wrong order:** Building H₂O before H₂ in Genesis does NOT advance the quest
- [ ] **Free build still works:** Building any molecule still earns LOVE regardless of quest
- [ ] **Quest progress persists:** Switch modes and back — progress is retained
- [ ] **Mode switch shows correct quest:** Seed → Genesis, Sprout → Kitchen, Sapling → Posner
- [ ] **Quest HUD (idle):** Shows expanded quest info with current target + hint
- [ ] **Quest HUD (building):** Shows collapsed progress bar
- [ ] **Quest complete achievement:** Unique achievement unlocks on chain completion
- [ ] **Telemetry:** QUEST_STEP_COMPLETED and QUEST_CHAIN_COMPLETED events fire
- [ ] **Vitest:** Existing tests pass + new tests for quest progression logic
- [ ] **Build clean:** `npm run build` — zero errors

---

*WCD-21 — Opus — March 2, 2026*
*"In the beginning, there was hydrogen. Then oxygen. Then water. Then everything."*
