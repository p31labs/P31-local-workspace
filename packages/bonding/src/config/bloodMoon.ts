// src/config/bloodMoon.ts
// The last total lunar eclipse until 2029 happened the week Dad was building this game.
// March 3, 2026, 6:33 AM EST — peak totality. The Facebook post dropped at the exact minute.
// Phosphorus burns red. The moon burned red. The game was almost done.
// March 3, 2026
//
// Ambient: https://music.youtube.com/watch?v=iC5k3IyOots

export const BLOOD_MOON = {
  triggerMonth: 2,  // 0-indexed, March = 2
  triggerDay: 3,

  backgroundColor: '#1a0505',
  ambientLightColor: '#ff2222',
  ambientLightIntensity: 0.15,
  atomRimColor: '#ff4444',

  moon: {
    color: '#cc1100',
    glowColor: '#ff220033',
    radius: 80,
    position: { x: 0.7, y: 0.8 },
    opacity: 0.6,
  },

  toast: {
    line1: '\u{1F311} Blood Moon',
    line2: 'The last total eclipse was the week this game was built. The next one isn\'t until 2029.',
    storageKey: 'bonding_blood_moon_toast_shown',
  },

  consoleMessage: {
    text: '\u{1F311} Blood Moon active \u2014 March 3, 2026, 6:33 AM EST. Peak totality.\n   The sky turned red the week BONDING was being finished.\n   The next total lunar eclipse is New Year\'s Eve 2028.',
    style: 'color: #cc1100; font-size: 11px;',
  },
} as const;

export function isBloodMoon(): boolean {
  const now = new Date();
  return now.getMonth() === BLOOD_MOON.triggerMonth && now.getDate() === BLOOD_MOON.triggerDay;
}

// ═══════════════════════════════════════════════════════════════
// SHOOTING STARS — Ambient wonder. Rare. Delightful. Tap to catch.
// ═══════════════════════════════════════════════════════════════

export const SHOOTING_STARS = {
  // ── Frequency ──
  normalIntervalMs: 90_000,
  bloodMoonIntervalMs: 20_000,

  // ── Visual ──
  colors: {
    normal: '#ffffff',
    bloodMoon: '#ff6644',
  },
  trailLength: 120,
  duration: 600,
  tailOpacity: 0.3,
  headOpacity: 1.0,
  width: 2,

  // ── Interaction ──
  tapReward: 1,
  tapHitbox: 40,
  tapToast: '\u{2728} You caught a shooting star! +1 LOVE',

  // ── Counter ──
  storageKey: 'bonding_stars_caught',
  achievements: [
    { count: 1,  id: 'first_star',    toast: '\u{2B50} Stargazer \u2014 You caught your first shooting star' },
    { count: 10, id: 'ten_stars',     toast: '\u{1F31F} Meteor Hunter \u2014 10 shooting stars caught' },
    { count: 50, id: 'fifty_stars',   toast: '\u{1F4AB} Wish Maker \u2014 50 shooting stars caught' },
  ],
} as const;


// ═══════════════════════════════════════════════════════════════
// THE MISSING NODE — "There's always been one more."
// ═══════════════════════════════════════════════════════════════
//
// In every mode, the molecule canvas has a faint, barely-visible
// pulsing dot. Not an atom. Not a ghost site. Just a dim pulse
// in the void, slightly off-center, breathing on the 4-4-6 cycle.
//
// Most players never notice it. It's at opacity 0.08 — almost invisible.
// But it's always there. Every session. Every mode.
//
// If a player TAPS the pulse:
//   - It brightens to full opacity for 1 second
//   - A single low tone plays: 172.35 Hz (the P31 frequency)
//   - A message appears: "The missing node. Always here. 🔺"
//   - +5 LOVE (silent, no toast for the amount)
//   - The pulse returns to 0.08 opacity
//
// If the player has caught at least 1 shooting star AND tapped the
// missing node, a hidden achievement unlocks:
//   "🔺 Signal Received — You found the missing node."
//
// The missing node is Dad.
// It's always in the game. Always pulsing. Almost invisible.
// But if they look — really look — they'll find it.
// And it responds to their touch.

export const MISSING_NODE = {
  // ── Visual ──
  color: '#00FF88',
  idleOpacity: 0.08,
  activeOpacity: 1.0,
  activeDuration: 1200,
  radius: 6,

  // ── Position ──
  // Slightly off-center, deterministic per day
  // position = { x: 0.3 + sin(dayOfYear * 0.1) * 0.15, y: 0.4 + cos(dayOfYear * 0.1) * 0.1 }

  // ── Breathing ──
  breathCycleMs: 14_000,

  // ── Sound ──
  frequency: 172.35,
  soundDuration: 0.8,
  soundType: 'sine' as const,

  // ── Interaction ──
  tapReward: 5,
  tapMessage: 'The missing node. Always here. \u{1F53A}',
  hitbox: 44,

  // ── Achievement ──
  achievement: {
    id: 'signal_received',
    requires: ['first_star'],
    toast: '\u{1F53A} Signal Received \u2014 You found the missing node.',
  },

  // ── Console (for the adults) ──
  consoleOnTap: {
    text: '\u{1F53A} The missing node has been here since day one.\n   172.35 Hz. The phosphorus frequency.\n   Pulsing. Waiting. Always here.',
    style: 'color: #00FF88; font-size: 11px; font-style: italic;',
  },
} as const;
