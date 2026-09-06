/**
 * ⚠️ HONEST LABEL
 * This implements a computational model inspired by contested hypotheses
 * (MacDonald 2025, "Tetrahedral Hyperdimensional Algebra"). The underlying
 * science is NOT established physics. This code is an architectural metaphor
 * made literal — a sovereign care measurement primitive — not a scientific
 * claim.
 *
 * Morphogenetic field M(X) = Σₙ Φⁿ · Rₙ(θ, B) · Ψ₀(X)
 * where Φ is golden ratio, Rₙ is a Clifford rotation, Ψ₀ is the seed state.
 *
 * Recursive Clifford-phase field with golden-ratio scaling.
 * Depth-bounded for tractability (default 12).
 */

import { PHI } from '@p31/design-core/math';

/**
 * 2D Clifford rotation by angle θ, scaled by factor B.
 */
export function cliffordRotation(theta: number, B: number): (x: number) => number {
  return (x: number) => {
    const cosT = Math.cos(theta * B);
    const sinT = Math.sin(theta * B);
    return x * cosT - (1 - x) * sinT;
  };
}

/**
 * Compute the morphogenetic field value at depth n for a given seed.
 * M_n = Φⁿ · Rₙ(θ, B) · Ψ₀
 */
export function morphogeneticLayer(
  seed: number,
  n: number,
  theta: number,
  B: number
): number {
  const phiN = Math.pow(PHI, n);
  const rotated = cliffordRotation(theta, B)(seed);
  return phiN * rotated;
}

/**
 * Compute the full morphogenetic field as a sum of layers.
 * M(X) = Σₙ Φⁿ · Rₙ(θ, B) · Ψ₀(X)
 * Returns an array of layer values (not the sum), for visualization.
 *
 * @param seed - initial state Ψ₀ (0..1)
 * @param depth - number of recursion layers (default 12)
 * @param theta - base rotation angle (default π/4)
 * @param B - bond threshold scaling factor (default 1.9 from Posner)
 */
export function computeMorphogeneticField(
  seed: number = 0.5,
  depth: number = 12,
  theta: number = Math.PI / 4,
  B: number = 1.9
): number[] {
  const layers: number[] = [];
  for (let n = 0; n < depth; n++) {
    const val = morphogeneticLayer(seed, n, theta, B);
    layers.push(val);
  }
  return layers;
}

/**
 * Compute the single aggregate field value at a given depth.
 */
export function morphogeneticFieldValue(
  seed: number = 0.5,
  depth: number = 12,
  theta: number = Math.PI / 4,
  B: number = 1.9
): number {
  const layers = computeMorphogeneticField(seed, depth, theta, B);
  return layers.reduce((s, v) => s + v, 0);
}
