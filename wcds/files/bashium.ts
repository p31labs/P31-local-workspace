// src/config/bashium.ts
// The secret element. Named after Sebastian "Bash" Johnson.
// Unlocks after completing the Genesis quest chain.
// Content: Gemini (Narrator) | QA: Opus (Architect) | March 3, 2026

export const BASHIUM = {
  // ── Element Config ──
  symbol: 'Ba',
  name: 'Bashium',
  atomicNumber: 10,            // his age
  maxBonds: 4,
  color: '#b44dff',            // purple — unique among all elements
  glowColor: '#d88fff',
  radius: 1.15,                // slightly larger than standard atoms
  discovered: 'March 10, 2016',
  tagline: 'Warning: Highly reactive and 100% scientifically legendary.',

  // ── Unlock Toast (shown when Bashium first appears in palette) ──
  unlockToast: {
    line1: 'SYSTEM OVERRIDE: Unknown element detected.',
    line2: 'Wait... you\'re the only scientist in the world who has this.',
  },

  // ── Completion Message (when a Bashium compound is built) ──
  completionMessage: {
    line1: 'NEW COMPOUND SYNTHESIZED. The reaction is completely off the charts.',
    line2: 'Happy 10th Birthday to my greatest discovery.',
    line3: 'I love you, Bash. Now go blow something up. — Dad',
  },

  // ── Fun Fact ──
  funFact: 'Bashium first crashed into Earth\'s atmosphere on March 10, 2016. Scientists note it produces boundless kinetic energy, travels at extreme speeds, and absolutely refuses to react with broccoli.',

  // ── Unlock Condition ──
  // Bashium appears in Seed mode palette ONLY after genesis quest chainComplete === true
  // Check: useGameStore(s => s.questProgress?.genesis?.chainComplete)
} as const;

// Bashium element entry for the elements config array
// Sonnet: merge this into your elements dictionary alongside H, O, C, etc.
export const BASHIUM_ELEMENT = {
  symbol: BASHIUM.symbol,
  name: BASHIUM.name,
  color: BASHIUM.color,
  maxBonds: BASHIUM.maxBonds,
  radius: BASHIUM.radius,
  // Flag so the palette can gate visibility
  secret: true,
  unlockCondition: 'genesis_complete',
} as const;
