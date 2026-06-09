// src/config/questMessages.ts
// Congrats + bridge lines shown when a quest step is completed.
// Aligned to actual quest step arrays in engine/quests.ts.
// Content: Gemini (Narrator) | QA+realign: Opus (Architect) | Integration: Sonnet

export interface QuestMessage {
  congratsLine: string;
  bridgeLine: string;
}

// Keyed by questId, indexed by stepIndex (must match quest.steps[] length)
export const QUEST_MESSAGES: Record<string, QuestMessage[]> = {
  // Genesis: 4 steps — H2, O2, H2O, H2O2
  genesis: [
    {
      congratsLine: 'Perfect! Two hydrogens holding hands.',
      bridgeLine: 'Ready to build the invisible gas we breathe?',
    },
    {
      congratsLine: 'Amazing job! That\'s the oxygen keeping us going.',
      bridgeLine: 'Now, what happens if we mix hydrogen and oxygen together?',
    },
    {
      congratsLine: 'You did it! You just made a splash with water!',
      bridgeLine: 'Think we can squeeze one more oxygen in there? Let\'s try!',
    },
    {
      congratsLine: 'Wow! You built hydrogen peroxide!',
      bridgeLine: 'You are an incredible molecule maker! I\'m so proud of you!',
    },
  ],

  // Kitchen: 5 steps — H2O, CO2, CH4, NH3, C2H6
  kitchen: [
    {
      congratsLine: 'Perfect! Every recipe starts with water.',
      bridgeLine: 'Now let\'s build the invisible gas that gives soda its fizz.',
    },
    {
      congratsLine: 'Spot on! You just built what we breathe out.',
      bridgeLine: 'Next up, let\'s make the fuel that powers the stove.',
    },
    {
      congratsLine: 'Great work! You\'ve got methane, the cooking gas!',
      bridgeLine: 'Time to clean up. Let\'s build a molecule used in soap!',
    },
    {
      congratsLine: 'Awesome! That\'s ammonia, tough on dirt and grime.',
      bridgeLine: 'One more molecule and the Kitchen Quest is yours!',
    },
    {
      congratsLine: 'Incredible! You built ethane \u2014 organic chemistry unlocked!',
      bridgeLine: 'You absolutely crushed the Kitchen Quest! Master Chef of Chemistry!',
    },
  ],

  // Posner: 5 steps — OCa, O3P2, O5P2, O8P2Ca3, O24P6Ca9
  posner: [
    {
      congratsLine: 'Brilliant! You forged calcium oxide \u2014 the protector.',
      bridgeLine: 'Now let\'s bring phosphorus into the mix.',
    },
    {
      congratsLine: 'Nice! Phosphorus trioxide \u2014 the signal carrier takes shape.',
      bridgeLine: 'More oxygen, more power. Keep building.',
    },
    {
      congratsLine: 'Phosphorus pentoxide! The cage is getting stronger.',
      bridgeLine: 'Now bring calcium and phosphorus together.',
    },
    {
      congratsLine: 'Calcium phosphate \u2014 the stuff your bones are made of!',
      bridgeLine: 'One more. The big one. Build the Posner molecule.',
    },
    {
      congratsLine: 'You built the Posner molecule. A calcium cage protecting phosphorus at its core.',
      bridgeLine: 'The calcium holds, and the core is finally safe.',
    },
  ],
};

// Helper — safe lookup
export function getQuestMessage(questId: string, stepIndex: number): QuestMessage | null {
  return QUEST_MESSAGES[questId]?.[stepIndex] ?? null;
}
