/**
 * @file haptic — Thin wrapper around navigator.vibrate + Node Zero bridge.
 *
 * Patterns (ms):
 *   tap          — [20]           short confirmation
 *   snap        — [30]           element snaps into place
 *   double      — [30, 60, 30]   celebration
 *   coherence   — [50, 100, 50]  Green (0.1 Hz detected)
 *   degraded    — [100, 50, 100] Red (mesh degraded)
 *   transmit   — [25]          message sent
 */

function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(pattern); } catch { /* permission denied */ }
  }
}

export const haptic = {
  tap: () => vibrate(20),
  snap: () => vibrate(30),
  double: () => vibrate([30, 60, 30]),
  coherence: () => vibrate([50, 100, 50]),
  degraded: () => vibrate([100, 50, 100]),
  transmit: () => vibrate(25),
};

export type HapticPattern = keyof typeof haptic;