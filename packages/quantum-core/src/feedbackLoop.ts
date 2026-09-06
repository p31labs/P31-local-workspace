/**
 * @p31/quantum-core/src/feedbackLoop.ts — Phase 5: close the ring.
 *
 * ⚠️ HONEST LABEL
 * Contested-science metaphor made literal (see sicPovm.ts, morphogeneticField.ts).
 * No medical or scientific claims.
 *
 * This module turns four isolated engines (SIC-POVM measurement, K₄ skeleton,
 * Posner coherence, morphogenetic layout) into ONE self-adapting machine by
 * feeding observed OUTCOMES back into the SIC-POVM density-matrix inputs:
 *
 *      measureShipState(ρ) ──▶ mode probabilities  (Phase 1)
 *                │                     │
 *                │             user acts on the surface
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
 *
 * Extracted from packages/spaceship-earth/src/engine/feedbackLoop.ts (Phase 5).
 */

import { sicPovmProbabilities } from './sicPovm';

// ---------------------------------------------------------------------------
// Types — minimal state engine (self-contained, no spaceship-earth dep)
// ---------------------------------------------------------------------------

/** A 2×2 density matrix flattened row-major: [r00, r01, r10, r11]. */
export type DensityMatrix = [number, number, number, number];

/**
 * Raw observable inputs. Normalized by the caller; re-clamped defensively.
 */
export interface UserState {
  /** Spoon level 0..5 (energy). */
  spoons: number;
  /** Care score 0..100 (well-being). */
  careScore: number;
  /** Engagement 0..10 (connection / activity this session). */
  engagement: number;
}

/** The four SIC-POVM outcomes mapped to ship modes. */
export type ShipMode = 'explore' | 'create' | 'connect' | 'reflect';

export const SHIP_MODES: readonly ShipMode[] = [
  'explore',
  'create',
  'connect',
  'reflect',
] as const;

/**
 * Measurement result from the SIC-POVM. The ship is always a BLEND of the
 * four modes — probabilities sum to ~1, never a single toggle.
 */
export interface ModeState {
  /** Probability of each mode, sums to ~1, each in [0,1]. */
  probabilities: Record<ShipMode, number>;
  /** The dominant mode (argmax). */
  dominant: ShipMode;
  /** Measurement dispersion (0 = structured, 1 = uniform/scattered).
   *  Used downstream as a coherence proxy: low entropy = coherent state. */
  entropy: number;
  /** Raw density matrix used (for debugging / downstream phases). */
  rho: DensityMatrix;
}

// ---------------------------------------------------------------------------
// SIC-POVM measurement — minimal ship state engine
// ---------------------------------------------------------------------------

const clamp01 = (n: number): number =>
  Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;

/**
 * Encode user state as a 2×2 density matrix (metaphorical mapping).
 *
 *   r00 = energy     = spoons / 5
 *   r11 = well-being = careScore / 100
 *   r01 = r10 = connection / 10
 *
 * This is NOT a physical density matrix — it is a normalized state vector for
 * the SIC-POVM measurement primitive. Diagonal dominance (r00+r11 ≈ 1) keeps
 * the measurement well-behaved; off-diagonal terms encode "connection."
 */
export function passportToDensityMatrix(state: UserState): DensityMatrix {
  const r00 = clamp01(state.spoons / 5);
  const r11 = clamp01(state.careScore / 100);
  const off = clamp01(state.engagement / 10);
  return [r00, off, off, r11];
}

/**
 * Measure the user state via the SIC-POVM. Returns the four mode probabilities
 * plus derived coherence metadata used by later phases (Posner coherence, etc).
 *
 * sicPovmProbabilities returns sub-normalized projectors (each (1/d)|ψ⟩⟨ψ|);
 * we normalize to a proper distribution so the four ship modes blend as a
 * superposition that sums to 1.
 */
export function measureShipState(state: UserState): ModeState {
  const rho = passportToDensityMatrix(state);
  const raw = sicPovmProbabilities(rho);

  const total = raw.reduce((a, b) => a + b, 0) || 1;
  const probs = raw.map((p) => p / total);

  const probabilities: Record<ShipMode, number> = {
    explore: probs[0] ?? 0,
    create: probs[1] ?? 0,
    connect: probs[2] ?? 0,
    reflect: probs[3] ?? 0,
  };

  let dominant: ShipMode = 'explore';
  let max = -Infinity;
  for (const mode of SHIP_MODES) {
    if (probabilities[mode] > max) {
      max = probabilities[mode];
      dominant = mode;
    }
  }

  return {
    probabilities,
    dominant,
    entropy: vonNeumannEntropy(probs),
    rho,
  };
}

/**
 * Von Neumann entropy of the measurement outcomes, treated as a classical
 * probability distribution over the 4 SIC-POVM outcomes. 0 = one outcome
 * dominates (structured), 1 = uniform blend (max dispersion). Used downstream
 * as a coherence proxy: for this implementation, a connection (off-diagonal)
 * signal lowers entropy.
 */
export function vonNeumannEntropy(probs: number[]): number {
  let h = 0;
  for (const p of probs) {
    if (p > 0) h -= p * Math.log2(p);
  }
  // Normalize by log2(4) so the result is in [0,1].
  return clamp01(h / 2);
}

/**
 * Self-check: confirms the canonical SIC-POVM invariant (overlap = 1/3) holds
 * for the math we bind to. Returns the verification result for diagnostics.
 */
export async function verifyStateEngine(): Promise<{ valid: boolean; overlap: number }> {
  const { verifySicPovm } = await import('./sicPovm.js');
  return verifySicPovm();
}

// ---------------------------------------------------------------------------
// Feedback loop — EWMA memory + closed ring
// ---------------------------------------------------------------------------

/**
 * Running, bounded memory of observed outcomes. All fields normalized 0..1.
 */
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

/**
 * A single observed outcome from the surface this cycle. Any field may be
 * omitted; only present fields update their running average.
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
