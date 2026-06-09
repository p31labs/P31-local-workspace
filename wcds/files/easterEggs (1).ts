// src/config/easterEggs.ts
// The little things that turn code into a birthday present.
// March 3, 2026

// ── Console Easter Egg ──
// Add to main.tsx or App.tsx init, runs once on load
export function logBirthdayConsole(): void {
  console.log(
    '%c🔺 BONDING v1.0 — P31 Labs',
    'color: #00FF88; font-size: 14px; font-weight: bold;'
  );
  console.log(
    '%c  Built with love for Bash\'s 10th birthday\n  March 10, 2026\n  "Every atom placed is a connection. Every molecule is a conversation."\n  phosphorus31.org',
    'color: #7878AA; font-size: 10px;'
  );
}

// ── First Molecule Message ──
// Shown ONCE ever, on the very first molecule completion
export const FIRST_MOLECULE = {
  storageKey: 'bonding_first_molecule_shown',
  line1: '⚡ You made your first molecule! ⚡',
  line2: 'You\'re a natural chemist.',
} as const;

// ── Footer Text ──
// Visible on idle screen, mode select, or about page
export const WONKY_FOOTER = 'It\'s okay to be a little wonky. 🔺';

// ── Confetti Config ──
export const CONFETTI = {
  normalCount: 80,
  questCompleteCount: 160,
  bashiumCount: 200,
  colors: ['#ff4d6a', '#5b8def', '#4ecf73', '#ffd644', '#b44dff', '#ff9f43'],
  duration: 2500,     // ms
  gravity: 0.05,
  maxSpeed: 4,
} as const;

// ── Per-Element Sound Frequencies ──
// Each element gets a unique pitch when placed on canvas.
// Based on the P31 pentatonic scale (root = 172.35 Hz, the ³¹P NMR frequency).
export const ELEMENT_TONES: Record<string, number> = {
  'H':  523.25,   // C5 — highest, lightest element
  'O':  349.23,   // F4 — mid-range, essential
  'C':  261.63,   // C4 — warm, foundational
  'N':  329.63,   // E4 — slightly below oxygen
  'Na': 196.00,   // G3 — metallic, low
  'Ca': 172.35,   // P31 base — deep, resonant, protective
  'P':  172.35,   // Same as Ca — the core frequency
  'Cl': 440.00,   // A4 — bright, sharp
  'S':  220.00,   // A3 — sulfur, warm-low
  'Ba': 344.70,   // Bashium — the octave of P31 (172.35 × 2)
  'Wi': 431.75,   // Willium — Larmor / 2 (863 / 2), the heartbeat halved. Grows toward the light.
};

// Bond formation: ascending two-note interval
export const BOND_TONE = { freq1: 349.23, freq2: 440.00, duration: 0.1 };

// Molecule completion: 4-note chord
export const COMPLETION_CHORD = {
  notes: [172.35, 258.53, 344.70, 430.88], // root, fifth, octave, high third
  duration: 0.8,
  attack: 0.1,
  release: 0.6,
};
