/**
 * @file engine/dymaxion.ts — Unfold the geodesic dome into a flat Dymaxion map.
 *
 * The dome's 320 faces (detail=2) belong to 20 base icosahedron faces. Each
 * base face is mapped onto one equilateral triangle of the verified Wikipedia
 * "Icosahedron flat.svg" net (a 3-row triangular lattice band), and every dome
 * face is placed inside that cell via barycentric coordinates.
 *
 * Net topology (verified: 19 shared edges, spanning tree of the dual graph,
 * all cells equilateral, zero overlaps):
 *
 *   Row 1 (y=6..42):   T0 T1 T2 T3 T4        north-cap faces
 *   Row 2 (y=42..78):  D0 U0 D1 U1 .. D4 U4  equator zigzag
 *   Row 3 (y=78..114): B0 B1 B2 B3 B4        south-cap faces (mirrored)
 *
 * The face→cell assignment is not hard-coded: it is derived at runtime by
 * embedding the grid tree into the icosahedron's face-adjacency (dodecahedron)
 * graph via a rooted backtracking search.
 */

import { icosahedronGeodesic } from '../math/geodesic';
import { DOME_FACE_CENTROIDS } from '../math/domeMap';
import type { FaceData } from './dataConnectors';

export interface Vec2 {
  x: number;
  y: number;
}

export interface NetCell {
  /** Index of the icosahedron base face occupying this cell (0..19). */
  baseFace: number;
  /** The three 2D corners of the cell in the net. */
  corners: [Vec2, Vec2, Vec2];
  /** Cell indices that share an edge with this cell in the net. */
  neighbors: number[];
}

export interface DymaxionPoint {
  /** Dome face index (0..319 at detail=2). */
  faceIndex: number;
  /** Icosahedron base face index (0..19). */
  baseFace: number;
  /** Position in net coordinates. */
  x: number;
  y: number;
  color: string;
  value: number | null;
  label: string;
}

