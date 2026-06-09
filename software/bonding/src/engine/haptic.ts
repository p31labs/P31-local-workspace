// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Haptic engine: vibration patterns for touch devices
//
// Uses the Vibration API (navigator.vibrate).
// Fails silently on unsupported devices.
// Patterns tuned for both Android and iOS (where supported).
// Opt-in: defaults OFF if prefers-reduced-motion is set.
// ═══════════════════════════════════════════════════════

let _enabled = typeof window !== 'undefined'
  ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : true;

export function isHapticEnabled(): boolean {
  return _enabled;
}

export function setHapticEnabled(on: boolean): void {
  _enabled = on;
}

function vibrate(pattern: number | number[]): void {
  if (!_enabled) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Vibration API unsupported — fail silently
  }
}

export const haptic = {
  /** Atom snaps to a valid bond site — light tap */
  goodBond: () => vibrate(40),

  /** Invalid bond attempt — double pulse rejection */
  badBond: () => vibrate([20, 30, 20]),

  /** Atom placed successfully — firm single pulse */
  place: () => vibrate(60),

  /** Drag begins — barely perceptible */
  snap: () => vibrate(15),

  /** Molecule completed — celebration pattern */
  complete: () => vibrate([50, 50, 50, 50, 100]),

  /** Achievement unlocked — distinct triple tap */
  achievement: () => vibrate([30, 40, 30, 40, 60]),

  /** Ping received — attention pulse */
  ping: () => vibrate([30, 40, 30]),
};
