// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Reaction Engine
//
// Defines chemical reactions between completed molecules.
// ═══════════════════════════════════════════════════════

export interface ChemicalReaction {
  id: string;
  name: string;
  reactants: string[];
  products: string[];
  balanced: string;
  type: 'combustion' | 'synthesis' | 'decomposition' | 'displacement' | 'acid_base' | 'redox';
  energy: 'exothermic' | 'endothermic';
  funFact: string;
  love: number;
}

export interface ReactionResult {
  reaction: ChemicalReaction;
  consumed: string[];
  produced: string[];
}

export const REACTIONS: ChemicalReaction[] = [
    { id: 'water_synthesis', name: 'Water Synthesis', reactants: ['H2', 'O2'], products: ['H2O'], balanced: '2H₂ + O₂ → 2H₂O', type: 'synthesis', energy: 'exothermic', funFact: 'The Hindenburg burned because of this reaction.', love: 30, },
    { id: 'rust', name: 'Rusting', reactants: ['Fe', 'O2'], products: ['Fe2O3'], balanced: '4Fe + 3O₂ → 2Fe₂O₃', type: 'redox', energy: 'exothermic', funFact: 'Iron remembers the air. Slowly.', love: 25, },
    { id: 'salt_formation', name: 'Salt Formation', reactants: ['ClH', 'NaOH'], products: ['ClNa', 'H2O'], balanced: 'HCl + NaOH → NaCl + H₂O', type: 'acid_base', energy: 'exothermic', funFact: 'Acid meets base. Violence becomes table salt.', love: 35, },
    { id: 'photosynthesis', name: 'Photosynthesis', reactants: ['CO2', 'H2O'], products: ['C6H12O6', 'O2'], balanced: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂', type: 'synthesis', energy: 'endothermic', funFact: 'Every plant does this. Sunlight becomes sugar.', love: 50, },
    { id: 'combustion_methane', name: 'Methane Combustion', reactants: ['CH4', 'O2'], products: ['CO2', 'H2O'], balanced: 'CH₄ + 2O₂ → CO₂ + 2H₂O', type: 'combustion', energy: 'exothermic', funFact: 'This heats your stove.', love: 25, },
    { id: 'ammonia_synthesis', name: 'Haber Process', reactants: ['N2', 'H2'], products: ['H3N'], balanced: 'N₂ + 3H₂ → 2NH₃', type: 'synthesis', energy: 'exothermic', funFact: 'This reaction feeds half the world. Fritz Haber won a Nobel for it.', love: 40, },
    { id: 'sulfur_dioxide', name: 'Sulfur Combustion', reactants: ['S', 'O2'], products: ['O2S'], balanced: 'S + O₂ → SO₂', type: 'combustion', energy: 'exothermic', funFact: 'Volcanoes exhale this. So do coal plants.', love: 20, },
    { id: 'cellular_respiration', name: 'Cellular Respiration', reactants: ['C6H12O6', 'O2'], products: ['CO2', 'H2O'], balanced: 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O', type: 'combustion', energy: 'exothermic', funFact: 'Your body does this right now. Sugar becomes energy.', love: 50, },
];

export function canReact(formulaA: string, formulaB: string): ChemicalReaction | null {
  for (const reaction of REACTIONS) {
    const reactants = reaction.reactants;
    if (reactants.length === 2) {
      if ((reactants[0] === formulaA && reactants[1] === formulaB) ||
          (reactants[0] === formulaB && reactants[1] === formulaA)) {
        return reaction;
      }
    }
  }
  return null;
}

export function findReactions(formulas: string[]): ChemicalReaction[] {
  const available = new Set(formulas);
  return REACTIONS.filter(r => r.reactants.every(reactant => available.has(reactant)));
}

export function executeReaction(reaction: ChemicalReaction, availableFormulas: string[]): ReactionResult | null {
  const available = new Set(availableFormulas);
  if (reaction.reactants.every(reactant => available.has(reactant))) {
    return {
      reaction,
      consumed: reaction.reactants,
      produced: reaction.products,
    };
  }
  return null;
}

export function getReactionsFor(formula: string): ChemicalReaction[] {
  return REACTIONS.filter(r => r.reactants.includes(formula) || r.products.includes(formula));
}

export function getReactionCount(): number {
  return REACTIONS.length;
}
