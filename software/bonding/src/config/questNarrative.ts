// src/config/questNarrative.ts
// Narrative arc paragraphs shown in the expanded QuestHUD panel.
// Aligned to actual quest step arrays in engine/quests.ts.
// Content: Gemini (Narrator) | QA+realign: Opus (Architect) | Integration: Sonnet

export interface QuestNarrative {
  intro: string;           // shown at top of expanded quest panel
  stepNarratives: string[]; // one per step, shown as player progresses
  completionLine: string;  // the "you did it" moment after chain complete
}

export const QUEST_NARRATIVES: Record<string, QuestNarrative> = {
  // Genesis: 4 steps
  genesis: {
    intro: 'In the beginning, there was hydrogen. Then oxygen. Then water. Then everything.',
    stepNarratives: [
      'The simplest bond in the universe. Two atoms reaching for each other across the void.',
      'Now the air itself. Every breath you take is proof that oxygen wants to be paired.',
      'Hydrogen meets oxygen and something new is born. Life needs this. You just made it from scratch.',
      'One more oxygen changes everything. Chemistry isn\'t just combining \u2014 it\'s discovering what\'s possible.',
    ],
    completionLine: 'From nothing, you built the beginning. The universe started the same way.',
  },

  // Kitchen: 5 steps
  kitchen: {
    intro: 'Everything you eat, drink, and breathe is chemistry. Your kitchen is a lab.',
    stepNarratives: [
      'The foundation of every recipe. Without water, there is no life, no cooking, no chemistry.',
      'You breathe this out with every exhale. Trees breathe it in. Fair trade.',
      'The invisible fuel behind the blue flame. Chemistry is cooking, and cooking is chemistry.',
      'Tough on grime, made from the elements around you. Cleaning is just rearranging atoms.',
      'Two carbons, six hydrogens \u2014 ethane. Organic chemistry starts here.',
    ],
    completionLine: 'Master Chef of Chemistry. Everything in your kitchen just became a science experiment.',
  },

  // Posner: 5 steps
  posner: {
    intro: 'Deep inside your bones, there\'s a molecule that might be how you think. Build it.',
    stepNarratives: [
      'Your quest begins with a simple spark. Calcium grabs oxygen to forge a chalky white armor that glows in intense heat.',
      'Now phosphorus enters the picture. Three oxygens wrap around two phosphorus atoms \u2014 the signal carrier takes shape.',
      'More oxygen joins the cage. The structure is getting stronger, the pattern more precise.',
      'Calcium meets phosphorus. The strong armor weaves around the glowing center. The foundation of your bones.',
      'Thirty-nine atoms snap into perfect alignment. An unbreakable cage. The hidden molecule that might be how you think.',
    ],
    completionLine: 'The calcium holds, and the core is finally safe.',
  },
};

// Helper
export function getQuestNarrative(questId: string): QuestNarrative | null {
  return QUEST_NARRATIVES[questId] ?? null;
}
