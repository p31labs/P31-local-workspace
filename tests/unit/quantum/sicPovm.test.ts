import { describe, it, expect } from 'vitest';
import {
  sicPovmStates,
  sicPovmProjectors,
  sicPovmProbabilities,
  sicPovmFidelity,
  verifySicPovm,
} from '../../../packages/quantum-core/src/sicPovm';

describe('SIC-POVM d=2', () => {
  it('produces 4 states', () => {
    const states = sicPovmStates();
    expect(states).toHaveLength(4);
  });

  it('states are unit vectors', () => {
    for (const [a, b] of sicPovmStates()) {
      const norm = a * a + b * b;
      expect(norm).toBeCloseTo(1, 10);
    }
  });

  it('produces 4 projectors', () => {
    const projs = sicPovmProjectors();
    expect(projs).toHaveLength(4);
    for (const [w, _v] of projs) {
      expect(w).toBe(0.5);
    }
  });

  it('overlap fidelity = 1/3', () => {
    const f = sicPovmFidelity();
    expect(f).toBeCloseTo(1 / 3, 10);
  });

  it('verifySicPovm passes', () => {
    const result = verifySicPovm();
    expect(result.valid).toBe(true);
    expect(result.overlap).toBeCloseTo(1 / 3, 10);
  });

  it('probabilities are in [0,1]', () => {
    const rho: [number, number, number, number] = [0.5, 0, 0, 0.5];
    const probs = sicPovmProbabilities(rho);
    expect(probs).toHaveLength(4);
    for (const p of probs) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  it('probabilities sum to 1 for any valid density matrix', () => {
    const matrices: [number, number, number, number][] = [
      [0.5, 0, 0, 0.5],
      [1, 0, 0, 0],
      [0.25, 0.25, 0.25, 0.75],
      [0.3, 0.1, 0.1, 0.7],
    ];
    for (const rho of matrices) {
      const probs = sicPovmProbabilities(rho);
      const sum = probs.reduce((s, p) => s + p, 0);
      expect(sum).toBeCloseTo(1, 10);
    }
  });
});
