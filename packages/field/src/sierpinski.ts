/**
 * @p31/field — sierpinski.ts
 *
 * The Sierpiński gasket — the Field's own failure mode, named.
 *
 * The gasket is built by an identical local rule at every level: replace a
 * triangle with three smaller triangles, ad infinitum. Every cell is a
 * triangle — complete, connected, locally "rigid" in the 2D sense. Yet the
 * whole has β₂ = 0 at every level: it never encloses a volume, no matter how
 * deep the recursion goes.
 *
 * This is the topological statement of the counter-evidence in "The
 * Organizational Physics of Multi-Agent AI" (2026-02): the 8-agent stigmergic
 * swarm "produced incompatible interfaces at every boundary." Every local
 * agent did its job; the global structure never closed. Local completeness
 * does not compose to global enclosure.
 *
 * The Field's Zone is K₄ — β₂ = 1, one protected interior. The Sierpiński
 * gasket is the warning that a field whose zones are individually K₄ can
 * still have β₂ = 0 globally. The gap is what the falsification lane tests.
 */

export interface SierpinskiLevel {
  level: number;
  vertices: number;
  edges: number;
  /** Filled cells (triangles) at this level: 3^level. */
  cells: number;
  beta0: number;
  beta1: number;
  beta2: number;
}

/**
 * The gasket's graph at a given recursion depth.
 *
 *   S₀   = one triangle        (V=3, E=3)
 *   Sₙ₊₁ = three copies of Sₙ, glued at three shared corners.
 *
 * So Vₙ = (3^(n+1) + 3)/2, Eₙ = 3^(n+1). The graph is connected (β₀ = 1),
 * its cycle rank β₁ = E − V + 1 = (3^(n+1) − 1)/2 grows without bound, and
 * β₂ = 0 at every level — a 2-dimensional object never encloses a volume.
 */
export function sierpinskiGasket(level: number): SierpinskiLevel {
  if (!Number.isInteger(level) || level < 0) {
    throw new Error(`sierpinskiGasket level must be a non-negative integer (got ${level})`);
  }
  const v = (3 ** (level + 1) + 3) / 2;
  const e = 3 ** (level + 1);
  return {
    level,
    vertices: v,
    edges: e,
    cells: 3 ** level,
    beta0: 1,
    beta1: e - v + 1,
    beta2: 0,
  };
}

/** The Sierpiński gasket's fractal dimension: log₃ of the 3-copies-per-3x rule
 *  is 1 — no, the standard value is log(3)/log(2), the Hausdorff dimension of
 *  the gasket (three copies at half scale). */
export const SIERPINSKI_DIMENSION = Math.log(3) / Math.log(2); // ≈ 1.585

/**
 * The gap, quantified. Given a field where every zone is a rigid K₄ (β₂ = 1
 * locally), the Sierpiński construction shows global β₂ can still be 0. This
 * returns the LOCAL vs GLOBAL enclosure gap — the thing the falsification
 * lane must test against.
 *
 * Returns { localBeta2, globalBeta2, gap } where `gap` is the number of
 * recursion levels at which the global structure has already failed to
 * enclose, despite every local cell being complete.
 */
export function enclosureGap(levels: number): {
  localBeta2: number;
  globalBeta2: number;
  cells: number;
  gap: boolean;
} {
  const g = sierpinskiGasket(levels);
  return {
    localBeta2: 1, // every cell is a complete triangle — the 2D local claim
    globalBeta2: g.beta2, // 0 — the whole never encloses
    cells: g.cells,
    gap: g.beta2 !== 1, // true: local completeness failed to compose
  };
}
