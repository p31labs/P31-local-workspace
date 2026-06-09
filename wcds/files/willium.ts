// src/config/willium.ts
// The second secret element. Named for Willow Marie Johnson AND William Rodger Johnson.
// The father-daughter bond, encoded in the periodic table.
// Unlocks after completing the Kitchen quest chain.
// March 3, 2026

export const WILLIUM = {
  // ── Element Config ──
  symbol: 'Wi',
  name: 'Willium',
  atomicNumber: 6,             // Willow's age
  maxBonds: 3,                 // one for each: Will, Bash, Willow
  color: '#4ade80',            // willow-green — growth, life, nature
  glowColor: '#86efac',
  radius: 1.15,                // same generous size as Bashium
  discovered: 'August 8, 2019',
  tagline: 'Unbreakable. Grows toward the light.',

  // ── Unlock Toast (shown when Willium first appears in palette) ──
  unlockToast: {
    line1: 'NEW ELEMENT FOUND: Something beautiful is growing.',
    line2: 'This one was here all along. You just had to look.',
  },

  // ── Completion Message (when a Willium compound is built) ──
  completionMessage: {
    line1: 'A brand new molecule! Nobody has ever built this before.',
    line2: 'Willium: named after a girl who grows toward the light,',
    line3: 'and a dad who\'ll always be her roots. 🔺',
  },

  // ── Fun Fact ──
  funFact: 'Willium was first observed on August 8, 2019. It has three bonds because it always holds on to the people it loves. Scientists say it smells like wildflowers and giggles.',

  // ── Unlock Condition ──
  // Willium appears in Sprout mode palette ONLY after kitchen quest chainComplete === true
  // Check: useGameStore(s => s.questProgress?.kitchen?.chainComplete)
} as const;

// Willium element entry for the elements config array
export const WILLIUM_ELEMENT = {
  symbol: WILLIUM.symbol,
  name: WILLIUM.name,
  color: WILLIUM.color,
  maxBonds: WILLIUM.maxBonds,
  radius: WILLIUM.radius,
  secret: true,
  unlockCondition: 'kitchen_complete',
} as const;
