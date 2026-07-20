/**
 * @file coherence.test.ts — Phase 3 Posner coherence model.
 *
 * Validates: coherence mapping from spoons/engagement/entropy, monotonic
 * energy response, field chaos scaling, and the Fawn-Guard coherence gate.
 * All math is the contested-science metaphor from @p31/quantum-core — these
 * tests assert ENGINE behavior, not any physical claim.
 */
import { describe, it, expect } from 'vitest';
import {
  computePosnerCoherence,
  spoonsToCoherence,
  fieldChaos,
  fawnThreshold,
} from '../engine/coherence';
import { FawnGuard } from '../lib/engine/fawn';

describe('computePosnerCoherence', () => {
  it('returns coherence in [0,1] and a valid PosnerState', () => {
    const { coherence, state } = computePosnerCoherence({
      spoons01: 0.8,
      engagement01: 0.5,
      entropy: 0.2,
    });
    expect(coherence).toBeGreaterThanOrEqual(0);
    expect(coherence).toBeLessThanOrEqual(1);
    expect(state.coherence).toBeCloseTo(coherence, 6);
    expect(Array.isArray(state.entanglementPairs)).toBe(true);
  });

  it('higher spoons raise coherence (monotonic in energy)', () => {
    const low = computePosnerCoherence({ spoons01: 0.1, engagement01: 0, entropy: 0 }).coherence;
    const high = computePosnerCoherence({ spoons01: 1, engagement01: 0, entropy: 0 }).coherence;
    expect(high).toBeGreaterThan(low);
  });

  it('higher dispersion (entropy) lowers coherence', () => {
    const focused = computePosnerCoherence({ spoons01: 0.8, engagement01: 0.5, entropy: 0 }).coherence;
    const scattered = computePosnerCoherence({ spoons01: 0.8, engagement01: 0.5, entropy: 1 }).coherence;
    expect(scattered).toBeLessThan(focused);
  });

  it('spoonsToCoherence normalizes the spoon scale', () => {
    const c = spoonsToCoherence(6, 12, 0);
    expect(c).toBeGreaterThan(0);
    expect(c).toBeLessThanOrEqual(1);
    // Full spoons => higher coherence than zero spoons.
    expect(spoonsToCoherence(12, 12, 0)).toBeGreaterThan(spoonsToCoherence(0, 12, 0));
  });
});

describe('fieldChaos', () => {
  it('is calm (low) at high coherence and chaotic (high) at low coherence', () => {
    expect(fieldChaos(1)).toBeLessThan(fieldChaos(0));
    expect(fieldChaos(1)).toBeCloseTo(0.5, 6);
    expect(fieldChaos(0)).toBeCloseTo(2.5, 6);
  });
});

describe('Fawn-Guard coherence gate', () => {
  const fawnText = 'I am so sorry, if it is okay, I just thought I would ask';

  it('intercepts mild fawn language when coherence is low', () => {
    const r = FawnGuard.gate(fawnText, fawnThreshold(0.2));
    expect(r.triggered).toBe(true);
  });

  it('lets mild signals through when coherence is high', () => {
    const r = FawnGuard.gate(fawnText, fawnThreshold(0.9));
    expect(r.triggered).toBe(false);
  });

  it('threshold tightens as coherence rises', () => {
    expect(fawnThreshold(0.2)).toBe('mild');
    expect(fawnThreshold(0.5)).toBe('moderate');
    expect(fawnThreshold(0.9)).toBe('severe');
  });
});
