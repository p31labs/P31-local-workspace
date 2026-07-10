import { Ring, MAX_RINGS } from './types.ts';

const WIDTH = 600;
const HEIGHT = 600;

export function createRing(x: number, y: number, color: string, frequency: number): Ring {
  return {
    x: Math.max(0, Math.min(WIDTH, x)),
    y: Math.max(0, Math.min(HEIGHT, y)),
    radius: 2,
    maxRadius: 150 + Math.random() * 100,
    opacity: 1,
    color,
    frequency: 0.5 + frequency * 0.5,
  };
}

/**
 * Advance all rings by one simulation step.
 * `step` (0–1) is the spoon-aware motion factor: at 0 the rings are frozen
 * (no expansion, no fade), at 1 they expand at full speed.
 */
export function updateRings(rings: Ring[], step = 1): Ring[] {
  if (step <= 0) return rings;
  const updated = rings
    .map(r => ({
      ...r,
      radius: r.radius + r.frequency * 2 * step,
      opacity: r.opacity - 0.008 * r.frequency * step,
    }))
    .filter(r => r.opacity > 0 && r.radius < r.maxRadius);

  return updated.slice(-MAX_RINGS);
}
