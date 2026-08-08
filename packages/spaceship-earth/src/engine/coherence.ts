/**
 * @file coherence.ts — Phase 3 Posner coherence model.
 *
 * Maps spoons / engagement / entropy onto a [0,1] coherence figure and the
 * field-chaos + Fawn-Guard gate thresholds that key off it.
 *
 * ⚠️ Contested-science metaphor — asserts ENGINE behavior only, no physical
 * or medical claim.
 */

const clamp01 = (v: number): number =>
  Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;

export interface PosnerInput {
  spoons01: number;
  engagement01: number;
  entropy: number;
}

export type FawnThreshold = 'mild' | 'moderate' | 'severe';

export interface PosnerState {
  coherence: number;
  entanglementPairs: unknown[];
}

export function computePosnerCoherence(input: PosnerInput): {
  coherence: number;
  state: PosnerState;
} {
  const s = clamp01(input.spoons01);
  const e = clamp01(input.engagement01);
  const ent = clamp01(input.entropy);
  const coherence = clamp01(0.2 + 0.4 * s + 0.2 * e - 0.3 * ent);
  return { coherence, state: { coherence, entanglementPairs: [] } };
}

/** Normalize the spoon scale to a coherence figure. */
export function spoonsToCoherence(spoons: number, maxSpoons: number, entropy: number): number {
  const s01 = maxSpoons > 0 ? clamp01(spoons / maxSpoons) : 0;
  return clamp01(0.5 * s01 + 0.5 * (1 - clamp01(entropy)));
}

/** Field chaos: calm (0.5) at full coherence, chaotic (2.5) at none. */
export function fieldChaos(coherence: number): number {
  const c = clamp01(coherence);
  return 2.5 - 2 * c;
}

/** Fawn-Guard gate threshold tightens as coherence rises. */
export function fawnThreshold(coherence: number): FawnThreshold {
  const c = clamp01(coherence);
  if (c < 1 / 3) return 'mild';
  if (c < 2 / 3) return 'moderate';
  return 'severe';
}
