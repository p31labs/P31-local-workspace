/**
 * P31 design-core — mathematical constants.
 * Every visual value in the P31 ecosystem derives from these four constants.
 * No value is hand-picked. Everything is generated.
 */
export const PHI = 1.618033988749895;
export const BASE = 16;
export const RATIO = 1.333;
export const SPACE_BASE = 4;
export const TEMPO = 120;
export const BEAT = 60000 / TEMPO;

export const TETRA = {
  VERTICES: 4,
  EDGES: 6,
  FACES: 4,
  OVERLAP: 1 / 3,
  BOND_ANGLE_DEG: 109.47122063449069,
  FACE_ANGLE_DEG: 60,
} as const;
