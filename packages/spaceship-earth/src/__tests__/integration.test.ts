/**
 * @file integration.test.ts — Cross-phase integration ("the whole ring").
 *
 * ⚠️ HONEST LABEL
 * Contested-science metaphor made literal (see stateEngine.ts / sicPovm.ts).
 * No medical or scientific claims. This test asserts that the five engines
 * compose into ONE self-adapting machine — that a real spoons→transmit→
 * re-measure cycle moves state through every phase, end to end.
 *
 *   Phase 1  SIC-POVM state       (useSovereignStore.measureState)
 *   Phase 2  K₄ skeleton          (buildShipK4)
 *   Phase 3  Posner coherence     (computePosnerCoherence)
 *   Phase 4  Morphogenetic layout (computeLayoutField)
 *   Phase 5  Feedback loop        (store.feedback / recordOutcome)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useSovereignStore } from '../sovereign/useSovereignStore';
import { initFeedbackState } from '../engine/feedbackLoop';
import { buildShipK4, meshHealth } from '../engine/k4Binding';
import { computePosnerCoherence } from '../engine/coherence';
import { computeLayoutField } from '../engine/layoutField';

/** Reset the store slices this test touches to a known baseline. */
function resetShip() {
  useSovereignStore.setState({
    spoons: 8,
    maxSpoons: 12,
    love: 30,
    engagement: 0,
    relayPing: 40,
    didKey: 'did:key:zIntegrationTest',
    feedback: initFeedbackState(),
    modeProbabilities: { explore: 0.25, create: 0.25, connect: 0.25, reflect: 0.25 },
    modeDominant: 'explore',
    modeEntropy: 1,
  });
}

describe('cross-phase integration: the whole ring moves', () => {
  beforeEach(resetShip);

  it('Phase 1: measureState produces a normalized superposition from observables', () => {
    useSovereignStore.getState().measureState();
    const s = useSovereignStore.getState();
    const sum = Object.values(s.modeProbabilities).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 6);
    expect(s.modeEntropy).toBeGreaterThanOrEqual(0);
    expect(s.modeEntropy).toBeLessThanOrEqual(1);
  });

  it('Phase 5: a transmit cycle folds outcomes into feedback memory', () => {
    const before = useSovereignStore.getState().feedback.observations;
    // Simulate the App transmit handler: record coherence, raise engagement.
    const coherence = computePosnerCoherence({ spoons01: 8 / 12, engagement01: 0, entropy: 1 }).coherence;
    useSovereignStore.getState().recordOutcome({ coherence });
    useSovereignStore.getState().setEngagement(1);
    const after = useSovereignStore.getState().feedback;
    expect(after.observations).toBeGreaterThan(before);
    expect(after.engagement).toBeGreaterThan(0);
  });

  it('sustained engagement shifts the measured state over the session', () => {
    useSovereignStore.getState().measureState();
    const entropy0 = useSovereignStore.getState().modeEntropy;

    // Drive many transmit cycles: each raises engagement + re-measures.
    for (let i = 0; i < 8; i++) {
      const st = useSovereignStore.getState();
      st.recordOutcome({ coherence: 0.9 });
      st.setEngagement(Math.min(10, st.engagement + 1));
    }

    const s = useSovereignStore.getState();
    // The machine remembers connection: memory populated and state has moved.
    expect(s.feedback.engagement).toBeGreaterThan(0);
    expect(s.modeEntropy).not.toBeCloseTo(entropy0, 5);
  });

  it('spoons drop → energy falls → Phase 1 measurement responds', () => {
    // Honest engine property (verified): a pure-diagonal ρ (engagement 0)
    // measures UNIFORMLY (0.25 each) regardless of spoons — energy only shapes
    // the distribution once a connection signal (off-diagonal) is present. So
    // seed engagement, then vary spoons: the measured blend must diverge.
    useSovereignStore.setState({ spoons: 10, engagement: 3 });
    useSovereignStore.getState().measureState();
    const hi = { ...useSovereignStore.getState().modeProbabilities };

    useSovereignStore.setState({ spoons: 1, engagement: 3, feedback: initFeedbackState() });
    useSovereignStore.getState().measureState();
    const lo = { ...useSovereignStore.getState().modeProbabilities };

    // Different energy → different measured distribution (the ring is live).
    expect(hi.explore).not.toBeCloseTo(lo.explore, 3);
  });

  it('Phase 2+3+4 read consistently from the same live ship state', () => {
    const s = useSovereignStore.getState();

    // Phase 2: K₄ from relay ping + spoon-derived activity.
    const energy = s.spoons / s.maxSpoons;
    const k4 = buildShipK4(
      { cockpit: { activity: 0.6 }, kids: { activity: 0.3 }, game: { activity: 0.4 }, ledger: { activity: energy } },
      s.relayPing,
    );
    expect(meshHealth(k4)).toBeGreaterThan(0);

    // Phase 3: coherence from the same spoons/engagement/entropy.
    const { coherence } = computePosnerCoherence({
      spoons01: energy,
      engagement01: s.engagement / 10,
      entropy: s.modeEntropy,
    });
    expect(coherence).toBeGreaterThanOrEqual(0);
    expect(coherence).toBeLessThanOrEqual(1);

    // Phase 4: layout from the same passport + spoons.
    const layout = computeLayoutField({
      passportSeed: s.didKey,
      spoons: s.spoons,
      maxSpoons: s.maxSpoons,
      sessionSeconds: 0,
    });
    expect(Number.isFinite(layout.panels.status.x)).toBe(true);
    expect(layout.layers.length).toBeGreaterThan(0);
  });

  it('the full loop stays bounded and finite across many cycles', () => {
    for (let i = 0; i < 100; i++) {
      const st = useSovereignStore.getState();
      st.recordOutcome({ coherence: (i % 5) / 4, care: (i % 3) / 2 });
      st.setEngagement((i % 10));
      const s = useSovereignStore.getState();
      expect(Number.isFinite(s.modeEntropy)).toBe(true);
      expect(s.feedback.coherence).toBeGreaterThanOrEqual(0);
      expect(s.feedback.coherence).toBeLessThanOrEqual(1);
      const sum = Object.values(s.modeProbabilities).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 6);
    }
  });
});
