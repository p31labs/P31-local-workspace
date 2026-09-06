// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Achievement definitions
//
// Each achievement has a typed trigger that the
// achievementEngine evaluates after every game action.
//
// LOVE values follow the P31 L.O.V.E. economy:
//   Small actions = 1-10
//   First milestones = 10-25
//   Common molecules = 25
//   Complex molecules = 50-100
//   The Posner = 500 (ultimate)
// ═══════════════════════════════════════════════════════

import type { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  // ── First steps ──
  {
    id: 'first_bond',
    name: 'First Bond',
    description: 'Place your first atom',
    trigger: { type: 'first_atom' },
    love: 10,
    icon: '🔗',
  },

  // ── Common molecules ──
  {
    id: 'water_world',
    name: 'Water World',
    description: 'Build H₂O — your body is mostly this',
    trigger: { type: 'formula', formula: 'H₂O' },
    love: 25,
    icon: '💧',
  },
  {
    id: 'rock_solid',
    name: 'Rock Solid',
    description: 'Build CaO — quicklime',
    trigger: { type: 'formula', formula: 'OCa' },
    love: 25,
    icon: '\u{1FAA8}',
  },
  {
    id: 'breathe',
    name: 'Breathe',
    description: 'Build CO₂ — what you exhale',
    trigger: { type: 'formula', formula: 'CO₂' },
    love: 25,
    icon: '💨',
  },
  {
    id: 'methane_madness',
    name: 'Methane Madness',
    description: 'Build CH₄ — the simplest organic molecule',
    trigger: { type: 'formula', formula: 'CH₄' },
    love: 25,
    icon: '💨',
  },

  {
    id: 'stinky',
    name: 'Stinky!',
    description: 'Build NH\u2083 \u2014 ammonia',
    trigger: { type: 'formula', formula: 'H\u2083N' },
    love: 25,
    icon: '\u{1F9EA}',
  },

  // ── Complex molecules ──
  {
    id: 'life_fuel',
    name: 'Life Fuel',
    description: 'Build C₆H₁₂O₆ — glucose, the fuel of life',
    trigger: { type: 'formula', formula: 'C₆H₁₂O₆' },
    love: 100,
    icon: '⚡',
  },
  {
    id: 'bone_builder',
    name: 'Bone Builder',
    description: 'Build Ca₃(PO₄)₂ — calcium phosphate',
    trigger: { type: 'formula', formula: 'O₈P₂Ca₃' }, // Hill system: O8P2Ca3
    love: 75,
    icon: '🦴',
    hidden: true, // Agarwal 2023: dimers maintain better symmetry than Posners
  },

  // ── Ultimate ──
  {
    id: 'the_posner',
    name: 'The Posner',
    description: 'Build Ca₉(PO₄)₆ — the Posner molecule',
    trigger: { type: 'formula', formula: 'O₂₄P₆Ca₉' }, // Hill system: O24P6Ca9
    love: 500,
    icon: '🧬',
    hidden: true,
  },

  // ── Meta achievements ──
  {
    id: 'speed_round',
    name: 'Speed Round',
    description: 'Complete a molecule in under 60 seconds',
    trigger: { type: 'time_under', seconds: 60 },
    love: 50,
    icon: '⏱️',
  },
  {
    id: 'scientist',
    name: 'Scientist',
    description: 'Complete 5 molecules',
    trigger: { type: 'molecule_count', count: 5 },
    love: 50,
    icon: '🔬',
  },
  {
    id: 'big_builder',
    name: 'Big Builder',
    description: 'Build a molecule with 10+ atoms',
    trigger: { type: 'atom_count', count: 10 },
    love: 50,
    icon: '🏗️',
  },
  {
    id: 'diversity',
    name: 'Rainbow Builder',
    description: 'Use 4 different elements in one molecule',
    trigger: { type: 'element_diversity', count: 4 },
    love: 30,
    icon: '🌈',
  },
  {
    id: 'discovery',
    name: 'Discovery',
    description: 'Build a molecule not in the known database',
    trigger: { type: 'novel_molecule' },
    love: 100,
    icon: '🌟',
    hidden: true,
  },

  // ── New element achievements (Cl, S, Fe) ──
  {
    id: 'salty',
    name: 'Salty',
    description: 'Build NaCl \u2014 table salt',
    trigger: { type: 'formula', formula: 'NaCl' },
    love: 25,
    icon: '\u{1F9C2}',
  },
  {
    id: 'rust_bucket',
    name: 'Rust Bucket',
    description: 'Build Fe\u2082O\u2083 \u2014 rust',
    trigger: { type: 'formula', formula: 'O\u2083Fe\u2082' },
    love: 50,
    icon: '\u{1FAA3}',
  },
  {
    id: 'stinker',
    name: 'Stinker',
    description: 'Build H\u2082S \u2014 rotten egg gas',
    trigger: { type: 'formula', formula: 'H\u2082S' },
    love: 25,
    icon: '\u{1F95A}',
  },
  {
    id: 'fools_gold',
    name: "Fool's Gold",
    description: 'Build FeS \u2014 iron pyrite',
    trigger: { type: 'formula', formula: 'SFe' },
    love: 25,
    icon: '\u{1FA99}',
  },
  {
    id: 'acid_test',
    name: 'Acid Test',
    description: 'Build HCl \u2014 hydrochloric acid',
    trigger: { type: 'formula', formula: 'HCl' },
    love: 25,
    icon: '\u{2697}\u{FE0F}',
  },

  // ── WCD-16 additions ──
  {
    id: 'carbon_life',
    name: 'Carbon Life',
    description: 'Build a molecule with 4+ carbon atoms',
    trigger: { type: 'element_count', element: 'C', count: 4 },
    love: 25,
    icon: '🌿',
  },
  {
    id: 'social_molecule',
    name: 'Social Molecule',
    description: 'Exchange 10+ pings in one room',
    trigger: { type: 'ping_count', count: 10 },
    love: 20,
    icon: '💬',
  },
  {
    id: 'speed_builder',
    name: 'Speed Builder',
    description: 'Complete a molecule in under 2 minutes',
    trigger: { type: 'time_under', seconds: 120 },
    love: 15,
    icon: '⚡',
  },
  {
    id: 'full_palette',
    name: 'Full Palette',
    description: 'Use every available element in one molecule',
    trigger: { type: 'full_palette' },
    love: 40,
    icon: '🎨',
  },

  // ── Whitney's Element 25 ──
  {
    id: 'version_one',
    name: 'Version 1.0',
    description: 'Build your first molecule with Manganese \u2014 Element 25',
    trigger: { type: 'element_count', element: 'Mn', count: 1 },
    love: 25,
    icon: '\u{1F940}',
    hidden: true,
  },
];

