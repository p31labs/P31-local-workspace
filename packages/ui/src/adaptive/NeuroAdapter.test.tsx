import { describe, it, expect } from 'vitest';
import { estimateCognitiveLoad } from './NeuroAdapter';

describe('estimateCognitiveLoad', () => {
  const baseSignals = (overrides: Partial<Parameters<typeof estimateCognitiveLoad>[0]> = {}) => ({
    recentClicks: [],
    idleMs: 0,
    errors: 0,
    scrollCount: 0,
    now: Date.now(),
    ...overrides,
  });

  const opts = {
    rageClickThreshold: 3,
    rageClickWindow: 2000,
    idleThreshold: 30000,
    emitInterval: 2000,
    onEstimate: () => {},
  };

  it('returns low load for calm interaction', () => {
    const result = estimateCognitiveLoad(baseSignals(), opts);
    expect(result.load).toBeLessThan(0.4);
    expect(result.spoonDelta).toBeGreaterThanOrEqual(0);
  });

  it('detects rage clicks', () => {
    const now = Date.now();
    const clicks = Array.from({ length: 5 }, () => now - 500);
    const result = estimateCognitiveLoad(baseSignals({ recentClicks: clicks }), opts);
    expect(result.load).toBeGreaterThan(0.5);
    expect(result.drivers).toContain('rageClicks');
  });

  it('detects idle disengagement', () => {
    const result = estimateCognitiveLoad(baseSignals({ idleMs: 60000 }), opts);
    expect(result.load).toBeGreaterThan(0.3);
    expect(result.drivers).toContain('idle');
  });

  it('detects errors', () => {
    const result = estimateCognitiveLoad(baseSignals({ errors: 5 }), opts);
    expect(result.load).toBeGreaterThan(0.4);
    expect(result.drivers).toContain('errors');
  });

  it('returns values clamped to 0..1', () => {
    const result = estimateCognitiveLoad(baseSignals(), opts);
    expect(result.load).toBeGreaterThanOrEqual(0);
    expect(result.load).toBeLessThanOrEqual(1);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});
