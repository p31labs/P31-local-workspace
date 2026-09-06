import { describe, it, expect } from 'vitest';
import {
  initBanditState,
  contextualBanditSelect,
  reinforceBandit,
  getBanditStats,
} from '../src/bandit';

const variants = [
  { id: 'a', weight: 1 },
  { id: 'b', weight: 2 },
  { id: 'c', weight: 3 },
];

describe('initBanditState', () => {
  it('initializes weights for all variants', () => {
    const state = initBanditState(variants);
    expect(state.weights['a']).toHaveLength(8);
    expect(state.weights['b']).toHaveLength(8);
    expect(state.counts['a']).toBe(0);
    expect(state.totalSelections).toBe(0);
  });
});

describe('contextualBanditSelect', () => {
  it('returns one of the provided variants', () => {
    const state = initBanditState(variants);
    const result = contextualBanditSelect(variants, { spoons: 3, sessionSeconds: 0 }, state);
    expect(['a', 'b', 'c']).toContain(result.variant.id);
  });

  it('returns single variant for single input', () => {
    const state = initBanditState([variants[0]]);
    const result = contextualBanditSelect([variants[0]], { spoons: 3, sessionSeconds: 0 }, state);
    expect(result.variant.id).toBe('a');
    expect(result.confidence).toBe(1);
  });

  it('throws on empty variants', () => {
    const state = initBanditState(variants);
    expect(() => contextualBanditSelect([], { spoons: 3, sessionSeconds: 0 }, state)).toThrow();
  });
});

describe('reinforceBandit', () => {
  it('updates weights after positive reward', () => {
    const state = initBanditState(variants);
    const selected = contextualBanditSelect(variants, { spoons: 3, sessionSeconds: 0 }, state);
    const next = reinforceBandit(state, selected.variant.id, 0.9, 0.1);
    expect(next.totalSelections).toBe(1);
    expect(next.counts[selected.variant.id]).toBe(1);
    expect(getBanditStats(next, selected.variant.id).meanReward).toBeCloseTo(0.9);
  });
});
