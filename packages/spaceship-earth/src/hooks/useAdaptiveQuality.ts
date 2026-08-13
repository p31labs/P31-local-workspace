// ═══════════════════════════════════════════════════════════════
// WCD-28.3: Adaptive Quality Hook
// P31 Labs — Spaceship Earth
//
// Watches the performance monitor and returns the current quality
// tier.  Drives LOD decisions (NeoPixel segment count, geometry
// resolution, particle density).
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { performanceMonitor } from '../services/performanceMonitor';
import { domeConfig } from '../config/domeConfig';

type PerformanceLevel = 'high' | 'medium' | 'low';

export interface QualityTier {
  level: PerformanceLevel;
  fovMultiplier: number;
  neoPixelSegments: number;
  starfieldCount: number;
  bloomHeight: number;
  antialias: boolean;
}

const MAX_NEO_SEGMENTS = domeConfig.neoPixel.maxSegments;

const TIERS: Record<PerformanceLevel, QualityTier> = {
  high: {
    level: 'high',
    fovMultiplier: 1.0,
    neoPixelSegments: MAX_NEO_SEGMENTS,
    starfieldCount: 1600,
    bloomHeight: 512,
    antialias: true,
  },
  medium: {
    level: 'medium',
    fovMultiplier: 0.95,
    neoPixelSegments: Math.round(MAX_NEO_SEGMENTS / 2),
    starfieldCount: 800,
    bloomHeight: 256,
    antialias: false,
  },
  low: {
    level: 'low',
    fovMultiplier: 0.9,
    neoPixelSegments: Math.round(MAX_NEO_SEGMENTS / 4),
    starfieldCount: 400,
    bloomHeight: 128,
    antialias: false,
  },
};

/**
 * Subscribe to performance monitor changes and return the current quality tier.
 * Call once in a top-level component (e.g. App or Lens).
 */
export function useAdaptiveQuality(): QualityTier {
  const [tier, setTier] = useState<QualityTier>(() => TIERS[performanceMonitor.getPerformanceLevel()]);

  useEffect(() => {
    const handler = () => {
      const level = performanceMonitor.getPerformanceLevel();
      setTier(TIERS[level]);
    };
    window.addEventListener('p31:perf:low', handler);
    window.addEventListener('p31:perf:critical', handler);
    return () => {
      window.removeEventListener('p31:perf:low', handler);
      window.removeEventListener('p31:perf:critical', handler);
    };
  }, []);

  return tier;
}

/**
 * Returns true when the renderer should skip per-frame animation updates.
 * Disabled when spoons ≤ 1 or the OS prefers-reduced-motion.
 */
export function useShouldAnimate(spoons: number): boolean {
  const reducedMotion = useReducedMotionQuery();
  return spoons > 1 && !reducedMotion;
}

/**
 * Returns the 5-tier speed factor from the canonical token system.
 * Drives CSS animation-duration and JS animation speed scaling.
 * Maps: spoons 0-1 → 0, 2 → 0.25, 3 → 0.5, 4 → 0.75, 5 → 1.
 */
export function useSpeedFactor(spoons: number): number {
  if (spoons <= 1) return 0;
  if (spoons === 2) return 0.25;
  if (spoons === 3) return 0.5;
  if (spoons === 4) return 0.75;
  return 1;
}

function useReducedMotionQuery(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}
