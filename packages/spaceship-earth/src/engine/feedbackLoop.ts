/**
 * @file feedbackLoop.ts — Phase 5 self-adapting machine.
 *
 * The ring closes: measurement outcomes fold into a bounded EWMA memory, and
 * that memory modulates each subsequent SIC-POVM measurement via
 * applyFeedback (a monotone additive blend, influence-scaled). Repeated cycles
 * converge — they never diverge or NaN.
 *
 * ⚠️ Contested-science metaphor — asserts ENGINE behavior only.
 */
import { measureShipState, type UserState, type ShipMeasurement } from './stateEngine';

export interface FeedbackState {
  coherence: number;
  engagement: number;
  care: number;
  observations: number;
}

export interface Outcome {
  coherence?: number;
  engagement?: number;
  care?: number;
}

export interface FeedbackCycle {
  mode: ShipMeasurement;
  effective: UserState;
  feedback: FeedbackState;
}

const ALPHA = 0.15;

const finite01 = (v: number | undefined): number | undefined =>
  v === undefined || !Number.isFinite(v) ? undefined : Math.min(1, Math.max(0, v));

export function initFeedbackState(): FeedbackState {
  return { coherence: 0.5, engagement: 0, care: 0, observations: 0 };
}

/**
 * Fold an outcome into the EWMA memory. Present fields move toward the clamped
 * outcome value; absent / non-finite fields are left untouched. Every fold
 * increments the observation count.
 */
export function foldOutcome(fb: FeedbackState, outcome: Outcome): FeedbackState {
  const next: FeedbackState = { ...fb, observations: fb.observations + 1 };
  const co = finite01(outcome.coherence);
  const eg = finite01(outcome.engagement);
  const ca = finite01(outcome.care);
  if (co !== undefined) next.coherence = fb.coherence + ALPHA * (co - fb.coherence);
  if (eg !== undefined) next.engagement = fb.engagement + ALPHA * (eg - fb.engagement);
  if (ca !== undefined) next.care = fb.care + ALPHA * (ca - fb.care);
  return next;
}

/**
 * Blend the raw passport observables with the feedback memory. Spoons (the
 * ground-truth energy) are never touched by the loop.
 */
export function applyFeedback(raw: UserState, memory: FeedbackState, influence: number): UserState {
  const inf = Number.isFinite(influence) ? Math.min(1, Math.max(0, influence)) : 0;
  const engagement = Math.min(10, Math.max(0, (raw.engagement ?? 0) + inf * memory.engagement));
  const careScore = Math.min(100, Math.max(0, (raw.careScore ?? 0) + inf * memory.care));
  return { spoons: raw.spoons, careScore, engagement };
}

/**
 * One full cycle: apply memory, measure the effective state, fold the measured
 * coherence (1 − entropy) back into memory.
 */
export function runFeedbackCycle(raw: UserState, fb: FeedbackState): FeedbackCycle {
  const effective = applyFeedback(raw, fb, 0.5);
  const mode = measureShipState(effective);
  const feedback = foldOutcome(fb, { coherence: 1 - mode.entropy });
  return { mode, effective, feedback };
}
