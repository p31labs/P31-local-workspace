import { Particle } from './types.ts';

const MAX_PARTICLES = 500;
const DAMPING = 0.99;
const WIDTH = 500;
const HEIGHT = 500;

export function createParticle(x: number, y: number, gravity: number): Particle {
  return {
    x, y,
    vx: (Math.random() - 0.5) * 3,
    vy: (Math.random() - 0.5) * 3 + gravity * 0.5,
    life: 1,
  };
}

/**
 * Advance all particles by one simulation step.
 * `step` (0–1) is the spoon-aware motion factor: at 0 the particles are frozen
 * (no movement, no life decay), at 1 they move at full speed.
 */
export function updateParticles(particles: Particle[], gravity: number, step = 1): Particle[] {
  if (step <= 0) return particles;
  const updated = particles
    .map(p => {
      let vy = p.vy + gravity * 0.3 * step;
      const nx = p.x + p.vx * step;
      const ny = p.y + vy * step;
      let vx = p.vx;
      if (nx < 0 || nx > WIDTH) vx = -p.vx * DAMPING;
      if (ny < 0 || ny > HEIGHT) vy = -vy * DAMPING;
      return {
        ...p,
        x: Math.max(0, Math.min(WIDTH, nx)),
        y: Math.max(0, Math.min(HEIGHT, ny)),
        vx,
        vy,
        life: p.life - 0.003 * step,
      };
    })
    .filter(p => p.life > 0);

  return updated.slice(-MAX_PARTICLES);
}

export function emitParticles(
  x: number, y: number, count: number, gravity: number,
): Particle[] {
  return Array.from({ length: count }, () => createParticle(x, y, gravity));
}
