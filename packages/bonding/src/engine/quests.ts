// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Quest engine: guided molecule-building sequences
//
// Three quests, one per mode:
//   Genesis (seed) — H₂ → O₂ → H₂O → H₂O₂
//   Kitchen (sprout) — cooking chemistry metaphors
//   Posner (sapling) — build toward the Posner molecule
//   The Forge (sapling) — iron and sulfur compounds
//   The Lab (sapling) — acids, salts, and chlorine
//
// Quest steps advance on checkpoint fire (KNOWN_MOLECULES
// match), not molecule completion. This lets intermediate
// formulas like H₂O count even if the molecule grows to
// H₂O₂ later.
// ═══════════════════════════════════════════════════════

export interface QuestStep {
  target: string;          // Hill system formula
  narrative: string;       // flavor text shown to player
}

export interface QuestReward {
  love: number;
  achievementId: string;
}

export interface Quest {
  id: string;
  name: string;
  icon: string;
  description: string;
  mode: 'seed' | 'sprout' | 'sapling';
  steps: QuestStep[];
  reward: QuestReward;
}

export interface QuestProgress {
  questId: string;
  completedSteps: number;  // index of next step to complete (0-based)
  completed: boolean;
  completedAt: string | null;  // ISO timestamp
}

/**
 * Get quests available for a given mode.
 * Seed: only seed quests.
 * Sprout: seed + sprout quests.
 * Sapling: all quests.
 */
export function getQuestsForMode(mode: 'seed' | 'sprout' | 'sapling'): Quest[] {
  const allQuests = [GENESIS_QUEST, KITCHEN_QUEST, POSNER_QUEST, FORGE_QUEST, LAB_QUEST, NEURO_QUEST];

  if (mode === 'seed') {
    return allQuests.filter(q => q.mode === 'seed');
  } else if (mode === 'sprout') {
    return allQuests.filter(q => q.mode === 'seed' || q.mode === 'sprout');
  } else {
    return allQuests;
  }
}

/**
 * Get current step for a quest.
 * Returns quest.steps[progress.completedSteps] or null if done.
 */
export function getCurrentStep(quest: Quest, progress: QuestProgress): QuestStep | null {
  if (progress.completed) {
    return null;
  }
  return quest.steps[progress.completedSteps] ?? null;
}

/**
 * Check if a formula advances any quest.
 * Called on checkpoint fire (KNOWN_MOLECULES match).
 * Returns updated progress map + list of quest IDs just finished.
 */
export function checkQuestProgress(
  formula: string,
  activeQuests: Quest[],
  progressMap: Record<string, QuestProgress>,
): { updatedProgress: Record<string, QuestProgress>; newlyCompleted: string[] } {
  const updatedProgress = { ...progressMap };
  const newlyCompleted: string[] = [];

  for (const quest of activeQuests) {
    const progress = updatedProgress[quest.id];
    if (!progress) continue;
    if (progress.completed) continue;

    const currentStep = getCurrentStep(quest, progress);
    if (!currentStep) continue;

    if (formula === currentStep.target) {
      const newCompletedSteps = progress.completedSteps + 1;
      const isLastStep = newCompletedSteps === quest.steps.length;

      updatedProgress[quest.id] = {
        ...progress,
        completedSteps: newCompletedSteps,
        completed: isLastStep,
        completedAt: isLastStep ? new Date().toISOString() : progress.completedAt,
      };

      if (isLastStep) {
        newlyCompleted.push(quest.id);
      }
    }
  }

  return { updatedProgress, newlyCompleted };
}

/**
 * Initialize progress for a set of quests.
 * Returns a map with each quest at step 0, not completed.
 */
export function initializeProgress(quests: Quest[]): Record<string, QuestProgress> {
  const progressMap: Record<string, QuestProgress> = {};

  for (const quest of quests) {
    progressMap[quest.id] = {
      questId: quest.id,
      completedSteps: 0,
      completed: false,
      completedAt: null,
    };
  }

  return progressMap;
}

/**
 * Get quest completion percentage (0-100).
 */
export function getQuestPercent(quest: Quest, progress: QuestProgress): number {
  if (quest.steps.length === 0) return 0;
  if (progress.completed) return 100;

  const percent = (progress.completedSteps / quest.steps.length) * 100;
  return Math.round(percent);
}

// ── Quest data ──

