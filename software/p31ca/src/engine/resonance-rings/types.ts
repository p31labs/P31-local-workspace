export interface Ring {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
  frequency: number;
}

export interface ResonanceState {
  rings: Ring[];
  color: string;
  frequency: number;
  paused: boolean;
}

export const MAX_RINGS = 30;
