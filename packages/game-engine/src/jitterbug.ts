import type { Vec3 } from './types';

/**
 * JitterbugGeometry — Buckminster Fuller's jitterbug transformation.
 *
 * Morphs between:
 *   t=0: cuboctahedron (12 vertices, vector equilibrium)
 *   t=0.5: icosahedron (12 vertices, golden ratio faces)
 *   t=1: octahedron (6 vertices)
 *
 * Spoon-gating: fewer vertices visible at low spoons, slower morph rate.
 * The jitterbug expands from octahedral to cuboctahedral shape by
 * twisting neighboring triangles in opposite directions.
 */

export interface JitterbugConfig {
  /** 0=cuboctahedron, 0.5=icosahedron, 1=octahedron */
  phase: number;
  /** Spoon level (0-5) — controls complexity and speed */
  spoons: number;
  /** Size multiplier */
  scale: number;
}

export interface JitterbugState {
  vertices: Vec3[];
  edges: [number, number][];
  phase: number;
  targetPhase: number;
  morphSpeed: number;
}

const PHI = (1 + Math.sqrt(5)) / 2;

const CUBOCTAHEDRON_VERTICES: Vec3[] = [
  { x: 1, y: 1, z: 0 }, { x: 1, y: -1, z: 0 }, { x: -1, y: 1, z: 0 }, { x: -1, y: -1, z: 0 },
  { x: 1, y: 0, z: 1 }, { x: 1, y: 0, z: -1 }, { x: -1, y: 0, z: 1 }, { x: -1, y: 0, z: -1 },
  { x: 0, y: 1, z: 1 }, { x: 0, y: 1, z: -1 }, { x: 0, y: -1, z: 1 }, { x: 0, y: -1, z: -1 },
];

const OCTAHEDRON_VERTICES: Vec3[] = [
  { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 },
  { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 },
];

const CUBOCTAHEDRON_EDGES: [number, number][] = [
  [0, 4], [0, 5], [0, 8], [0, 9],
  [1, 4], [1, 5], [1, 10], [1, 11],
  [2, 6], [2, 7], [2, 8], [2, 9],
  [3, 6], [3, 7], [3, 10], [3, 11],
  [4, 8], [4, 10], [5, 9], [5, 11],
  [6, 8], [6, 10], [7, 9], [7, 11],
];

const ICOSAHEDRON_VERTICES: Vec3[] = [
  { x: 0, y: 1, z: PHI }, { x: 0, y: 1, z: -PHI }, { x: 0, y: -1, z: PHI }, { x: 0, y: -1, z: -PHI },
  { x: 1, y: PHI, z: 0 }, { x: 1, y: -PHI, z: 0 }, { x: -1, y: PHI, z: 0 }, { x: -1, y: -PHI, z: 0 },
  { x: PHI, y: 0, z: 1 }, { x: PHI, y: 0, z: -1 }, { x: -PHI, y: 0, z: 1 }, { x: -PHI, y: 0, z: -1 },
];

/**
 * Smoothstep interpolation between two vertex sets of the same length.
 */
function lerpVertices(a: Vec3[], b: Vec3[], t: number): Vec3[] {
  const smoothT = t * t * (3 - 2 * t);
  const len = Math.min(a.length, b.length);
  const result: Vec3[] = [];
  for (let i = 0; i < len; i++) {
    result.push({
      x: a[i].x + (b[i].x - a[i].x) * smoothT,
      y: a[i].y + (b[i].y - a[i].y) * smoothT,
      z: a[i].z + (b[i].z - a[i].z) * smoothT,
    });
  }
  return result;
}

/**
 * Returns the morphed vertex positions for the current jitterbug phase.
 * t=0 → cuboctahedron, t=0.5 → icosahedron, t=1 → octahedron
 */
export function jitterbugVertices(phase: number): Vec3[] {
  if (typeof phase !== 'number' || isNaN(phase)) return CUBOCTAHEDRON_VERTICES;
  const clamped = Math.max(0, Math.min(1, phase));

  if (clamped <= 0.5) {
    return lerpVertices(CUBOCTAHEDRON_VERTICES, ICOSAHEDRON_VERTICES, clamped * 2);
  }
  return lerpVertices(ICOSAHEDRON_VERTICES, OCTAHEDRON_VERTICES, (clamped - 0.5) * 2);
}

/**
 * Returns appropriate edges based on the current phase.
 */
export function jitterbugEdges(phase: number): [number, number][] {
  if (phase <= 0.33) return CUBOCTAHEDRON_EDGES;
  if (phase <= 0.66) return CUBOCTAHEDRON_EDGES.slice(0, 12);
  return [
    [0, 2], [0, 3], [0, 4], [0, 5],
    [1, 2], [1, 3], [1, 4], [1, 5],
  ];
}

/**
 * Spoon-aware morph speed.
 * Low spoons → slow, gentle morph. High spoons → fast, energetic morph.
 */
export function spoonMorphSpeed(spoons: number): number {
  if (typeof spoons !== 'number' || isNaN(spoons) || spoons <= 0) return 0.05;
  if (spoons <= 1) return 0.1;
  if (spoons <= 3) return 0.3;
  return 0.6;
}

/**
 * Creates an initial jitterbug state.
 */
export function createJitterbug(config: Partial<JitterbugConfig> = {}): JitterbugState {
  const spoons = config.spoons ?? 3;
  return {
    vertices: jitterbugVertices(config.phase ?? 0),
    edges: jitterbugEdges(config.phase ?? 0),
    phase: config.phase ?? 0,
    targetPhase: config.phase ?? 0,
    morphSpeed: spoonMorphSpeed(spoons),
  };
}

/**
 * Updates jitterbug state by one tick.
 */
export function tickJitterbug(state: JitterbugState, deltaTime: number): JitterbugState {
  if (!state || typeof state.phase !== 'number' || isNaN(state.phase)) return state;
  const diff = (state.targetPhase ?? 0) - (state.phase ?? 0);
  if (Math.abs(diff) < 0.001) return state;

  const speed = (typeof state.morphSpeed === 'number' && !isNaN(state.morphSpeed)) ? state.morphSpeed : 0.05;
  const step = Math.min(Math.abs(diff), speed * deltaTime);
  const newPhase = (state.phase ?? 0) + Math.sign(diff) * step;

  return {
    ...state,
    phase: newPhase,
    vertices: jitterbugVertices(newPhase),
    edges: jitterbugEdges(newPhase),
  };
}

/**
 * Sets the target phase and recalculates morph speed for current spoon level.
 */
export function setJitterbugTarget(state: JitterbugState, targetPhase: number, spoons: number): JitterbugState {
  return {
    ...state,
    targetPhase: Math.max(0, Math.min(1, typeof targetPhase === 'number' ? targetPhase : 0)),
    morphSpeed: spoonMorphSpeed(spoons),
  };
}
