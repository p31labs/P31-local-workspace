/**
 * @file feedbackLoop.ts — Phase 5: close the ring.
 *
 * ⚠️ HONEST LABEL
 * Contested-science metaphor made literal (see stateEngine.ts / sicPovm.ts).
 * No medical or scientific claims.
 *
 * Phases 1–4 built four engines that were each (mostly) a pure function of the
 * current spoon reading. This module turns them into ONE self-adapting machine
 * by feeding observed OUTCOMES back into the SIC-POVM density-matrix inputs:
 *
 *      measureShipState(ρ) ──▶ mode probabilities  (Phase 1)
 *                │                     │
 *                │             user acts on the ship
 *                │        (transmits, coherence, care accrues)
 *                ▼                     ▼
 *        ┌───────────────── FeedbackState (EWMA memory) ◀──┐
 *        │  running engagement / coherence / care          │
 *        └──▶ modulates the NEXT ρ inputs ─────────────────┘
 *
 * The feedback is a bounded exponential-moving-average: a single event nudges
 * the running state; sustained events accumulate. This makes ρ evolve over the
 * session instead of snapping to whatever the spoon slider says. The machine
 * "remembers" that the user has been connecting, and biases the SIC-POVM
 * off-diagonal (connection) + well-being axis accordingly.
 */

import { measureShipState, type ModeState, type UserState } from './stateEngine';

/** Running, bounded memory of observed outcomes. All fields normalized 0..1. */
export interface FeedbackState {
  /** EWMA of engagement outcomes (transmissions, interactions). */
  engagement: number;
  /** EWMA of measured Posner coherence. */
  coherence: number;
  /** EWMA of accrued care (Proof-of-Care outcomes). */
  care: number;
  /** How many observations have folded in (for diagnostics). */
  observations: number;
}

/** A fresh feedback state — neutral memory at session start. */
export function initFeedbackState(): FeedbackState {
  return { engagement: 0, coherence: 0.5, care: 0, observations: 0 };
}

const clamp01 = (n: number): number => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

/**
 * A single observed outcome from the ship this cycle. Any field may be omitted;
 * only present fields update their running average.
 */
export interface Outcome {
  /** Instant engagement 0..1 (e.g. a transmission just happened). */
  engagement?: number;
  /** Instant coherence 0..1 (from computePosnerCoherence). */
  coherence?: number;
  /** Instant care 0..1 (careScore/100). */
  care?: number;
}

/**
 * Fold an outcome into the running feedback state via EWMA.
 * `alpha` is the learning rate (0..1): higher = more reactive, lower = more
 * memory. Default 0.25 gives a smooth but responsive loop.
 */
export function foldOutcome(
  prev: FeedbackState,
  outcome: Outcome,
  alpha = 0.25,
): FeedbackState {
  const a = clamp01(alpha);
  const ewma = (running: number, next?: number): number =>
    next === undefined ? running : clamp01(running * (1 - a) + clamp01(next) * a);

  return {
    engagement: ewma(prev.engagement, outcome.engagement),
    coherence: ewma(prev.coherence, outcome.coherence),
    care: ewma(prev.care, outcome.care),
    observations: prev.observations + 1,
  };
}

/**
 * Blend raw (instant) user state with the running feedback memory to produce
 * the EFFECTIVE UserState fed into the SIC-POVM. This is where the loop closes:
 * the density matrix inputs are no longer pure functions of the current spoon
 * reading — sustained engagement/care bias them.
 *
 * @param raw       instant observation (spoons 0..5, careScore 0..100, engagement 0..10)
 * @param feedback  running memory
 * @param influence how strongly memory pulls the inputs (0 = ignore memory,
 *                  1 = memory fully dominates). Default 0.5.
 */
export function applyFeedback(
  raw: UserState,
  feedback: FeedbackState,
  influence = 0.5,
): UserState {
  const w = clamp01(influence);
  // Convert running memory (0..1) back onto each input's native scale, then
  // blend toward it. Engagement memory also lifts care (connection → well-being).
  const memEngagement10 = feedback.engagement * 10;
  const memCare100 = Math.max(feedback.care, feedback.engagement * 0.6) * 100;

  return {
    // Spoons are ground-truth energy — memory should not fabricate energy the
    // user doesn't have, so spoons pass through untouched.
    spoons: raw.spoons,
    careScore: raw.careScore * (1 - w) + memCare100 * w,
    engagement: raw.engagement * (1 - w) + memEngagement10 * w,
  };
}

/** Result of one full feedback cycle. */
export interface FeedbackCycle {
  /** The measurement produced this cycle (from the feedback-blended ρ). */
  mode: ModeState;
  /** The effective (blended) state that was measured. */
  effective: UserState;
  /** The updated running feedback memory (fold this cycle's coherence back in). */
  feedback: FeedbackState;
}

/**
 * Run one full cycle of the self-adapting machine:
 *   1. blend raw state with memory  → effective state
 *   2. measure the effective state via SIC-POVM (Phase 1)
 *   3. fold this cycle's measured coherence back into memory (ring closes)
 *
 * The returned `feedback` should be persisted and passed into the next cycle.
 */
export function runFeedbackCycle(
  raw: UserState,
  feedback: FeedbackState,
  opts: { influence?: number; alpha?: number } = {},
): FeedbackCycle {
  const effective = applyFeedback(raw, feedback, opts.influence);
  const mode = measureShipState(effective);

  // The measurement's own dispersion is an outcome: low entropy = a structured
  // (coherent) state. Fold (1 - entropy) back in as this cycle's coherence so
  // the loop reinforces coherent states over the session.
  const next = foldOutcome(feedback, { coherence: 1 - mode.entropy }, opts.alpha);

  return { mode, effective, feedback: next };
}
