/**
 * P31 motion — musical tempo durations + physics-based easing.
 * Durations derived from 120 BPM (500ms beat).
 *   duration = BEAT / n  or  BEAT × n
 *
 * Spoon mapping:
 *   0-1: instant (crisis — no motion)
 *   2:   slow (4× base)
 *   3:   standard (1× base)
 *   4:   accelerated (0.75× base)
 *   5:   fast (0.5× base)
 */

import { BEAT } from './constants';

export const DURATIONS = {
  instant: BEAT / 8,
  fast: BEAT / 4,
  standard: BEAT / 2,
  slow: BEAT,
  slower: BEAT * 2,
} as const;

export const EASING = {
  standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0.0, 1.0, 1)',
} as const;

export const SPOON_MOTION: Record<number, { duration: string; transition: string }> = {
  0: { duration: '0s', transition: '0s' },
  1: { duration: '0s', transition: '0s' },
  2: { duration: '2s', transition: '0.6s' },
  3: { duration: '0.3s', transition: '0.3s' },
  4: { duration: '0.225s', transition: '0.15s' },
  5: { duration: '0.125s', transition: '0.1s' },
};

export function spoonDuration(spoons: number, base = DURATIONS.standard): number {
  if (spoons <= 1) return 0;
  const multipliers = [1, 1, 4, 1, 0.75, 0.5];
  return base * (multipliers[Math.min(5, Math.max(0, spoons))] || 1);
}