export interface DymaxionNet {
  /** One point per dome face, positioned inside its base-face cell. */
  points: DymaxionPoint[];
  /** The 20 net cells. */
  cells: NetCell[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  width: number;
  height: number;
}

export interface ConnectionSegment {
  from: number;
  to: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// ─────────────────────────────────────────────────────────────────────────
// Wikipedia icosahedron net coordinates (scaled so every cell is equilateral)
// ─────────────────────────────────────────────────────────────────────────

const Y_TOP = 6;
const Y_UPPER = 42;
const Y_LOWER = 78;
const Y_BOTTOM = 114;

/** x-coordinates of the 6 shared vertices along y=42 and y=78 chains. */
const BY = [3.4641016, 45.033321, 86.60254, 128.17176, 169.74098, 211.3102];
/** Apexes of the top-row north-cap triangles (y=6). */
const AY = [24.248711, 65.817931, 107.38715, 148.95637, 190.52559];
/** Down-row apexes (y=78). Six entries: the final value closes the U4 base. */
const DY = [24.248711, 65.817931, 107.38715, 148.95637, 190.52559, 232.09481];
/** Up-row apexes (y=42). */
const UY = [45.033321, 86.60254, 128.17176, 169.74098, 211.3102];
/** y=78 chain for the bottom row — reversed relative to DY (mirrored row). */
const BR = [232.09481, 190.52559, 148.95637, 107.38715, 65.817931, 24.248711];
/** Apexes of the bottom-row south-cap triangles (y=114). */
const BB = [211.3102, 169.74098, 128.17176, 86.60254, 45.033321];

function buildGridTriangles(): [Vec2, Vec2, Vec2][] {
  const grid: [Vec2, Vec2, Vec2][] = [];
  // T_k (cells 0..4): base on y=42, apex on y=6.
  for (let k = 0; k < 5; k++) {
    grid.push([
      { x: BY[k], y: Y_UPPER },
      { x: BY[k + 1], y: Y_UPPER },
      { x: AY[k], y: Y_TOP },
    ]);
  }
  // D_k (cells 5..9): base on y=42, apex on y=78.
  for (let k = 0; k < 5; k++) {
    grid.push([
      { x: BY[k], y: Y_UPPER },
      { x: BY[k + 1], y: Y_UPPER },
      { x: DY[k], y: Y_LOWER },
    ]);
  }
  // U_k (cells 10..14): apex on y=42, base on y=78.
  for (let k = 0; k < 5; k++) {
    grid.push([
      { x: UY[k], y: Y_UPPER },
      { x: DY[k], y: Y_LOWER },
      { x: DY[k + 1], y: Y_LOWER },
    ]);
  }
  // B_k (cells 15..19): base on y=78 (reversed), apex on y=114.
  for (let k = 0; k < 5; k++) {
    grid.push([
      { x: BR[k], y: Y_LOWER },
      { x: BR[k + 1], y: Y_LOWER },
      { x: BB[k], y: Y_BOTTOM },
    ]);
  }
  return grid;
}

const SAME_PT_EPS = 1e-6;

function samePoint(a: Vec2, b: Vec2): boolean {
  return Math.abs(a.x - b.x) < SAME_PT_EPS && Math.abs(a.y - b.y) < SAME_PT_EPS;
}

function sharedEdgeCount(t1: [Vec2, Vec2, Vec2], t2: [Vec2, Vec2, Vec2]): number {
  let n = 0;
  for (const a of t1) for (const b of t2) if (samePoint(a, b)) n++;
  return n;
}

function buildGridAdjacency(grid: [Vec2, Vec2, Vec2][]): number[][] {
  const adj = grid.map(() => [] as number[]);
  for (let i = 0; i < grid.length; i++) {
    for (let j = i + 1; j < grid.length; j++) {
      if (sharedEdgeCount(grid[i], grid[j]) === 2) {
        adj[i].push(j);
        adj[j].push(i);
      }
    }
  }
  return adj;
}

// ─────────────────────────────────────────────────────────────────────────
// Base icosahedron + face-adjacency (dodecahedron graph)
// ─────────────────────────────────────────────────────────────────────────

type Tri3 = readonly [number, number, number];

function edgeKey(a: number, b: number): string {
  return a < b ? `${a},${b}` : `${b},${a}`;
}

function buildFaceAdjacency(faces: readonly Tri3[]): number[][] {
  const edgeToFace = new Map<string, number[]>();
  faces.forEach((face, faceIdx) => {
    for (const [a, b] of [[face[0], face[1]], [face[1], face[2]], [face[2], face[0]]]) {
      const k = edgeKey(a, b);
      const list = edgeToFace.get(k);
      if (list) list.push(faceIdx);
      else edgeToFace.set(k, [faceIdx]);
    }
  });
  const adj = Array.from({ length: faces.length }, () => [] as number[]);
  for (const faceIndices of edgeToFace.values()) {
    if (faceIndices.length === 2) {
      const [a, b] = faceIndices;
      adj[a].push(b);
      adj[b].push(a);
    }
  }
  return adj;
}

/**
 * Embed the grid tree (rooted at cell 0 = T0) into the icosahedron's face
 * graph. Returns `cellIndex -> baseFaceIndex` such that every grid edge maps
 * to a real icosahedron edge. Deterministic (fixed BFS order + candidate
 * order) and unique for this rooted tree.
 */
export function solveNetEmbedding(gridAdj: number[][], faceAdj: number[][]): number[] {
  const n = gridAdj.length;
  const parent = new Array<number>(n).fill(-1);
  const order: number[] = [];
  const queue = [0];
  const seen = new Set([0]);
  while (queue.length) {
    const cell = queue.shift()!;
    order.push(cell);
    for (const nb of gridAdj[cell]) {
      if (!seen.has(nb)) {
        seen.add(nb);
        parent[nb] = cell;
        queue.push(nb);
      }
    }
  }
  if (order.length !== n) throw new Error('dymaxion: grid tree is disconnected');

  const assign = new Array<number>(n).fill(-1);
  const used = new Array<boolean>(n).fill(false);
  let solution: number[] | null = null;

  const dfs = (depth: number): void => {
    if (solution) return;
    if (depth === n) {
      solution = assign.slice();
      return;
    }
    const cell = order[depth];
    const parentCell = parent[cell];
    const candidates =
      parentCell >= 0 && assign[parentCell] >= 0
        ? faceAdj[assign[parentCell]]
        : Array.from({ length: n }, (_, i) => i);

    for (const face of candidates) {
      if (used[face]) continue;
      const consistent = gridAdj[cell].every(
        (nb) => assign[nb] < 0 || faceAdj[face].includes(assign[nb]),
      );
      if (!consistent) continue;
      assign[cell] = face;
      used[face] = true;
      dfs(depth + 1);
      if (solution) return;
      used[face] = false;
      assign[cell] = -1;
    }
  };

  dfs(0);
  if (!solution) throw new Error('dymaxion: failed to embed net into icosahedron');
  return solution;
}

// ─────────────────────────────────────────────────────────────────────────
// Barycentric mapping
// ─────────────────────────────────────────────────────────────────────────

function dot3(a: number[], b: number[]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function sub3(a: number[], b: number[]): number[] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross3(a: number[], b: number[]): number[] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function normalize3(p: number[]): number[] {
  const len = Math.hypot(p[0], p[1], p[2]);
  return len > 0 ? [p[0] / len, p[1] / len, p[2] / len] : [0, 0, 0];
}

function faceCentroid(verts: readonly [number, number, number][], face: Tri3): number[] {
  const a = verts[face[0]];
  const b = verts[face[1]];
  const c = verts[face[2]];
  return normalize3([(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3]);
}

/**
 * Barycentric coordinates of `p` within triangle (A, B, C). `p` is projected
 * onto the triangle plane first so points on the sphere map cleanly.
 * Returns [u, v, w] with u+v+w = 1.
 */
export function barycentricInTriangle(
  a: number[],
  b: number[],
  c: number[],
  p: number[],
): [number, number, number] {
  const ab = sub3(b, a);
  const ac = sub3(c, a);
  const n = cross3(ab, ac);
  const n2 = dot3(n, n);
  // Project p onto the plane through a with normal n.
  const ap = sub3(p, a);
  const t = dot3(ap, n) / n2;
  const pp = sub3(ap, [n[0] * t, n[1] * t, n[2] * t]);

  const d22 = dot3(ab, ab);
  const d33 = dot3(ac, ac);
  const d23 = dot3(ab, ac);
  const denom = d22 * d33 - d23 * d23;
  const wb = (d33 * dot3(pp, ab) - d23 * dot3(pp, ac)) / denom;
  const wc = (d22 * dot3(pp, ac) - d23 * dot3(pp, ab)) / denom;
  return [1 - wb - wc, wb, wc];
}

// ─────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────

const DEFAULT_FACE_COLOR = '#22d3ee';
const EMPTY_FACE_COLOR = '#0f172a';

/** Build the Dymaxion net for the current dome configuration. */
export function buildDymaxionNet(faceData: FaceData[] = []): DymaxionNet {
  const grid = buildGridTriangles();
  const gridAdj = buildGridAdjacency(grid);

  const base = icosahedronGeodesic(1, 0);
  const baseFaces = base.faces as readonly Tri3[];
  const baseVerts = base.vertices as readonly [number, number, number][];
  const faceAdj = buildFaceAdjacency(baseFaces);
  const embedding = solveNetEmbedding(gridAdj, faceAdj);

  const baseCentroids = baseFaces.map((f) => faceCentroid(baseVerts, f));

  const cells: NetCell[] = grid.map((corners, cellIdx) => ({
    baseFace: embedding[cellIdx],
    corners,
    neighbors: gridAdj[cellIdx].slice(),
  }));

  const points: DymaxionPoint[] = [];
  for (let faceIndex = 0; faceIndex < DOME_FACE_CENTROIDS.length; faceIndex++) {
    const raw = DOME_FACE_CENTROIDS[faceIndex];
    const dir = normalize3([raw[0], raw[1], raw[2]]);

    let bestFace = 0;
    let bestDot = -Infinity;
    for (let b = 0; b < baseCentroids.length; b++) {
      const d = dot3(dir, baseCentroids[b]);
      if (d > bestDot) {
        bestDot = d;
        bestFace = b;
      }
    }

    const cellIdx = embedding.indexOf(bestFace);
    const cell = grid[cellIdx];
    const baseFace = baseFaces[bestFace];
    const [u, v, w] = barycentricInTriangle(
      baseVerts[baseFace[0]],
      baseVerts[baseFace[1]],
      baseVerts[baseFace[2]],
      dir,
    );

    const data = faceData[faceIndex];
    points.push({
      faceIndex,
      baseFace: bestFace,
      x: u * cell[0].x + v * cell[1].x + w * cell[2].x,
      y: u * cell[0].y + v * cell[1].y + w * cell[2].y,
      color: data ? (data.color || DEFAULT_FACE_COLOR) : EMPTY_FACE_COLOR,
      value: data ? data.value : null,
      label: data ? data.label : '',
    });
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const tri of grid) {
    for (const p of tri) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
  }

  return {
    points,
    cells,
    bounds: { minX, minY, maxX, maxY },
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Connection segments between dome faces, mapped onto the net. Faces without
 * data (or with dangling connection targets) are skipped.
 */
export function buildConnectionSegments(
  faceData: FaceData[],
  net: DymaxionNet,
): ConnectionSegment[] {
  const byFace = new Map<number, DymaxionPoint>();
  for (const p of net.points) byFace.set(p.faceIndex, p);

  const segments: ConnectionSegment[] = [];
  for (const face of faceData) {
    if (!face.connections || face.connections.length === 0) continue;
    const from = byFace.get(face.faceIndex);
    if (!from) continue;
    for (const target of face.connections) {
      const to = byFace.get(target);
      if (!to) continue;
      segments.push({
        from: face.faceIndex,
        to: target,
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
      });
    }
  }
  return segments;
}
