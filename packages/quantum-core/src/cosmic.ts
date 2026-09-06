/**
 * ⚠️ HONEST LABEL
 * This module maps archetypal/cosmological concepts to neurobehavioral systems.
 * The mappings are inspired by interpretive preprints (Homo Constellatus 2025,
 * Vedic Observer Effect 2024) and are NOT peer-reviewed science.
 *
 * The math constants are real (SIC-POVM, K₄); the interpretive framing is not.
 * See docs/QF1_CONTESTED_SCIENCE.md.
 */

import { TETRA } from '@p31/design-core/math';
export { computeMorphogeneticField, cliffordRotation } from './morphogeneticField.js';

/**
 * 12 astrological houses → neurobehavioral system mapping.
 * Based on research linking each house to core neural/behavioral circuits.
 * Each entry: house index (1-12), label, neuro system, element, color.
 */
export const HOUSE_NEURO_MAP: Array<{
  house: number;
  label: string;
  neuroSystem: string;
  element: string;
  color: string;
}> = [
  { house: 1, label: 'Self', neuroSystem: 'Identity / Executive Function', element: 'Fire', color: '#00F0FF' },
  { house: 2, label: 'Values', neuroSystem: 'Reward / Valuation', element: 'Earth', color: '#34D399' },
  { house: 3, label: 'Communication', neuroSystem: 'Language / Social Cognition', element: 'Air', color: '#FBBF24' },
  { house: 4, label: 'Home', neuroSystem: 'Attachment / Safety', element: 'Water', color: '#A78BFA' },
  { house: 5, label: 'Creativity', neuroSystem: 'Play / Exploration', element: 'Fire', color: '#FB7185' },
  { house: 6, label: 'Health', neuroSystem: 'Interoception / Routine', element: 'Earth', color: '#34D399' },
  { house: 7, label: 'Partnership', neuroSystem: 'Theory of Mind / Bonding', element: 'Air', color: '#FCD34D' },
  { house: 8, label: 'Transformation', neuroSystem: 'Threat / Reconsolidation', element: 'Water', color: '#A78BFA' },
  { house: 9, label: 'Meaning', neuroSystem: 'Abstract Reasoning / Belief', element: 'Fire', color: '#FBBF24' },
  { house: 10, label: 'Purpose', neuroSystem: 'Goal Pursuit / Status', element: 'Earth', color: '#00F0FF' },
  { house: 11, label: 'Community', neuroSystem: 'Social Networks / Altruism', element: 'Air', color: '#34D399' },
  { house: 12, label: 'Transcendence', neuroSystem: 'Default Mode / Spirituality', element: 'Water', color: '#A78BFA' },
];

/**
 * Homo Constellatus archetype profile based on spoon level.
 * Returns a narrative framing string.
 */
export function homoConstellatusProfile(spoonLevel: number): {
  archetype: string;
  description: string;
  resonance: string;
} {
  if (spoonLevel >= 4) {
    return {
      archetype: 'The Navigator',
      description: 'Reading the constellations with clarity. Tetrahedral coherence is high.',
      resonance: 'Φ resonance — recursive phase alignment with the field.',
    };
  }
  if (spoonLevel >= 2) {
    return {
      archetype: 'The Cartographer',
      description: 'Mapping the stars through the fog. Partial coherence, active compensation.',
      resonance: 'Partial phase lock — K₄ mesh shows degraded edges.',
    };
  }
  return {
    archetype: 'The Dreamer',
    description: 'Dissolved into the field. Non-local perception, minimal executive filter.',
    resonance: 'Zero-phase — the cage rests. 863 Hz carrier only.',
  };
}

/**
 * Check if the tetrahedral constant 1/3 appears in the given text.
 * Archetypal significance: 1/3 is the SIC-POVM overlap, the tetrahedral bond
 * angle cos(109.47°), and the structure constant of the K₄ graph.
 */
export function hasTetraConstant(text: string): boolean {
  return text.includes('1/3') || text.includes('1 / 3');
}

/**
 * TETRA constants with cosmic/archetypal annotations.
 * Each value is a verified mathematical constant; the interpretation is
 * provided as a comment only.
 */
export const COSMIC_TETRA = {
  ...TETRA,
  // The tetrahedron as the shape of consciousness itself (interpretive)
  COSMIC_CONSCIOUSNESS: 4,
  // The golden ratio as the scaling law of morphogenetic fields (MacDonald 2025)
  COSMIC_PHI: 1.618033988749895,
  // 1/3 as the universal overlap — SIC-POVM, bond angle, K₄ edge ratio
  COSMIC_OVERLAP: 1 / 3,
} as const;
