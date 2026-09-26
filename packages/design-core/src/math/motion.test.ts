/**
 * @file motion.test.ts — M3 Expressive spring + spoon mapping.
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest';
import { SPRINGS, SHAPE_MORPH, ELEVATION, spoonSpring, spoonDuration, DURATIONS } from './motion.js';

describe('SPRINGS (M3 Expressive)', () => {
  it('expressive spatial springs overshoot (damping < 1 reflected in curve)', () => {
    expect(SPRINGS.expressive.fast.spatial.curve).toBe('cubic-bezier(0.42, 1.67, 0.21, 0.90)');
    expect(SPRINGS.expressive.default.spatial.curve).toBe('cubic-bezier(0.38, 1.21, 0.22, 1.00)');
  });

  it('effect springs are faster than spatial', () => {
    expect(SPRINGS.expressive.fast.effects.ms).toBeLessThan(SPRINGS.expressive.fast.spatial.ms);
    expect(SPRINGS.expressive.default.effects.ms).toBeLessThan(SPRINGS.expressive.default.spatial.ms);
  });
});

describe('spoonSpring', () => {
  it('floors to instant at crisis / reduced motion', () => {
    expect(spoonSpring(0, 'spatial', false)).toEqual({ curve: 'linear', ms: 0 });
    expect(spoonSpring(3, 'spatial', true)).toEqual({ curve: 'linear', ms: 0 });
  });

  it('uses standard spring at low spoons (calm)', () => {
    expect(spoonSpring(2, 'spatial')).toEqual(SPRINGS.standard.spatial);
  });

  it('uses fast expressive at low-mid spoons, default mid, slow at high spoons', () => {
    expect(spoonSpring(3, 'spatial')).toEqual(SPRINGS.expressive.fast.spatial);
    expect(spoonSpring(4, 'spatial')).toEqual(SPRINGS.expressive.default.spatial);
    expect(spoonSpring(5, 'spatial')).toEqual(SPRINGS.expressive.slow.spatial);
  });

  it('keeps the spoonDuration monotonicity invariant (crisis = 0)', () => {
    expect(spoonDuration(0)).toBe(0);
    expect(spoonDuration(5)).toBe(DURATIONS.standard * 0.5);
  });
});

describe('SHAPE_MORPH + ELEVATION', () => {
  it('shape morph is a 300ms duration', () => {
    expect(SHAPE_MORPH.durationMs).toBe(300);
  });

  it('elevation uses surface tint, not shadow', () => {
    expect(ELEVATION[0].surfaceTintOpacity).toBe(0);
    expect(ELEVATION[3].surfaceTintOpacity).toBeGreaterThan(ELEVATION[1].surfaceTintOpacity);
  });
});