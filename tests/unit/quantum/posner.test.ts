import { describe, it, expect } from 'vitest';
import {
  posnerAtoms,
  createPosnerState,
  updatePosnerCoherence,
  CA_POSITIONS,
  P_POSITIONS,
  TOTAL_ATOMS,
  bondThreshold,
  posnerBondLengths,
} from '../../../packages/quantum-core/src/posner';

describe('Posner molecule', () => {
  it('has correct atom counts', () => {
    const atoms = posnerAtoms();
    expect(atoms.length).toBe(TOTAL_ATOMS);
    expect(atoms.filter((a) => a.element === 'Ca')).toHaveLength(9);
    expect(atoms.filter((a) => a.element === 'P')).toHaveLength(6);
  });

  it('Ca positions are 9 unique triplets', () => {
    expect(CA_POSITIONS).toHaveLength(9);
    const uniq = new Set(CA_POSITIONS.map((p) => p.join(',')));
    expect(uniq.size).toBe(9);
  });

  it('P positions are 6 unique triplets', () => {
    expect(P_POSITIONS).toHaveLength(6);
  });

  it('creates state with entanglement pairs', () => {
    const state = createPosnerState();
    expect(state.coherence).toBe(0.5);
    expect(state.entanglementPairs.length).toBeGreaterThan(0);
    expect(state.lastUpdate).toBeGreaterThan(0);
  });

  it('updates coherence with clamping', () => {
    const state = createPosnerState();
    const updated = updatePosnerCoherence(state, 0.3);
    expect(updated.coherence).toBeCloseTo(0.8);
    const clamped = updatePosnerCoherence(state, 2);
    expect(clamped.coherence).toBe(1);
    const negative = updatePosnerCoherence(state, -10);
    expect(negative.coherence).toBe(0);
  });

  it('bond threshold is positive', () => {
    expect(bondThreshold()).toBeGreaterThan(0);
  });

  it('bond lengths are all positive', () => {
    const lengths = posnerBondLengths();
    expect(lengths.length).toBeGreaterThan(0);
    for (const l of lengths) {
      expect(l).toBeGreaterThan(0);
    }
  });
});
