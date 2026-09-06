import { describe, it, expect } from 'vitest';
import {
  initFeedbackState,
  foldOutcome,
  applyFeedback,
  runFeedbackCycle,
  measureShipState,
  passportToDensityMatrix,
  vonNeumannEntropy,
  SHIP_MODES,
  type FeedbackState,
  type Outcome,
  type FeedbackCycle,
} from '../src/feedbackLoop';

describe('passportToDensityMatrix', () => {
  it('maps spoons/care/engagement to density matrix', () => {
    const rho = passportToDensityMatrix({ spoons: 3, careScore: 50, engagement: 5 });
    expect(rho[0]).toBeCloseTo(0.6);  // 3/5
    expect(rho[1]).toBeCloseTo(0.5);  // 5/10
    expect(rho[2]).toBeCloseTo(0.5);  // 5/10
    expect(rho[3]).toBeCloseTo(0.5);  // 50/100
  });
});

describe('vonNeumannEntropy', () => {
  it('returns 0 for pure state', () => {
    expect(vonNeumannEntropy([1, 0, 0, 0])).toBeCloseTo(0);
  });

  it('returns 1 for uniform distribution', () => {
    expect(vonNeumannEntropy([0.25, 0.25, 0.25, 0.25])).toBeCloseTo(1);
  });
});

describe('measureShipState', () => {
  it('returns probabilities that sum to ~1', () => {
    const state = measureShipState({ spoons: 3, careScore: 50, engagement: 5 });
    const sum = Object.values(state.probabilities).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });

  it('identifies a dominant mode', () => {
    const state = measureShipState({ spoons: 4, careScore: 80, engagement: 8 });
    expect(SHIP_MODES).toContain(state.dominant);
    expect(state.entropy).toBeGreaterThanOrEqual(0);
    expect(state.entropy).toBeLessThanOrEqual(1);
  });

  it('produces valid rho', () => {
    const state = measureShipState({ spoons: 2, careScore: 30, engagement: 3 });
    expect(state.rho).toHaveLength(4);
    state.rho.forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
  });
});

describe('initFeedbackState', () => {
  it('returns neutral initial state', () => {
    const fs = initFeedbackState();
    expect(fs.engagement).toBe(0);
    expect(fs.coherence).toBe(0.5);
    expect(fs.care).toBe(0);
    expect(fs.observations).toBe(0);
  });
});

describe('foldOutcome', () => {
  it('updates engagement with alpha blending', () => {
    const prev: FeedbackState = { engagement: 0, coherence: 0.5, care: 0, observations: 0 };
    const next = foldOutcome(prev, { engagement: 1 }, 0.25);
    expect(next.engagement).toBeCloseTo(0.25);
    expect(next.observations).toBe(1);
  });

  it('preserves fields not in the outcome', () => {
    const prev: FeedbackState = { engagement: 0.5, coherence: 0.8, care: 0.3, observations: 2 };
    const next = foldOutcome(prev, { care: 0.9 });
    expect(next.engagement).toBeCloseTo(0.5);
    expect(next.coherence).toBeCloseTo(0.8);
    expect(next.care).toBeCloseTo(0.45); // 0.3*0.75 + 0.9*0.25
    expect(next.observations).toBe(3);
  });
});

describe('applyFeedback', () => {
  it('blends raw state with feedback memory', () => {
    const raw = { spoons: 3, careScore: 50, engagement: 5 };
    const feedback: FeedbackState = { engagement: 0.8, coherence: 0.9, care: 0.7, observations: 5 };
    const effective = applyFeedback(raw, feedback, 0.5);
    // careScore should be blended: 50 * 0.5 + 70 * 0.5 = 60
    expect(effective.careScore).toBeCloseTo(60);
    // spoons pass through untouched
    expect(effective.spoons).toBe(3);
  });
});

describe('runFeedbackCycle', () => {
  it('returns a complete feedback cycle', () => {
    const raw = { spoons: 3, careScore: 50, engagement: 5 };
    const feedback = initFeedbackState();
    const cycle = runFeedbackCycle(raw, feedback);
    expect(cycle.mode.dominant).toBeDefined();
    expect(cycle.effective.spoons).toBe(3);
    expect(cycle.feedback.observations).toBe(1);
    expect(cycle.feedback.coherence).toBeGreaterThan(0);
  });

  it('accumulates observations across cycles', () => {
    let feedback = initFeedbackState();
    const raw = { spoons: 3, careScore: 50, engagement: 5 };
    for (let i = 0; i < 10; i++) {
      const cycle = runFeedbackCycle(raw, feedback);
      feedback = cycle.feedback;
    }
    expect(feedback.observations).toBe(10);
  });
});
