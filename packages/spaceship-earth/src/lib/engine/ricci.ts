/**
 * @file ricci.ts — Ricci-curvature style network health math.
 *
 * Pure functions: curvature from latency + noise, resilience from node count,
 * and a scale factor / animated curvature for the renderer.
 */
export interface RicciInput {
  latency: number;
  noise: number;
  activeNodes: number;
}

export interface RicciOutput {
  curvature: number;
  resilience: string;
}

const clamp01 = (v: number): number => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);
const clamp = (v: number, lo: number, hi: number): number =>
  Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo;

export const RicciMath = {
  /**
   * Network curvature in [0.5, 1.5]. Latency and noise are clamped; non-finite
   * or negative latency reads as an ideal (1.0) network.
   */
  calculateCurvature(latency: number, noise: number): number {
    const l = clamp01((Number.isFinite(latency) ? Math.max(0, latency) : 0) / 20000);
    const n = clamp01(noise);
    return clamp(1 - 0.5 * l - 0.5 * n * l, 0.5, 1.5);
  },

  /** Structural resilience from the active node count. */
  getResilience(nodes: number): string {
    const count = Number.isFinite(nodes) ? nodes : 0;
    if (count >= 4) return '100% - ISOSTATIC';
    if (count === 3) return '57.7% - STABLE';
    return 'DEGRADED';
  },

  /** Renderer scale factor: 0.8 at curvature 1.0, clamped to [0.6, 1.4]. */
  getScaleFactor(curvature: number): number {
    const c = clamp(curvature, 0.5, 1.5);
    return clamp(0.8 + (c - 1.0) * 0.4, 0.6, 1.4);
  },

  calculate(input: RicciInput | null): RicciOutput {
    const latency = input?.latency ?? 0;
    const noise = input?.noise ?? 0;
    const activeNodes = input?.activeNodes ?? 0;
    return {
      curvature: RicciMath.calculateCurvature(latency, noise),
      resilience: RicciMath.getResilience(activeNodes),
    };
  },
};

/** Curvature animated around a base; NaN time returns the base unchanged. */
export function getAnimatedCurvature(base: number, time: number): number {
  const b = clamp(base, 0.5, 1.5);
  if (!Number.isFinite(time)) return b;
  return clamp(b + 0.06 * Math.sin(time), 0.5, 1.5);
}
