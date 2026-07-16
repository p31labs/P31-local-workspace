/**
 * The single transform function. Every token derives from this.
 *   scale(base, step, ratio) = base × ratio^step
 */

export function scale(base: number, step: number, ratio: number): number {
  return base * Math.pow(ratio, step);
}

export function round(n: number, precision = 1): number {
  const factor = Math.pow(10, precision);
  return Math.round(n * factor) / factor;
}
