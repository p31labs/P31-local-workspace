import { describe, it, expect } from 'vitest';
import { useAdaptiveStore } from './adaptiveStore';

describe('adaptiveStore', () => {
  it('initializes with default values', () => {
    const state = useAdaptiveStore.getState();
    expect(state.spoons).toBe(3);
    expect(state.sizeClass).toBe('regular');
    expect(state.contrast).toBe('standard');
    expect(state.motion).toBe('full');
    expect(state.density).toBe('medium');
    expect(state.confidence).toBe(0.3);
    expect(state.drivers).toEqual([]);
  });

  it('updates decision via setDecision', () => {
    useAdaptiveStore.getState().setDecision({
      spoons: 0,
      sizeClass: 'compact',
      contrast: 'high',
      motion: 'none',
      density: 'low',
      confidence: 0.9,
      drivers: ['rageClicks'],
    });

    const state = useAdaptiveStore.getState();
    expect(state.spoons).toBe(0);
    expect(state.sizeClass).toBe('compact');
    expect(state.contrast).toBe('high');
    expect(state.motion).toBe('none');
    expect(state.density).toBe('low');
    expect(state.confidence).toBe(0.9);
    expect(state.drivers).toEqual(['rageClicks']);

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
