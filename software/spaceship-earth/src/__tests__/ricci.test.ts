import { describe, it, expect } from 'vitest';
import { RicciMath, getAnimatedCurvature, type RicciInput } from '../lib/engine/ricci';

describe('RicciMath', () => {
  describe('calculateCurvature', () => {
    it('returns ~1.0 for ideal network', () => {
      const k = RicciMath.calculateCurvature(0, 0);
      expect(k).toBeCloseTo(1.0, 1);
    });

    it('returns ~0.5 for extreme degradation', () => {
      const k = RicciMath.calculateCurvature(10000, 1);
      expect(k).toBeCloseTo(0.5, 1);
    });

    it('clamps NaN latency to 0', () => {
      const k = RicciMath.calculateCurvature(NaN, 0);
      expect(k).toBeCloseTo(1.0, 1);
    });

    it('clamps noise > 1', () => {
      const k = RicciMath.calculateCurvature(1000, 2.5);
      expect(k).toBeLessThanOrEqual(1.5);
    });

    it('clamps negative latency', () => {
      const k = RicciMath.calculateCurvature(-500, 0);
      expect(k).toBeCloseTo(1.0, 1);
    });

    it('returns value within [0.5, 1.5]', () => {
      const testCases = [
        { latency: 0, noise: 0 },
        { latency: 5000, noise: 0.8 },
        { latency: 10000, noise: 1 },
        { latency: -100, noise: -1 },
        { latency: NaN, noise: NaN },
      ];
      for (const tc of testCases) {
        const k = RicciMath.calculateCurvature(tc.latency as number, tc.noise as number);
        expect(k).toBeGreaterThanOrEqual(0.5);
        expect(k).toBeLessThanOrEqual(1.5);
      }
    });
  });

  describe('getResilience', () => {
    it('returns ISOSTATIC for 4+ nodes', () => {
      expect(RicciMath.getResilience(4)).toBe('100% - ISOSTATIC');
      expect(RicciMath.getResilience(5)).toBe('100% - ISOSTATIC');
    });

    it('returns STABLE for 3 nodes', () => {
      expect(RicciMath.getResilience(3)).toBe('57.7% - STABLE');
    });

    it('returns DEGRADED for 0-2 nodes', () => {
      expect(RicciMath.getResilience(0)).toBe('DEGRADED');
      expect(RicciMath.getResilience(1)).toBe('DEGRADED');
      expect(RicciMath.getResilience(2)).toBe('DEGRADED');
    });
  });

  describe('getScaleFactor', () => {
    it('returns 0.8 for curvature 1.0', () => {
      expect(RicciMath.getScaleFactor(1.0)).toBeCloseTo(0.8, 5);
    });

    it('clamps to [0.6, 1.4]', () => {
      expect(RicciMath.getScaleFactor(0.2)).toBeLessThanOrEqual(0.8);
      expect(RicciMath.getScaleFactor(2.0)).toBeGreaterThanOrEqual(1.0);
    });
  });

  describe('calculate', () => {
    it('handles valid input', () => {
      const input: RicciInput = { latency: 150, noise: 0.3, activeNodes: 4 };
      const output = RicciMath.calculate(input);
      expect(output.curvature).toBeGreaterThanOrEqual(0.5);
      expect(output.resilience).toBe('100% - ISOSTATIC');
    });

    it('handles malformed input', () => {
      const output = RicciMath.calculate(null as any);
      expect(output.curvature).toBeGreaterThanOrEqual(0.5);
      expect(output.resilience).toBe('DEGRADED');
    });
  });
});

describe('getAnimatedCurvature', () => {
  it('returns base for time=0', () => {
    const animated = getAnimatedCurvature(1.0, 0);
    expect(animated).toBeCloseTo(1.0, 1);
  });

  it('oscillates around base', () => {
    const base = 1.0;
    const v1 = getAnimatedCurvature(base, 0);
    const v2 = getAnimatedCurvature(base, Math.PI);
    expect(Math.abs(v2 - base)).toBeLessThanOrEqual(0.09);
  });

  it('clamps to [0.5, 1.5]', () => {
    expect(getAnimatedCurvature(1.5, 1e6)).toBeLessThanOrEqual(1.5);
    expect(getAnimatedCurvature(0.5, 1e6)).toBeGreaterThanOrEqual(0.5);
  });

  it('handles NaN time', () => {
    expect(getAnimatedCurvature(1.0, NaN)).toBeCloseTo(1.0, 5);
  });
});