/**
 * @file feedbackLoop.test.ts — Phase 5 self-adapting machine.
 *
 * Validates the ring closes: outcomes fold into bounded memory, memory
 * modulates the effective SIC-POVM inputs, and repeated cycles converge
 * (never diverge / NaN). ⚠️ Contested-science metaphor — asserts ENGINE
 * behavior only, no medical/scientific claims.
 */
import { describe, it, expect } from 'vitest';
import {
  initFeedbackState,
  foldOutcome,
  applyFeedback,
  runFeedbackCycle,
  type FeedbackState,
} from '../engine/feedbackLoop';
import type { UserState } from '../engine/stateEngine';

const raw: UserState = { spoons: 3, careScore: 40, engagement: 2 };

describe('initFeedbackState', () => {
  it('starts neutral and bounded', () => {
    const f = initFeedbackState();
    expect(f.engagement).toBe(0);
    expect(f.coherence).toBe(0.5);
    expect(f.care).toBe(0);
    expect(f.observations).toBe(0);
  });
});

describe('foldOutcome', () => {
  it('moves the running average toward the outcome (EWMA) and stays in [0,1]', () => {
    let f = initFeedbackState();
    f = foldOutcome(f, { engagement: 1 });
    expect(f.engagement).toBeGreaterThan(0);
    expect(f.engagement).toBeLessThan(1);
    expect(f.observations).toBe(1);
  });

  it('converges toward a sustained outcome without overshoot', () => {
    let f = initFeedbackState();
    for (let i = 0; i < 50; i++) f = foldOutcome(f, { engagement: 1 });
    expect(f.engagement).toBeGreaterThan(0.9);
    expect(f.engagement).toBeLessThanOrEqual(1);
  });

  it('only updates present fields', () => {
    const f0 = initFeedbackState();
    const f1 = foldOutcome(f0, { care: 0.8 });
    expect(f1.care).toBeGreaterThan(0);
    expect(f1.engagement).toBe(f0.engagement);
  });

  it('clamps out-of-range and non-finite outcomes', () => {
    const f = foldOutcome(initFeedbackState(), { engagement: 99, care: NaN });
    expect(f.engagement).toBeGreaterThanOrEqual(0);
    expect(f.engagement).toBeLessThanOrEqual(1);
    expect(Number.isFinite(f.care)).toBe(true);
  });
});

describe('applyFeedback', () => {
  it('leaves spoons (ground-truth energy) untouched', () => {
    const memory: FeedbackState = { engagement: 1, coherence: 1, care: 1, observations: 10 };
    const eff = applyFeedback(raw, memory, 0.5);
    expect(eff.spoons).toBe(raw.spoons);
  });

  it('pulls engagement/care toward memory as influence rises', () => {
    const memory: FeedbackState = { engagement: 1, coherence: 1, care: 1, observations: 10 };
    const none = applyFeedback(raw, memory, 0);
    const full = applyFeedback(raw, memory, 1);
    expect(none.engagement).toBeCloseTo(raw.engagement, 6);
    expect(full.engagement).toBeGreaterThan(none.engagement);
    expect(full.careScore).toBeGreaterThan(none.careScore);
  });

  it('never produces NaN', () => {
    const eff = applyFeedback(raw, initFeedbackState(), 0.5);
    expect(Number.isFinite(eff.careScore)).toBe(true);
    expect(Number.isFinite(eff.engagement)).toBe(true);
  });
});

describe('runFeedbackCycle', () => {
  it('returns a valid measurement, effective state, and advanced memory', () => {
    const c = runFeedbackCycle(raw, initFeedbackState());
    const sum = Object.values(c.mode.probabilities).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 6);
    expect(c.feedback.observations).toBe(1);
    expect(Number.isFinite(c.effective.careScore)).toBe(true);
  });

  it('is a closed loop: coherence memory converges to the measured coherence', () => {
    // Honest engine behavior (verified): entropy falls as engagement rises and
    // SATURATES at 0.5 for engagement >= 5. A low-engagement state measures a
    // high entropy (~1), so the folded coherence (1 - H ~ 0.06) is far from the
    // 0.5 seed. Over cycles the coherence memory should converge toward that
    // measured value — proving the ring feeds itself rather than sitting inert.
    let f = initFeedbackState();
    const state: UserState = { spoons: 3, careScore: 40, engagement: 2 };
    const measured = 1 - runFeedbackCycle(state, initFeedbackState()).mode.entropy;
    for (let i = 0; i < 40; i++) {
      f = runFeedbackCycle(state, f).feedback;
    }
    // Memory has left the neutral seed and settled near the measured coherence.
    expect(f.coherence).not.toBeCloseTo(0.5, 2);
    expect(f.coherence).toBeCloseTo(measured, 2);
  });

  it('sustained engagement outcomes (via foldOutcome) do shift effective state', () => {
    // Engagement is reinforced through explicit outcomes (store setEngagement /
    // recordOutcome), not the coherence-only cycle. Verify that path closes too.
    let f = initFeedbackState();
    const before = applyFeedback(raw, f, 0.5).engagement;
    for (let i = 0; i < 20; i++) f = foldOutcome(f, { engagement: 0.9 });
    const after = applyFeedback(raw, f, 0.5).engagement;
    expect(after).toBeGreaterThan(before);
  });

  it('converges (bounded, no divergence) over many cycles', () => {
    let f = initFeedbackState();
    for (let i = 0; i < 200; i++) {
      const c = runFeedbackCycle(raw, f);
      f = c.feedback;
      expect(f.coherence).toBeGreaterThanOrEqual(0);
      expect(f.coherence).toBeLessThanOrEqual(1);
      expect(Number.isFinite(c.mode.entropy)).toBe(true);
    }
  });
});