export const GENESIS_QUEST: Quest = {
  id: 'genesis',
  name: 'Genesis',
  icon: '\u{1F305}',
  description: 'The first molecules. Hydrogen and oxygen only.',
  mode: 'seed',
  steps: [
    { target: 'H\u2082', narrative: 'In the beginning, there was hydrogen.' },
    { target: 'O\u2082', narrative: 'Then came the air.' },
    { target: 'H\u2082O', narrative: 'And water made everything possible.' },
    { target: 'H\u2082O\u2082', narrative: 'Even water has a wild side.' },
  ],
  reward: { love: 50, achievementId: 'genesis' },
};

export const KITCHEN_QUEST: Quest = {
  id: 'kitchen',
  name: 'The Kitchen',
  icon: '\u{1F468}\u200D\u{1F373}',
  description: 'Organic chemistry through cooking metaphors.',
  mode: 'sprout',
  steps: [
    { target: 'H\u2082O', narrative: 'Every recipe starts with water.' },
    { target: 'CO\u2082', narrative: 'The bubbles in your soda.' },
    { target: 'CH\u2084', narrative: 'Natural gas. Handle with care.' },
    { target: 'H\u2083N', narrative: 'Ammonia. That cleaning smell.' },
    { target: 'C\u2082H\u2086', narrative: 'Ethane. Chemistry gets serious.' },
  ],
  reward: { love: 75, achievementId: 'chef' },
};

export const POSNER_QUEST: Quest = {
  id: 'posner',
  name: 'The Posner Quest',
  icon: '\u{1F9EC}',
  description: 'Build toward the Posner molecule.',
  mode: 'sapling',
  steps: [
    { target: 'OCa', narrative: 'Calcium oxide. The calcium cage begins.' },
    { target: 'O\u2083P\u2082', narrative: 'Phosphorus trioxide. The signal carrier.' },
    { target: 'O\u2085P\u2082', narrative: 'Phosphorus pentoxide. Getting closer.' },
    { target: 'O\u2088P\u2082Ca\u2083', narrative: 'Calcium phosphate. Your bones.' },
    { target: 'O\u2082\u2084P\u2086Ca\u2089', narrative: 'The Posner molecule. You built consciousness.' },
  ],
  reward: { love: 200, achievementId: 'the_architect' },
};

export const FORGE_QUEST: Quest = {
  id: 'the_forge',
  name: 'The Forge',
  icon: '\u2692\uFE0F',
  description: 'Iron and fire.',
  mode: 'sapling',
  steps: [
    { target: 'SFe', narrative: 'Pyrite. Fools thought it was treasure.' },
    { target: 'O\u2083Fe\u2082', narrative: 'Rust. Iron remembers the air.' },
    { target: 'O\u2082S', narrative: 'The breath of volcanoes.' },
    { target: 'OFe', narrative: 'W\u00FCstite. The simplest iron oxide.' },
  ],
  reward: { love: 100, achievementId: 'the_forge' },
};

export const LAB_QUEST: Quest = {
  id: 'the_lab',
  name: 'The Lab',
  icon: '\u{1F9EA}',
  description: 'Chemistry class.',
  mode: 'sapling',
  steps: [
    { target: 'HCl', narrative: 'Hydrochloric acid. Handle with care.' },
    { target: 'NaCl', narrative: 'Table salt. The first seasoning.' },
    { target: 'H\u2082S', narrative: 'Rotten eggs. You\'ll know it when you smell it.' },
    { target: 'H\u2083N', narrative: 'Ammonia. Cleaning power.' },
    { target: 'HNO\u2083', narrative: 'Nitric acid. Respect the chemistry.' },
  ],
  reward: { love: 125, achievementId: 'the_lab' },
};

export const NEURO_QUEST: Quest = {
  id: 'neurotransmitters',
  name: 'Neurotransmitters',
  icon: '\u{1F9E0}',
  description: 'Brain chemistry. Build the molecules that power thought.',
  mode: 'sapling',
  steps: [
    { target: 'C\u2088H\u2081\u2081NO\u2082', narrative: 'Dopamine. The reward molecule.' },
    { target: 'C\u2081\u2080H\u2081\u2082N\u2082O', narrative: 'Serotonin. Mood stabilizer.' },
    { target: 'C\u2084H\u2089NO\u2082', narrative: 'GABA. The calm signal.' },
    { target: 'C\u2083H\u2087NO\u2084', narrative: 'Glutamate. The excite signal.' },
    { target: 'C\u2089H\u2081\u2083NO\u2082', narrative: 'Norepinephrine. Alertness.' },
  ],
  reward: { love: 150, achievementId: 'neurotransmitters' },
};
