import { describe, it, expect } from 'vitest';
import { computeAdaptation, computeFromFeedback, serializeDecision, deserializeDecision } from '../src/edgeAdaptation';

describe('computeAdaptation', () => {
  it('returns crisis mode for spoons 0', () => {
    const result = computeAdaptation(0, {
      dwellSeconds: 5,
      errorRate: 0,
      scrollVelocity: 0,
      idleSeconds: 0,
      rageClicks: 0,
    });
    expect(result.spoons).toBe(0);
    expect(result.motion).toBe('none');
    expect(result.contrast).toBe('high');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('reduces spoons on rage clicks', () => {
    const result = computeAdaptation(3, {
      dwellSeconds: 5,
      errorRate: 0,
      scrollVelocity: 0,
      idleSeconds: 0,
      rageClicks: 5,
    });
    expect(result.spoons).toBeLessThanOrEqual(1);
  });

  it('reduces spoons on high error rate', () => {
    const result = computeAdaptation(3, {
      dwellSeconds: 5,
      errorRate: 0.5,
      scrollVelocity: 0,
      idleSeconds: 0,
      rageClicks: 0,
    });
    expect(result.spoons).toBeLessThan(3);
  });

  it('maps spoons to size class', () => {
    const result = computeAdaptation(4, {
      dwellSeconds: 30,
      errorRate: 0,
      scrollVelocity: 100,
      idleSeconds: 0,
      rageClicks: 0,
    });
    expect(result.sizeClass).toBe('medium');
  });
});

describe('computeFromFeedback', () => {
  it('maps low coherence to low spoons', () => {
    const result = computeFromFeedback(0.1, 0.1);
    expect(result.spoons).toBeLessThanOrEqual(1);
    expect(result.motion).toBe('none');
    expect(result.density).toBe('low');
  });

  it('maps high coherence to high spoons', () => {
    const result = computeFromFeedback(0.9, 0.9);
    expect(result.spoons).toBeGreaterThanOrEqual(4);
  });
});

describe('serializeDecision', () => {
  it('round-trips through JSON', () => {
    const original = {
      spoons: 3,
      sizeClass: 'regular' as const,
      contrast: 'standard' as const,
      motion: 'full' as const,
      density: 'medium' as const,
      confidence: 0.8,
      trigger: { type: 'spoons' as const, value: 3 },
    };
    const json = serializeDecision(original);
    const restored = deserializeDecision(json);
    expect(restored.spoons).toBe(3);
    expect(restored.sizeClass).toBe('regular');
  });
});
