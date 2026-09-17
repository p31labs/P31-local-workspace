/**
 * Jitterbug + K4 geometry. Pure TypeScript, zero dependencies, no side effects.
 *
 * Ported from packages/design-core/src/starfield/jitterbug.ts and
 * packages/game-engine/src/jitterbug.ts so the Command Center 3D layer can
 * consume the canonical Buckminster Fuller morph without importing either.
 */

export interface Vec3 {
  x: number
  y: number
  z: number
}

const PHI = (1 + Math.sqrt(5)) / 2

export const CUBOCTAHEDRON_VERTICES: Vec3[] = [
  { x: 1, y: 1, z: 0 }, { x: 1, y: -1, z: 0 }, { x: -1, y: 1, z: 0 }, { x: -1, y: -1, z: 0 },
  { x: 1, y: 0, z: 1 }, { x: 1, y: 0, z: -1 }, { x: -1, y: 0, z: 1 }, { x: -1, y: 0, z: -1 },
  { x: 0, y: 1, z: 1 }, { x: 0, y: 1, z: -1 }, { x: 0, y: -1, z: 1 }, { x: 0, y: -1, z: -1 },
]

export const OCTAHEDRON_VERTICES: Vec3[] = [
  { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 },
  { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 },
]

export const ICOSAHEDRON_VERTICES: Vec3[] = [
  { x: 0, y: 1, z: PHI }, { x: 0, y: 1, z: -PHI }, { x: 0, y: -1, z: PHI }, { x: 0, y: -1, z: -PHI },
  { x: 1, y: PHI, z: 0 }, { x: 1, y: -PHI, z: 0 }, { x: -1, y: PHI, z: 0 }, { x: -1, y: -PHI, z: 0 },
  { x: PHI, y: 0, z: 1 }, { x: PHI, y: 0, z: -1 }, { x: -PHI, y: 0, z: 1 }, { x: -PHI, y: 0, z: -1 },
]

export function lerpVertices(a: Vec3[], b: Vec3[], t: number): Vec3[] {
  const st = t * t * (3 - 2 * t)
  const len = Math.min(a.length, b.length)
  const r: Vec3[] = []
  for (let i = 0; i < len; i++) {
    r.push({
      x: a[i].x + (b[i].x - a[i].x) * st,
      y: a[i].y + (b[i].y - a[i].y) * st,
      z: a[i].z + (b[i].z - a[i].z) * st,
    })
  }
  return r
}

/** phase 0 -> cuboctahedron, 0.5 -> icosahedron, 1 -> octahedron. */
export function jitterbugVertices(phase: number): Vec3[] {
  const c = Math.max(0, Math.min(1, phase || 0))
  if (c <= 0.5) return lerpVertices(CUBOCTAHEDRON_VERTICES, ICOSAHEDRON_VERTICES, c * 2)
  return lerpVertices(ICOSAHEDRON_VERTICES, OCTAHEDRON_VERTICES, (c - 0.5) * 2)
}

/** Regular tetrahedron: complete graph K4 with edge length 2*sqrt(2). */
export const K4_VERTICES: Vec3[] = [
  { x: 1, y: 1, z: 1 },
  { x: 1, y: -1, z: -1 },
  { x: -1, y: 1, z: -1 },
  { x: -1, y: -1, z: 1 },
]

export const K4_EDGES: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3],
]
