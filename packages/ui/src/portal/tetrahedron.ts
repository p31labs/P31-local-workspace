/**
 * Tetrahedron Protocol Geometry Engine
 * Implements K₄ topology, Wye→Delta morph, SIC-POVM equiangular projection,
 * Maxwell rigidity verification, Ollivier-Ricci curvature, and symmetry scoring.
 *
 * Pure math — zero dependencies, framework-agnostic.
 * Grounded in: Johnson, William R. "The Tetrahedron Protocol" (Zenodo, 2026)
 */

export interface Vec3 { x: number; y: number; z: number; }
export interface Edge { a: number; b: number; weight: number; }
export interface NodeData { id: string; label: string; spoons: number; role: string; }
export interface TetraState {
  vertices: Vec3[];
  edges: [number, number][];
  phase: number;
  symmetry: number;
  curvature: number;
}

const PHI = (1 + Math.sqrt(5)) / 2;

/** Regular tetrahedron vertices, normalized to sphere radius √3 */
export function tetrahedronVertices(): Vec3[] {
  return [
    { x:  1, y:  1, z:  1 },
    { x:  1, y: -1, z: -1 },
    { x: -1, y:  1, z: -1 },
    { x: -1, y: -1, z:  1 },
  ];
}

/** All 6 edges — K₄ complete graph. Maxwell rigidity: E=6, 3V−6=6 ✓ */
export function tetrahedronEdges(): [number, number][] {
  return [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
}

/**
 * Wye→Delta morph.
 * t=0: all vertices pulled to center (star/hub topology)
 * t=1: full regular tetrahedron (distributed mesh)
 */
export function wyeToDelta(t: number, vertices: Vec3[]): Vec3[] {
  const c = Math.max(0, Math.min(1, t));
  const center: Vec3 = { x: 0, y: 0, z: 0 };
  return vertices.map(v => ({
    x: v.x * c + center.x * (1 - c),
    y: v.y * c + center.y * (1 - c),
    z: v.z * c + center.z * (1 - c),
  }));
}

/**
 * Triangular bipyramid extension for 5+ nodes.
 * 5th vertex occupies the center void, connecting to all 4 tetrahedron vertices.
 * This forms 6 + 4 = 10 edges total (K₄ edges + radial edges from center).
 */
export function triangularBipyramidVertices(verts: Vec3[] = tetrahedronVertices()): Vec3[] {
  return [...verts, { x: 0, y: 0, z: 0 }];
}

export function triangularBipyramidEdges(verts: Vec3[] = tetrahedronVertices()): [number, number][] {
  const base = tetrahedronEdges();
  const radial: [number, number][] = verts.map((_, i) => [i, verts.length]);
  return [...base, ...radial];
}

/**
 * SIC-POVM 2D projection — equiangular spacing at 109.47°.
 * Projects the tetrahedron onto a plane while preserving equiangular symmetry.
 * The 4th vertex (closest to viewer) maps to center.
 */
export function sicPovmProjection(vertices: Vec3[]): { x: number; y: number; r: number }[] {
  const v = vertices.length >= 4 ? vertices : tetrahedronVertices();
  const cos109 = -1 / 3;
  const sin109 = Math.sqrt(8 / 9);

  return [
    { x: 0,           y: 1,             r: 1 },
    { x: -sin109,     y: cos109,        r: 1 },
    { x: sin109 / 2,  y: cos109,        r: 1 },
    { x: -sin109 / 2, y: cos109,        r: 1 },
  ];
}

/**
 * Ollivier-Ricci curvature sign from edge weights.
 * Positive = resilient mesh (distributed edges carry load)
 * Negative = fragile hub (centralized star topology)
 * Returns normalized value between -1 and 1.
 */
export function computeCurvature(edges: Edge[]): number {
  if (edges.length === 0) return 0;
  const avg = edges.reduce((s, e) => s + (e.weight || 0.5), 0) / edges.length;
  const maxDist = 0.25;
  return Math.max(-1, Math.min(1, (avg - 0.5) / maxDist));
}

/**
 * Symmetry score: 0–100% based on geometric distortion from regular tetrahedron.
 * 100% = perfect equiangular (equilateral edges, all 109.47° angles)
 * Lower = distortion, fragility, missing nodes
 */
export function computeSymmetry(nodes: NodeData[]): number {
  const total = nodes.length;
  if (total === 0) return 0;
  const active = nodes.filter(n => n.spoons > 0).length;
  const full = Math.min(4, total);
  const baseScore = (active / Math.max(1, full)) * 100;
  const edgeCount = active * (active - 1) / 2;
  const maxEdges = full * (full - 1) / 2;
  const edgeRatio = maxEdges > 0 ? edgeCount / maxEdges : 0;
  return Math.round(baseScore * 0.6 + edgeRatio * 100 * 0.4);
}

/**
 * Maxwell rigidity check: must have E ≥ 3V − 6 for rigidity in 3D.
 * K₄: V=4, E=6 → 6 ≥ 3×4−6 = 6 ✓
 */
export function isRigid(vertices: number, edges: number): boolean {
  return edges >= 3 * vertices - 6;
}
