// src/config/questMessages.ts
// Congrats + bridge lines shown when a quest step is completed.
// Content: Gemini (Narrator) | QA: Opus (Architect) | March 3, 2026

export interface QuestMessage {
  congratsLine: string;
  bridgeLine: string;
}

// Keyed by questId, indexed by stepIndex
export const QUEST_MESSAGES: Record<string, QuestMessage[]> = {
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

  kitchen: [
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
      bridgeLine: 'Ready for the boss level? Let\'s build something sweet!',
    },
    {
      congratsLine: 'Incredible! You mastered the sugar molecule, the biggest one yet!',
      bridgeLine: 'You absolutely crushed the Kitchen Quest! Master Chef of Chemistry!',
    },
  ],

  posner: [
    {
      congratsLine: 'Nice work! Sodium and chlorine make the perfect table salt.',
      bridgeLine: 'Let\'s trade sodium for calcium and make something rock solid.',
    },
    {
      congratsLine: 'Brilliant! You forged calcium oxide.',
      bridgeLine: 'Time to make the tough acid hiding in our stomachs!',
    },
    {
      congratsLine: 'Nailed it! Hydrochloric acid is built and ready.',
      bridgeLine: 'Now, let\'s build the ultimate calcium cage. It\'s a special one.',
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