/** Set of known molecular formulas for novelty detection */
export const KNOWN_MOLECULES: Set<string> = new Set([
  // Seed (H, O)
  'H₂',
  'O₂',
  'H₂O',
  'H₂O₂',
  // Sprout (H, C, N, O)
  'N₂',
  'H₃N',
  'CO₂',
  'CH₄',
  'C₂H₆',
  'C₂H₄',
  'C₂H₂',
  'C₃H₈',
  'C₆H₁₂O₆',
  // Sapling (full palette)
  'NaCl',
  'HONa',
  'OCa',
  'H₂O₂Ca',
  'CO₃Ca',
  'ONa₂',
  'O₃P₂',
  'O₅P₂',
  'O₈P₂Ca₃',
  'O₂₄P₆Ca₉',
  'CH₄O',
  'C₂H₆O',
  'HCl',
  'H₂S',
  'SFe',
  'O₃Fe₂',
  'OFe',
  'O₂S',
  'HNO₃',
  // WCD-25: Expanded dictionary (sync with MOLECULE_NAMES)
  // Note: CO and NO omitted — can't be built in our valence model
  // (C has valence 4, always continues bonding past C+O intermediate)
  'NO₂',
  'N₂O',
  'H₃P',
  'O₃S',
  'CS₂',
  'CHN',
  'H₂O₄S',    // Sulfuric Acid
  'H₃O₄P',    // Phosphoric Acid
  'CH₂O₃',    // Carbonic Acid
  'CH₂O₂',    // Formic Acid
  'C₂H₄O₂',  // Acetic Acid
  'H₂O₃S',    // Sulfurous Acid
  'HNO₂',     // Nitrous Acid
  'CaCl₂',    // Calcium Chloride
  'CO₃Na₂',   // Washing Soda
  'CHO₃Na',   // Baking Soda
  'SNa₂',     // Sodium Sulfide
  'ONaCl',     // Bleach
  'O₄SNa₂',   // Sodium Sulfate
  'HNa',       // Sodium Hydride
  'H₂Ca',      // Calcium Hydride
  'CH₂O',     // Formaldehyde
  'CH₄N₂O',   // Urea
  'C₆H₆',     // Benzene
  'C₆H₆O',    // Phenol
  'O₄SFe',    // Iron(II) Sulfate
  'O₄SCa',    // Gypsum
  'O₄Fe₃',    // Magnetite
  'Cl₂Fe',    // Iron(II) Chloride
  'Cl₃Fe',    // Iron(III) Chloride
  'HO₄PCa',   // Dicalcium Phosphate
  'CCl₄',     // Carbon Tetrachloride
  'P₄',        // White Phosphorus
  // Manganese compounds (Whitney's Element 25)
  'OMn',          // Manganosite
  'SMn',          // Alabandite
  'Cl₂Mn',       // Manganese Chloride
]);
