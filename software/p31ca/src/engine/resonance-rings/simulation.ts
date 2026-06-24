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

export function updateRings(rings: Ring[]): Ring[] {
  const updated = rings
    .map(r => ({
      ...r,
      radius: r.radius + r.frequency * 2,
      opacity: r.opacity - 0.008 * r.frequency,
    }))
    .filter(r => r.opacity > 0 && r.radius < r.maxRadius);

  return updated.slice(-MAX_RINGS);
}
