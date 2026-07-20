/**
 * @file coherence.ts — Phase 3: Posner coherence model for the ship.
 *
 * ⚠️ HONEST LABEL
 * Binds the ship's engagement/attention signal to @p31/quantum-core's Posner
 * molecule state. The Posner molecule as a biological quantum-memory is a
 * CONTESTED hypothesis (Fisher 2015; Salari refutation). This module is an
 * architectural metaphor: user spoons + engagement produce a "coherence" value
 * (0..1) that gates UI behavior. No medical or scientific claims are made.
 *
 * High coherence  = user is focused/engaged → rich, exploratory UI.
 * Low coherence   = user is scattered/overwhelmed → simplified, calmer UI.
 *
 * Loop (ties to Phase 1 SIC-POVM state engine):
 *   user state → density matrix ρ → SIC-POVM → mode probabilities
 *   mode dispersion (entropy) + spoons → coherence (Posner)
 *   coherence → layout (Phase 4 morphogenetic field) + gating (Fawn Guard)
 */

import { createPosnerState, updatePosnerCoherence, type PosnerState } from '@p31/quantum-core/posner';

const clamp01 = (n: number): number => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

export interface CoherenceInput {
  /** Spoon level (energy), already normalized 0..1 by caller. */
  spoons01: number;
  /** Observed engagement 0..1 (connection/activity this session). */
  engagement01: number;
  /** Measurement dispersion from the SIC-POVM engine, 0=structured .. 1=uniform. */
  entropy: number;
}

/**
 * Map user state to a Posner coherence value (0..1).
 *
 * High spoons + high engagement + low dispersion (structured) → high coherence.
 * The Posner state is seeded from canonical createPosnerState() (coherence 0.5)
 * then nudged by the derived signal so downstream code uses the real molecule
 * type rather than a hand-rolled float.
 */
export function computePosnerCoherence(input: CoherenceInput): { coherence: number; state: PosnerState } {
  const { spoons01, engagement01, entropy } = input;
  // Energy and connection raise coherence; uniform dispersion (entropy) lowers it.
  const signal = clamp01(0.45 * spoons01 + 0.35 * engagement01 + 0.20 * (1 - entropy));
  const state = updatePosnerCoherence(createPosnerState(), signal - 0.5);
  return { coherence: state.coherence, state };
}

/**
 * Convenience: coherence from a 0..maxSpoons spoon count + engagement 0..10.
 */
export function spoonsToCoherence(spoons: number, maxSpoons: number, engagement = 0): number {
  const spoons01 = maxSpoons > 0 ? clamp01(spoons / maxSpoons) : 0;
  const engagement01 = clamp01(engagement / 10);
  return computePosnerCoherence({ spoons01, engagement01, entropy: 0 }).coherence;
}

/**
 * Layout-order factor for the MolecularField background.
 * High coherence → ordered (low chaos factor); low coherence → chaotic.
 * Returns a multiplier in roughly [0.5, 2.5] for drift/velocity scaling.
 */
export function fieldChaos(coherence: number): number {
  // coherence 1 → 0.5 (calm, ordered); coherence 0 → 2.5 (chaotic).
  return 0.5 + (1 - clamp01(coherence)) * 2.0;
}

/** Fawn-Guard severity threshold that triggers interception.
 *  Low coherence → intercept on 'mild'; high coherence → only 'moderate'+. */
export function fawnThreshold(coherence: number): 'mild' | 'moderate' | 'severe' {
  if (coherence < 0.35) return 'mild';
  if (coherence < 0.65) return 'moderate';
  return 'severe';
}
