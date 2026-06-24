import { Body } from './types.ts';

const G = 500;
const MAX_TRAIL = 80;
const WIDTH = 600;
const HEIGHT = 600;

export function updateBodies(bodies: Body[], speed: number): Body[] {
  const steps = Math.round(speed);
  let current = bodies;
  for (let s = 0; s < steps; s++) {
    current = step(current);
  }
  return current;
}

function step(bodies: Body[]): Body[] {
  const n = bodies.length;
  const ax = new Float64Array(n);
  const ay = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const dx = bodies[j].x - bodies[i].x;
      const dy = bodies[j].y - bodies[i].y;
      const distSq = dx * dx + dy * dy + 1;
      const dist = Math.sqrt(distSq);
      const force = (G * bodies[j].mass) / distSq;
      ax[i] += (force * dx) / dist;
      ay[i] += (force * dy) / dist;
    }
  }

  return bodies.map((b, i) => {
    const nx = b.x + b.vx;
    const ny = b.y + b.vy;
    let nvx = b.vx + ax[i];
    let nvy = b.vy + ay[i];
    if (nx < 0 || nx > WIDTH) nvx = -nvx * 0.5;
    if (ny < 0 || ny > HEIGHT) nvy = -nvy * 0.5;
    const trail = [...b.trail, { x: b.x, y: b.y }].slice(-MAX_TRAIL);
    return {
      ...b,
      x: Math.max(2, Math.min(WIDTH - 2, nx)),
      y: Math.max(2, Math.min(HEIGHT - 2, ny)),
      vx: nvx,
      vy: nvy,
      trail,
    };
  });
}

export function createBody(x: number, y: number, mass: number, color: string, id: string): Body {
  const radius = Math.max(3, Math.min(15, Math.sqrt(mass) * 2));
  return {
    id, x, y,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    mass: Math.max(1, mass),
    radius, color,
    trail: [],
  };
}
