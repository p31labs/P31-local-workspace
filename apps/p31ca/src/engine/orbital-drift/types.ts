export interface Body {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  color: string;
  trail: { x: number; y: number }[];
}

export interface OrbitalState {
  bodies: Body[];
  trailsOn: boolean;
  speed: number;
  paused: boolean;
}
