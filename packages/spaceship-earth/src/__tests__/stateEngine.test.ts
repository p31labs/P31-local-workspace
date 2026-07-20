/**
 * @file stateEngine.test.ts — Phase 1 SIC-POVM state engine.
 *
 * Validates: the canonical SIC-POVM invariant (overlap = 1/3), the density-matrix
 * mapping, probability bounds/sum, mode dominance, and entropy as a coherence proxy.
 * All math is the contested-science metaphor from @p31/quantum-core — these tests
 * assert the ENGINE behavior, not any physical claim.
 */
import { describe, it, expect } from 'vitest';
import {
  passportToDensityMatrix,
  measureShipState,
  vonNeumannEntropy,
  verifyStateEngine,
  SHIP_MODES,
} from '../engine/stateEngine';

describe('SIC-POVM invariant', () => {
  it('verifies overlap = 1/3 (canonical qubit SIC-POVM)', () => {
    const { valid, overlap } = verifyStateEngine();
    expect(valid).toBe(true);
    expect(overlap).toBeCloseTo(1 / 3, 9);
  });
});

describe('passportToDensityMatrix', () => {
  it('maps spoons -> r00 and careScore -> r11', () => {
    const rho = passportToDensityMatrix({ spoons: 5, careScore: 100, engagement: 0 });
    // Full energy + full well-being, no connection => [1,0,0,1]
    expect(rho[0]).toBeCloseTo(1, 6);
    expect(rho[3]).toBeCloseTo(1, 6);
    expect(rho[1]).toBeCloseTo(0, 6);
  });

  it('encodes engagement in the off-diagonal terms', () => {
    const rho = passportToDensityMatrix({ spoons: 2.5, careScore: 50, engagement: 10 });
    expect(rho[1]).toBeCloseTo(1, 6);
    expect(rho[2]).toBeCloseTo(1, 6);
  });

  it('clamps out-of-range inputs defensively', () => {
    const rho = passportToDensityMatrix({ spoons: 99, careScore: -50, engagement: -10 });
    for (const v of rho) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('handles NaN safely', () => {
    const rho = passportToDensityMatrix({ spoons: NaN, careScore: NaN, engagement: NaN });
    for (const v of rho) expect(Number.isFinite(v)).toBe(true);
  });
});

describe('measureShipState', () => {
  it('returns four bounded probabilities that sum to ~1', () => {
    const m = measureShipState({ spoons: 4, careScore: 60, engagement: 5 });
    const sum = SHIP_MODES.reduce((acc, mode) => acc + m.probabilities[mode], 0);
    expect(sum).toBeCloseTo(1, 6);
    for (const mode of SHIP_MODES) {
      expect(m.probabilities[mode]).toBeGreaterThanOrEqual(0);
      expect(m.probabilities[mode]).toBeLessThanOrEqual(1);
    }
  });

  it('reports a dominant mode', () => {
    const m = measureShipState({ spoons: 5, careScore: 100, engagement: 0 });
    expect(SHIP_MODES).toContain(m.dominant);
  });

  it('entropy reflects measurement dispersion: connection signal lowers it', () => {
    // Pure single-axis state (only energy) => SIC-POVM returns uniform => max dispersion.
    const pure = measureShipState({ spoons: 5, careScore: 0, engagement: 0 });
    // Strong connection (off-diagonal) differentiates the measurement => lower dispersion.
    const connected = measureShipState({ spoons: 5, careScore: 100, engagement: 10 });
    expect(pure.entropy).toBeCloseTo(1, 6);
    expect(connected.entropy).toBeLessThan(pure.entropy);
    expect(connected.entropy).toBeGreaterThanOrEqual(0);
    expect(connected.entropy).toBeLessThanOrEqual(1);
  });
});

describe('vonNeumannEntropy (coherence proxy)', () => {
  it('is 0 for a single focused mode (delta = perfect coherence)', () => {
    const e = vonNeumannEntropy([1, 0, 0, 0]);
    expect(e).toBeCloseTo(0, 6);
  });

  it('is 1 for a perfectly scattered blend', () => {
    const e = vonNeumannEntropy([0.25, 0.25, 0.25, 0.25]);
    expect(e).toBeCloseTo(1, 6);
  });

  it('is in [0,1] for mixed states', () => {
    const e = vonNeumannEntropy([0.6, 0.1, 0.2, 0.1]);
    expect(e).toBeGreaterThanOrEqual(0);
    expect(e).toBeLessThanOrEqual(1);
  });
});
