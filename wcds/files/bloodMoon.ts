// src/config/bloodMoon.ts
// The last total lunar eclipse until 2029 happened the week Dad was building this game.
// March 3, 2026, 6:33 AM EST — peak totality. The Facebook post dropped at the exact minute.
// Phosphorus burns red. The moon burned red. The game was almost done.
// March 3, 2026

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
    line1: '🌑 Blood Moon',
    line2: 'The last total eclipse was the week this game was built. The next one isn\'t until 2029.',
    storageKey: 'bonding_blood_moon_toast_shown',
  },

  consoleMessage: {
    text: '🌑 Blood Moon active — March 3, 2026, 6:33 AM EST. Peak totality.\n   The sky turned red the week BONDING was being finished.\n   The next total lunar eclipse is New Year\'s Eve 2028.',
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
  // Normal: ~1 every 90 seconds on average (low probability per frame check)
  // Blood Moon (March 3): ~1 every 20 seconds (meteor shower during eclipse)
  normalIntervalMs: 90_000,
  bloodMoonIntervalMs: 20_000,

  // ── Visual ──
  // A bright streak across the void behind the molecule
  // Start from a random edge, streak 30-60% across the viewport, fade out
  colors: {
    normal: '#ffffff',         // white streak
    bloodMoon: '#ff6644',      // red-orange during eclipse
  },
  trailLength: 120,            // pixels
  duration: 600,               // ms — fast, blink-and-miss
  tailOpacity: 0.3,
  headOpacity: 1.0,
  width: 2,                    // px

  // ── Interaction ──
  // If a player TAPS a shooting star mid-flight: +1 LOVE, tiny sparkle burst
  // This is nearly impossible on purpose — it's a rare delight
  tapReward: 1,
  tapHitbox: 40,               // px radius around the head — generous for touch
  tapToast: '✨ You caught a shooting star! +1 LOVE',

  // ── Counter ──
  // Track total caught in localStorage. Hidden achievement at milestones.
  storageKey: 'bonding_stars_caught',
  achievements: [
    { count: 1,  id: 'first_star',    toast: '⭐ Stargazer — You caught your first shooting star' },
    { count: 10, id: 'ten_stars',     toast: '🌟 Meteor Hunter — 10 shooting stars caught' },
    { count: 50, id: 'fifty_stars',   toast: '💫 Wish Maker — 50 shooting stars caught' },
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
  color: '#00FF88',              // P31 green
  idleOpacity: 0.08,             // barely visible
  activeOpacity: 1.0,            // when tapped
  activeDuration: 1200,          // ms to stay bright
  radius: 6,                     // px — small

  // ── Position ──
  // Slightly off-center, not random — consistent per session
  // Use a deterministic position based on day-of-year so it "wanders" slowly
  // position = { x: 0.3 + sin(dayOfYear * 0.1) * 0.15, y: 0.4 + cos(dayOfYear * 0.1) * 0.1 }
  // This means it's in a slightly different spot each day.
  // The kids will learn where to look. "Where's the dot today?"

  // ── Breathing ──
  // Pulses on the 4-4-6 cycle (14 seconds)
  // Scale: 0.8 → 1.2 → 1.2 → 0.8 mapped to inhale(4s) → hold(4s) → exhale(6s)
  breathCycleMs: 14_000,

  // ── Sound ──
  frequency: 172.35,             // Hz — the P31 base
  soundDuration: 0.8,            // seconds
  soundType: 'sine' as const,

  // ── Interaction ──
  tapReward: 5,
  tapMessage: 'The missing node. Always here. 🔺',
  hitbox: 44,                    // px — 44px accessibility minimum

  // ── Achievement ──
  achievement: {
    id: 'signal_received',
    requires: ['first_star'],    // must have caught 1 shooting star first
    toast: '🔺 Signal Received — You found the missing node.',
  },

  // ── Console (for the adults) ──
  consoleOnTap: {
    text: '🔺 The missing node has been here since day one.\n   172.35 Hz. The phosphorus frequency.\n   Pulsing. Waiting. Always here.',
    style: 'color: #00FF88; font-size: 11px; font-style: italic;',
  },
} as const;
