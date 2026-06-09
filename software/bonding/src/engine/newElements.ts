// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// New elements: Chlorine, Sulfur, Iron
//
// Pure data module. No React. No game imports.
// Element objects match the existing structure used by the game.
// ═══════════════════════════════════════════════════════

import type { ElementSymbol } from '../types';

export interface NewElementData {
  symbol: ElementSymbol;
  name: string;
  valence: number;
  color: string;
  emissive: string;
  frequency: number;
  note: string;
  size: number;
  funFact: string;
}

/**
 * Chlorine (Cl)
 * Halogen, max bonds 1, bright green, 185 Hz
 */
export const CHLORINE: NewElementData = {
  symbol: 'Cl',
  name: 'Chlorine',
  valence: 1,
  color: '#1FF01F',       // bright green
  emissive: '#004400',    // subtle glow
  frequency: 185,         // Hz — between Ca(147) and Na(196), halogen register
  note: 'Cl',
  size: 0.99,             // relative to existing elements
  funFact: "Makes table salt with sodium. Also keeps your pool clean.",
};

/**
 * Sulfur (S)
 * Chalcogen, max bonds 2, yellow, 220 Hz
 */
export const SULFUR: NewElementData = {
  symbol: 'S',
  name: 'Sulfur',
  valence: 2,
  color: '#FFFF30',       // yellow
  emissive: '#333300',    // subtle glow
  frequency: 220,         // A3 — sharp, yellow
  note: 'S',
  size: 1.04,
  funFact: "Rotten eggs smell like sulfur. Volcanoes are full of it.",
};

/**
 * Iron (Fe)
 * Transition metal, simplified max bonds 3, rust brown, 110 Hz
 */
export const IRON: NewElementData = {
  symbol: 'Fe',
  name: 'Iron',
  valence: 3,             // simplified — Fe can be 2 or 3
  color: '#A52A2A',       // rust brown
  emissive: '#2A0F0F',    // subtle glow
  frequency: 110,         // A2 — very deep, core
  note: 'Fe',
  size: 1.26,
  funFact: "Your blood is red because of iron. Stars die to make this.",
};

/**
 * All new elements as an array.
 */
export const NEW_ELEMENTS: NewElementData[] = [CHLORINE, SULFUR, IRON];

/**
 * New molecule checkpoints for the registry.
 * Hill system formula → display info.
 */
export const NEW_MOLECULES = [
  {
    formula: 'ClNa',       // Hill: Cl before Na
    displayName: 'Salt',
    displayFormula: 'NaCl',
    elements: { Na: 1, Cl: 1 },
  },
  {
    formula: 'ClH',        // Hill: Cl before H
    displayName: 'Hydrochloric Acid',
    displayFormula: 'HCl',
    elements: { H: 1, Cl: 1 },
  },
  {
    formula: 'H2S',
    displayName: 'Hydrogen Sulfide',
    displayFormula: 'H₂S',
    elements: { H: 2, S: 1 },
  },
  {
    formula: 'O2S',        // Hill: O before S
    displayName: 'Sulfur Dioxide',
    displayFormula: 'SO₂',
    elements: { S: 1, O: 2 },
  },
  {
    formula: 'Fe2O3',
    displayName: 'Rust',
    displayFormula: 'Fe₂O₃',
    elements: { Fe: 2, O: 3 },
  },
  {
    formula: 'FeS',
    displayName: "Fool's Gold",
    displayFormula: 'FeS',
    elements: { Fe: 1, S: 1 },
  },
];

/**
 * Mode assignments for new elements.
 * Seed 🌱: H, O (unchanged)
 * Sprout 🌿: H, C, N, O (unchanged)
 * Sapling 🌳: H, C, N, O, P, Na, Ca, Cl, S, Fe (all 10)
 */
export const MODE_ELEMENTS: Record<string, ElementSymbol[]> = {
  seed: ['H', 'O'],
  sprout: ['H', 'C', 'N', 'O'],
  sapling: ['H', 'C', 'N', 'O', 'P', 'Na', 'Ca', 'Cl', 'S', 'Fe'],
};