/**
 * @p31/q-distribution
 * ===================
 * Fisher-Escolà Q Statistical Distribution for cognitive capacity modelling.
 *
 * Provides sampling, decay, and UI-tier utilities that complement the P31
 * spoon economy tracked in the Z-Index Cockpit (useCockpitStore → metabolicState).
 *
 * Zero runtime dependencies — pure math.
 *
 * Author: P31 Labs
 * License: MIT
 */

// ---------------------------------------------------------------------------
// Distribution constants
// ---------------------------------------------------------------------------

export const BETA_ALPHA = 21.6165;
export const BETA_BETA = 46.4970;
export const DISTRIBUTION_LOWER = 0.0385;
export const DISTRIBUTION_UPPER = 0.7783;
export const DISTRIBUTION_MEAN = 0.273;

// ---------------------------------------------------------------------------
// PART 1: Core RNG
// ---------------------------------------------------------------------------

/**
 * Standard normal sample via Box-Muller transform.
 * Guarantees u1 > 0 to avoid log(0).
 */
function randn(): number {
  let u1: number;
  do { u1 = Math.random(); } while (u1 === 0);
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Gamma-distributed sample using the Marsaglia-Tsang method.
 * Handles shape < 1 via the boost trick.
 */
function randGamma(shape: number): number {
  if (shape < 1) return randGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);

  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  while (true) {
    let x: number;
    let v: number;
    do {
      x = randn();
      v = 1 + c * x;
    } while (v <= 0);

    v = v ** 3;
    const u = Math.random();

    if (
      u < 1 - 0.0331 * x ** 4 ||
      Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))
    ) {
      return d * v;
    }
  }
}

/**
 * Beta-distributed sample via the Gamma ratio method.
 */
function randBeta(a: number, b: number): number {
  const x = randGamma(a);
  return x / (x + randGamma(b));
}

// ---------------------------------------------------------------------------
// PART 2: 4-parameter Beta distribution
// ---------------------------------------------------------------------------

/**
 * Sample initial cognitive capacity from Beta(21.6165, 46.4970, 0.0385, 0.7783).
 *
 * The distribution mean ≈ 0.273, reflecting that most users begin sessions
 * at lower-moderate capacity (validated against P31 spoon economy data).
 * Output range: [0.0385, 0.7783]
 *
 * The range [DISTRIBUTION_LOWER, DISTRIBUTION_UPPER] maps onto the cockpit's
 * metabolicState.current_spoons / metabolicState.max_spoons ratio, allowing
 * adaptive UI tier selection at session start without waiting for live telemetry.
 */
export function sampleInitialCapacity(): number {
  return DISTRIBUTION_LOWER + (DISTRIBUTION_UPPER - DISTRIBUTION_LOWER) * randBeta(BETA_ALPHA, BETA_BETA);
}

// ---------------------------------------------------------------------------
// PART 3: Cognitive exhaustion decay
// ---------------------------------------------------------------------------

/**
 * Model spoon depletion after completing a task using exponential decay.
 *
 * @param current  - Current capacity in [0, 1].
 * @param taskCost - Relative cost of the completed task (1 = baseline).
 * @param lambda   - Decay rate; default 0.1 (calibrated to P31 session data).
 * @returns        Updated capacity in [0, 1].
 *
 * @example
 * // After 15 baseline tasks at lambda=0.1, starting at 0.8:
 * // 0.8 * e^(-1.5) ≈ 0.178 → SIMPLIFIED tier
 */
export function decaySpoons(current: number, taskCost: number, lambda = 0.1): number {
  return current * Math.exp(-lambda * taskCost);
}

// ---------------------------------------------------------------------------
// PART 4: UI tier classification
// ---------------------------------------------------------------------------

export type UITier = 'FULL' | 'MODERATE' | 'SIMPLIFIED' | 'MINIMAL';

/**
 * Classify current cognitive capacity into a UI complexity tier.
 *
 * Thresholds are aligned with the cockpit's voltageLevel bands so that
 * adaptive rendering decisions stay consistent across the stack.
 *
 * | Capacity  | Tier       | Intended experience                          |
 * |-----------|------------|----------------------------------------------|
 * | > 0.70    | FULL       | All features, animations, rich data views    |
 * | 0.40–0.70 | MODERATE   | Core features, reduced animation             |
 * | 0.15–0.40 | SIMPLIFIED | Essential actions only, plain layout         |
 * | ≤ 0.15    | MINIMAL    | Single-action focus, maximum contrast        |
 */
export function getUITier(spoons: number): UITier {
  if (spoons > 0.7)  return 'FULL';
  if (spoons > 0.4)  return 'MODERATE';
  if (spoons > 0.15) return 'SIMPLIFIED';
  return 'MINIMAL';
}

// ---------------------------------------------------------------------------
// PART 5: Progressive disclosure opacity
// ---------------------------------------------------------------------------

/**
 * Compute the rendered opacity of a UI element based on current capacity
 * and the element's informational priority.
 *
 * Lower capacity causes lower-priority elements to fade out first, preserving
 * attentional bandwidth for what matters most.
 *
 * @param spoons   - Current cognitive capacity in [0, 1].
 * @param priority - Element priority level:
 *                     0 = essential    (always visible above ~0)
 *                     1 = important    (fades out below 0.3)
 *                     2 = supplementary (fades out below 0.6)
 *                     3 = decorative   (fades out below 0.9)
 * @returns Opacity in [0, 1].
 */
export function getElementOpacity(spoons: number, priority: number): number {
  return Math.max(0, Math.min(1, (spoons - priority * 0.3) / 0.3));
}
