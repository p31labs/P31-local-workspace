import { describe, it, expect } from 'vitest';
import { estimateCognitiveLoad } from './NeuroAdapter';
import { computeAdaptation } from '@p31ca/quantum-core/edgeAdaptation';
import { useAdaptiveStore } from './adaptiveStore';

describe('NeuroAdapter → edgeAdaptation → store pipeline', () => {
  it('maps calm behavior to stable spoons', () => {
    const estimate = estimateCognitiveLoad(
      {
        recentClicks: [],
        idleMs: 1000,
        errors: 0,
        scrollCount: 0,
        now: Date.now(),
      },
      {
        rageClickThreshold: 3,
        rageClickWindow: 2000,
        idleThreshold: 30000,
        emitInterval: 2000,
        onEstimate: () => {},
      },
    );

    const decision = computeAdaptation(3, {
      dwellSeconds: 1,
      errorRate: 0,
      scrollVelocity: 0,
      idleSeconds: 1,
      rageClicks: 0,
    });

    expect(decision.spoons).toBeGreaterThanOrEqual(0);
    expect(decision.spoons).toBeLessThanOrEqual(5);
    expect(decision.sizeClass).toBe('regular');
    expect(decision.motion).toBe('reduced');
    expect(decision.confidence).toBeGreaterThanOrEqual(0);
  });

  it('maps rage clicks to reduced spoons', () => {
    const now = Date.now();
    const recentClicks = Array.from({ length: 10 }, () => now - Math.random() * 1000);
    const estimate = estimateCognitiveLoad(
      {
        recentClicks,
        idleMs: 500,
        errors: 0,
        scrollCount: 0,
        now,
      },
      {
        rageClickThreshold: 3,
        rageClickWindow: 2000,
        idleThreshold: 30000,
        emitInterval: 2000,
        onEstimate: () => {},
      },
    );

    const decision = computeAdaptation(3, {
      dwellSeconds: 0.5,
      errorRate: 0,
      scrollVelocity: 0,
      idleSeconds: 0.5,
      rageClicks: 10,
    });

    expect(estimate.drivers).toContain('rageClicks');
    expect(decision.spoons).toBeLessThanOrEqual(1);
    expect(decision.motion).toBe('none');
    expect(decision.contrast).toBe('high');
  });

  it('stores adaptation decision in the zustand store', () => {
    useAdaptiveStore.getState().setDecision({
      spoons: 0,
      sizeClass: 'compact',
      contrast: 'high',
      motion: 'none',
      density: 'low',
      confidence: 0.9,
      drivers: ['test'],
    });

    const state = useAdaptiveStore.getState();
    expect(state.spoons).toBe(0);
    expect(state.sizeClass).toBe('compact');
    expect(state.motion).toBe('none');

    useAdaptiveStore.getState().setDecision({
      spoons: 3,
      sizeClass: 'regular',
      contrast: 'standard',
      motion: 'full',
      density: 'medium',
      confidence: 0.3,
      drivers: [],
    });
  });
});
