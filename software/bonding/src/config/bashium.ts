// src/config/bashium.ts
// The secret element. Named after Sebastian "Bash" Johnson.
// Unlocks after completing the Genesis quest chain.
// Content: Gemini (Narrator) | QA: Opus (Architect) | Integration: Sonnet

export const BASHIUM = {
  // ── Element Config ──
  symbol: 'Ba' as const,
  name: 'Bashium',
  atomicNumber: 10,            // his age
  maxBonds: 4,
  color: '#CC55FF',            // purple — unique among all elements
  emissive: '#DD88FF',
  radius: 1.15,                // slightly larger than standard atoms
  frequency: 345,              // octave of P31 (172.35 × 2)
  note: 'Ba',
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
    line3: 'I love you, Bash. Now go blow something up. \u2014 Dad',
  },

  // ── Fun Fact ──
  funFact: 'Bashium first crashed into Earth\'s atmosphere on March 10, 2016. Scientists note it produces boundless kinetic energy, travels at extreme speeds, and absolutely refuses to react with broccoli.',

  // ── Unlock Condition ──
  // Bashium appears in Seed mode palette ONLY after genesis quest chainComplete === true
  // Check: useGameStore(s => s.questProgress?.genesis?.completed)
} as const;
