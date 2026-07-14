import { useEffect, useState } from 'react';

export type SpoonLevel = 0 | 1 | 2 | 3 | 4 | 5;

interface SpoonMotionState {
  /** Raw spoon value from user/state */
  raw: SpoonLevel;
  /** Effective spoons after prefers-reduced-motion clamp */
  effective: SpoonLevel;
  /** Whether system reduced-motion is active */
  prefersReducedMotion: boolean;
}

/**
 * useSpoonMotion — returns effective spoon level clamped by prefers-reduced-motion.
 *
 * When the OS reduce-motion preference is active, spoons are capped at 2
 * (Reduced) regardless of the user's selection.
 */
export function useSpoonMotion(raw: SpoonLevel): SpoonMotionState {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const effective = prefersReducedMotion ? Math.min(raw, 2) as SpoonLevel : raw;

  return { raw, effective, prefersReducedMotion };
}

/**
 * ambientScale — maps spoon level to ambient effect parameters.
 */
export function ambientScale(spoons: SpoonLevel) {
  return {
    /** Particle count multiplier (0-1) */
    particleMultiplier: [0, 0, 0.3, 0.6, 1, 1][spoons],
    /** Animation speed multiplier (ms) */
    speedMs: [0, 0, 2000, 1200, 800, 500][spoons],
    /** Whether canvas effects should run */
    canvasActive: spoons >= 2,
    /** Whether effects should pulse */
    pulseActive: spoons >= 3,
    /** Crispness: blur amount (px) */
    blurAmount: [0, 0, 2, 1, 0, 0][spoons],
  };
}
