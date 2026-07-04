import type { JitterbugVertex } from '../types/navigator.types';

/**
 * Q-Factor: coherence score across all active cognitive domains.
 * Returns a value in [0, 1] — 1 is full coherence, 0 is collapsed.
 */
export function useQFactor(vertices: JitterbugVertex[]): number {
  if (vertices.length === 0) return 0;
  const sum = vertices.reduce((acc, v) => acc + v.value, 0);
  return sum / vertices.length;
}
