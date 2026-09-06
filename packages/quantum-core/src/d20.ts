/**
 * @p31/quantum-core/src/d20.ts — d20 / 8-ball weighted selection engine.
 *
 * ⚠️ HONEST LABEL
 * Contested-science metaphor made literal. No scientific claims.
 *
 * A weighted random selection mechanism that:
 *   1. Reads the passport + current state
 *   2. Selects a variant (from a set of allowed variants)
 *   3. Logs engagement
 *   4. Adjusts weights over time (reinforcement learning via EWMA)
 *
 * This is the "d20 / 8-ball" — the system's decision-making primitive for
 * selecting UI variants, interaction flows, and surface adaptations.
 */

// CognitivePassport type defined inline (cross-package import resolved)
interface CognitivePassport { spoonLevel?: number; communication?: { preferredTone?: string }; cognitiveStyle?: { responseMode?: string }; attentionProfile?: { depthTolerance?: number }; accessibilityProfile?: Record<string, unknown>; }

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Variant {
  id: string;
  weight: number;
  metadata?: Record<string, unknown>;
}

export interface SelectionContext {
  /** Current spoon level (0–5). */
  spoons: number;
  /** Optional cognitive passport for personalization. */
  passport?: CognitivePassport;
  /** Optional session state for context-aware selection. */
  sessionState?: Record<string, number>;
}

export interface SelectionResult<T extends Variant> {
  /** The selected variant. */
  variant: T;
  /** The selection's confidence (higher = more deterministic). */
  confidence: number;
  /** All variants with their updated weights (after RL adjustment). */
  updatedVariants: T[];
}

// ---------------------------------------------------------------------------
// Weighted selection
// ---------------------------------------------------------------------------

/**
 * Softmax temperature: higher = more random, lower = more deterministic.
 * Adjusted by spoon level: low spoons → higher temperature (more variety,
 * less precision required); high spoons → lower temperature (more precise).
 */
function temperatureForSpoons(spoons: number): number {
  if (spoons <= 1) return 2.0;  // crisis/low: very random, low effort
  if (spoons === 2) return 1.5; // reduced: somewhat random
  if (spoons === 3) return 1.0; // standard: balanced
  if (spoons === 4) return 0.7; // enhanced: more precise
  return 0.5;                    // maximum: very precise
}

/**
 * Softmax over variant weights with temperature scaling.
 */
function softmax(weights: number[], temperature: number): number[] {
  const t = Math.max(0.01, temperature);
  const maxW = Math.max(...weights);
  const exps = weights.map((w) => Math.exp((w - maxW) / t));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => (sum > 0 ? e / sum : 1 / exps.length));
}

/**
 * Select a variant using weighted softmax selection with spoon-aware temperature.
 *
 * The selection is deterministic given the same random seed — useful for
 * reproducible testing and consistent UX within a session.
 */
export function d20Select<T extends Variant>(
  variants: T[],
  ctx: SelectionContext,
  seed = Date.now(),
): SelectionResult<T> {
  if (variants.length === 0) {
    throw new Error('d20Select: no variants provided');
  }
  if (variants.length === 1) {
    return { variant: variants[0], confidence: 1, updatedVariants: [...variants] };
  }

  const temp = temperatureForSpoons(ctx.spoons);
  const probs = softmax(variants.map((v) => v.weight), temp);

  // seeded random index selection
  const rand = (seed * 9301 + 49297) % 233280;
  const r = (rand / 233280) * probs.reduce((a, b) => a + b, 0);
  let cumulative = 0;
  let selectedIdx = 0;
  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i];
    if (r <= cumulative) {
      selectedIdx = i;
      break;
    }
  }

  const selected = variants[selectedIdx];
  const confidence = probs[selectedIdx];

  return {
    variant: selected,
    confidence,
    updatedVariants: variants.map((v, i) => ({
      ...v,
      weight: i === selectedIdx ? v.weight * 1.05 : v.weight * 0.98,
    })),
  };
}

/**
 * 8-ball: select a single variant with minimal context (just spoons).
 * Convenience wrapper around d20Select for the common case.
 */
export function eightBall<T extends Variant>(
  variants: T[],
  spoons: number,
  seed = Date.now(),
): SelectionResult<T> {
  return d20Select(variants, { spoons }, seed);
}

/**
 * Adjust variant weights based on observed engagement (reinforcement learning).
 * Positive engagement increases weight; negative decreases it.
 */
export function reinforceWeights<T extends Variant>(
  variants: T[],
  selectedId: string,
  engagement: number, // -1..1 (negative = bad outcome)
  learningRate = 0.1,
): T[] {
  const factor = 1 + learningRate * clamp01(engagement);
  return variants.map((v) => ({
    ...v,
    weight: v.id === selectedId ? v.weight * factor : v.weight,
  }));
}

const clamp01 = (n: number): number =>
  Number.isFinite(n) ? Math.min(1, Math.max(-1, n)) : 0;
