/**
 * @file stateEngine.ts — SIC-POVM state engine for Spaceship Earth.
 *
 * ⚠️ HONEST LABEL
 * This binds the ship's UI adaptation to @p31/quantum-core's SIC-POVM math.
 * The underlying science (SIC-POVM as a biological/psychological measurement)
 * is a CONTESTED metaphor, not established science. This module is an
 * architectural metaphor made literal: the user's cognitive state is encoded
 * as a density matrix, "measured" by the SIC-POVM, yielding four outcome
 * probabilities that drive a continuous blend of ship modes. No medical or
 * scientific claims are made. See packages/quantum-core/src/sicPovm.ts.
 *
 * The loop this file implements (Phase 1 of "Craft the Ship"):
 *   User State (spoons + care + engagement) ──▶ density matrix ρ
 *   ρ ──▶ sicPovmProbabilities(ρ) ──▶ [pExplore, pCreate, pConnect, pReflect]
 *   probabilities ──▶ ship is a SUPERPOSITION (blend), never a single mode.
 */

import { sicPovmProbabilities, verifySicPovm } from '@p31/quantum-core';

/** A 2x2 density matrix flattened to [r00, r01, r10, r11]. */
export type DensityMatrix = [number, number, number, number];

/**
 * Raw inputs the ship can observe about the user. All normalized 0..1 by the
 * caller; the engine re-clamps defensively.
 */
export interface UserState {
  /** Spoon level 0..5 (energy). */
  spoons: number;
  /** Care score 0..100 (well-being). */
  careScore: number;
  /** Engagement 0..10 (connection / activity this session). */
  engagement: number;
}

/**
 * The four SIC-POVM outcomes mapped to ship modes. The ship is always a blend
 * of these — probabilities sum to ~1, and the UI weights each mode by its p.
 */
export type ShipMode = 'explore' | 'create' | 'connect' | 'reflect';

export const SHIP_MODES: readonly ShipMode[] = [
  'explore',
  'create',
  'connect',
  'reflect',
] as const;

export interface ModeState {
  /** Probability of each mode, sums to ~1, each in [0,1]. */
  probabilities: Record<ShipMode, number>;
  /** The dominant mode (argmax). */
  dominant: ShipMode;
  /** Measurement dispersion (0=structured, 1=uniform). For this SIC-POVM
   * implementation a pure single-axis state measures uniformly (entropy 1);
   * a strong connection signal (off-diagonal) differentiates the outcomes
   * (lower entropy). Used downstream as a coherence proxy. */
  entropy: number;
  /** Raw density matrix used (for debugging / downstream phases). */
  rho: DensityMatrix;
}

const clamp01 = (n: number): number => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

/**
 * Encode user state as a 2x2 density matrix (metaphorical mapping).
 *
 *   r00 = energy      = spoons / maxSpoons
 *   r11 = well-being  = careScore / 100
 *   r01 = r10 = connection/engagement / 10
 *
 * This is NOT a physical density matrix — it is a normalized state vector for
 * the SIC-POVM measurement primitive. Diagonal dominance (r00+r11 ≈ 1) keeps
 * the measurement well-behaved; off-diagonal terms encode "connection."
 */
export function passportToDensityMatrix(state: UserState, maxSpoons = 5): DensityMatrix {
  const r00 = clamp01(state.spoons / maxSpoons);
  const r11 = clamp01(state.careScore / 100);
  const off = clamp01(state.engagement / 10);
  // Intuitive mapping: r00 = energy, r11 = well-being, off-diagonal = connection.
  // The SIC-POVM measurement clamps + normalizes internally, so an un-normalized
  // rho is fine here; this keeps each term directly readable from user state.
  return [r00, off, off, r11];
}

/**
 * Measure the user state via the SIC-POVM. Returns the four mode probabilities
 * plus derived coherence metadata used by later phases (Posner coherence, etc).
 */
export function measureShipState(state: UserState): ModeState {
  const rho = passportToDensityMatrix(state);
  const raw = sicPovmProbabilities(rho);

  // sicPovmProbabilities returns sub-normalized projectors (each (1/2)|ψ⟩⟨ψ|);
  // normalize to a proper distribution so the four ship modes blend as a
  // superposition that sums to 1.
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
 * as a coherence proxy (Posner phase): for this implementation, a connection
 * (off-diagonal) signal lowers entropy.
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
export function verifyStateEngine(): { valid: boolean; overlap: number } {
  const { valid, overlap } = verifySicPovm();
  return { valid, overlap };
}
