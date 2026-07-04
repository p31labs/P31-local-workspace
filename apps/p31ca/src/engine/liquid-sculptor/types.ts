export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export interface LiquidState {
  particles: Particle[];
  gravity: number;
  color: string;
  paused: boolean;
}
