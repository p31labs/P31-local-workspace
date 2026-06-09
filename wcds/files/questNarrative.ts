// src/config/questNarrative.ts
// Narrative arc paragraphs shown in the expanded QuestBlock panel.
// Content: Gemini (Narrator) | QA: Opus (Architect) | March 3, 2026

export interface QuestNarrative {
  intro: string;           // shown at top of expanded quest panel
  stepNarratives: string[]; // one per step, shown as player progresses
  completionLine: string;  // the "you did it" moment after chain complete
}

export const QUEST_NARRATIVES: Record<string, QuestNarrative> = {
  genesis: {
    intro: 'In the beginning, there was hydrogen. Then oxygen. Then water. Then everything.',
    stepNarratives: [
      'The simplest bond in the universe. Two atoms reaching for each other across the void.',
      'Now the air itself. Every breath you take is proof that oxygen wants to be paired.',
      'Hydrogen meets oxygen and something new is born. Life needs this. You just made it from scratch.',
      'One more oxygen changes everything. Chemistry isn\'t just combining — it\'s discovering what\'s possible.',
    ],
    completionLine: 'From nothing, you built the beginning. The universe started the same way.',
  },

  kitchen: {
    intro: 'Everything you eat, drink, and breathe is chemistry. Your kitchen is a lab.',
    stepNarratives: [
      'You breathe this out with every exhale. Trees breathe it in. Fair trade.',
      'The invisible fuel behind the blue flame. Chemistry is cooking, and cooking is chemistry.',
      'Tough on grime, made from the elements around you. Cleaning is just rearranging atoms.',
      'The big one. Six carbons, twelve hydrogens, six oxygens — brain fuel. You just built what powers you.',
    ],
    completionLine: 'Master Chef of Chemistry. Everything in your kitchen just became a science experiment.',
  },

  posner: {
    intro: 'Deep inside your bones, there\'s a molecule that might be how you think. Build it.',
    stepNarratives: [
      'Your quest begins with a simple spark. Two elements lock together, building tiny perfect crystals. You are already a chemist.',
      'Meet calcium, the great protector. It grabs oxygen to forge a chalky white armor that glows in intense heat. You are learning to build shields.',
      'Deep in your stomach, your body runs a secret laboratory, brewing this sharp powerful acid to melt down the food you eat. You are made of molecules.',
      'Thirty-nine atoms snap into perfect alignment. The strong calcium armor weaves an unbreakable cage around the glowing phosphorus center. The hidden foundation of your bones.',
    ],
    completionLine: 'The calcium holds, and the core is finally safe.',
  },
};

// Helper
export function getQuestNarrative(questId: string): QuestNarrative | null {
  return QUEST_NARRATIVES[questId] ?? null;
}
