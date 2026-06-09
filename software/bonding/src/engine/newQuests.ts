// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// New Quest Chains
//
// Two new quest chains using the new elements. Same structure
// as existing quests in quests.ts.
// ═══════════════════════════════════════════════════════

// Note: This file assumes a Quest interface exists in a shared types file.
// For example:
/*
export interface QuestStep {
  target: string;
  hint: string;
  narrative: string;
}

export interface Quest {
  id: string;
  name: string;
  emoji: string;
  description: string;
  mode: 'seed' | 'sprout' | 'sapling';
  steps: QuestStep[];
  reward: number;
}
*/

const forgeQuest = {
  id: 'the_forge',
  name: 'The Forge',
  emoji: '⚒️',
  description: 'Iron and fire.',
  mode: 'sapling',
  steps: [
    {
      target: 'FeS',       // Fool's Gold
      hint: 'Iron meets sulfur.',
      narrative: 'Pyrite. Fools thought it was treasure.',
    },
    {
      target: 'Fe2O3',     // Rust
      hint: 'Iron meets oxygen.',
      narrative: 'Rust. Iron remembers the air.',
    },
    {
      target: 'O2S',       // SO₂
      hint: 'Sulfur meets oxygen.',
      narrative: 'The breath of volcanoes.',
    },
    {
      target: 'FeO',       // Iron oxide (simple)
      hint: 'One iron, one oxygen.',
      narrative: 'Wüstite. The simplest iron oxide.',
    },
  ],
  reward: 100,  // LOVE
};

const labQuest = {
  id: 'the_lab',
  name: 'The Lab',
  emoji: '🧪',
  description: 'Chemistry class.',
  mode: 'sapling',
  steps: [
    {
      target: 'ClH',       // HCl
      hint: 'Hydrogen meets chlorine.',
      narrative: 'Hydrochloric acid. Handle with care.',
    },
    {
      target: 'ClNa',      // NaCl
      hint: 'Sodium meets chlorine.',
      narrative: 'Table salt. The first seasoning.',
    },
    {
      target: 'H2S',       // Hydrogen Sulfide
      hint: 'Hydrogen meets sulfur.',
      narrative: 'Rotten eggs. You\'ll know it when you smell it.',
    },
    {
      target: 'H3N',       // Ammonia (already exists)
      hint: 'Hydrogen meets nitrogen.',
      narrative: 'Ammonia. Cleaning power.',
    },
    {
      target: 'HNO3',      // Nitric Acid
      hint: 'Hydrogen, nitrogen, and oxygen.',
      narrative: 'Nitric acid. Respect the chemistry.',
    },
  ],
  reward: 125,  // LOVE
};

export const NEW_QUESTS = [forgeQuest, labQuest];

export const NEW_CHECKPOINTS = [
  {
    formula: 'FeO',
    displayName: 'Wüstite',
    displayFormula: 'FeO',
    elements: { Fe: 1, O: 1 },
  },
];
