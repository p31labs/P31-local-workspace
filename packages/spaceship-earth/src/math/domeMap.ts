/**
 * @file math/domeMap.ts — Shared Dome Geometry (Single Source of Truth)
 *
 * Supports configurable geodesic detail levels:
 * - detail=1: 80 faces, 42 vertices
 * - detail=2: 320 faces, 162 vertices (default)
 * - detail=3: 1280 faces, 642 vertices
 * - detail=4: 5120 faces, 2562 vertices
 *
 * Guarantees zero drift between the LED frame and the graph topology.
 */

import { icosahedronGeodesic, type Geodesic } from './geodesic';

const DEFAULT_RADIUS = 12;
const DEFAULT_DETAIL = 2;

export interface DomeGeometry {
  vertices: ReadonlyArray<readonly [number, number, number]>;
  edges: ReadonlyArray<readonly [number, number]>;
  faces: ReadonlyArray<readonly [number, number, number]>;
  faceCentroids: ReadonlyArray<readonly [number, number, number]>;
  faceAdjacency: number[][];
  vertexFaces: number[][];
}

export function createDomeGeometry(radius = DEFAULT_RADIUS, detail = DEFAULT_DETAIL): DomeGeometry {
  const shell = icosahedronGeodesic(radius, detail);
  const vertices = shell.vertices;
  const faces = shell.faces;

  const faceCentroids: [number, number, number][] = faces.map(([a, b, c]) => {
    const va = vertices[a];
    const vb = vertices[b];
    const vc = vertices[c];
    const cx = (va[0] + vb[0] + vc[0]) / 3;
    const cy = (va[1] + vb[1] + vc[1]) / 3;
    const cz = (va[2] + vb[2] + vc[2]) / 3;
    const len = Math.sqrt(cx * cx + cy * cy + cz * cz);
    const s = radius / len;
    return [cx * s, cy * s, cz * s];
  });

  // Build face adjacency: faceIndex -> [neighboring face indices]
  const edgeToFace = new Map<string, number[]>();
  faces.forEach((face, faceIdx) => {
    const edges = [
      [face[0], face[1]].sort((a, b) => a - b).join(','),
      [face[1], face[2]].sort((a, b) => a - b).join(','),
      [face[2], face[0]].sort((a, b) => a - b).join(','),
    ];
    for (const edgeKey of edges) {
      if (!edgeToFace.has(edgeKey)) {
        edgeToFace.set(edgeKey, []);
      }
      edgeToFace.get(edgeKey)!.push(faceIdx);
    }
  });

  const faceAdjacency: number[][] = Array.from({ length: faces.length }, () => []);
  for (const [edgeKey, faceIndices] of edgeToFace) {
    if (faceIndices.length === 2) {
      const [a, b] = faceIndices;
      if (!faceAdjacency[a].includes(b)) faceAdjacency[a].push(b);
      if (!faceAdjacency[b].includes(a)) faceAdjacency[b].push(a);
    }
  }

  // Build vertex-faces mapping: vertexIndex -> [face indices containing this vertex]
  const vertexFaces: number[][] = Array.from({ length: vertices.length }, () => []);
  for (let f = 0; f < faces.length; f++) {
    const [a, b, c] = faces[f];
    vertexFaces[a].push(f);
    vertexFaces[b].push(f);
    vertexFaces[c].push(f);
  }

  return {
    vertices,
    edges: shell.edges,
    faces,
    faceCentroids,
    faceAdjacency,
    vertexFaces,
  };
}

const shell = createDomeGeometry(DEFAULT_RADIUS, DEFAULT_DETAIL);

/** 162 vertices @ R=12, detail=2 */
export const DOME_VERTICES: ReadonlyArray<readonly [number, number, number]> = shell.vertices;

/** 320 face centroids (one per triangular face, projected to R=12) */
export const DOME_FACE_CENTROIDS: ReadonlyArray<readonly [number, number, number]> = shell.faceCentroids;

/** 480 edges (vertex index pairs) */
export const DOME_EDGES: ReadonlyArray<readonly [number, number]> = shell.edges.map(
  ([a, b]) => (a < b ? [a, b] : [b, a]) as readonly [number, number],
);

/** Face adjacency list: faceIndex -> [neighboring face indices] */
export const DOME_FACE_ADJACENCY: ReadonlyArray<readonly number[]> = shell.faceAdjacency;

/** Vertex-faces mapping: vertexIndex -> [face indices containing this vertex] */
export const DOME_VERTEX_FACES: ReadonlyArray<readonly number[]> = shell.vertexFaces;

/** Adjacency list for BFS (vertex-based) */
const ADJ: number[][] = Array.from({ length: DOME_VERTICES.length }, () => []);
for (const [a, b] of DOME_EDGES) {
  ADJ[a].push(b);
  ADJ[b].push(a);
}

// ═══════════════════════════════════════════════════════════════
// AXIS ASSIGNMENT
// ═══════════════════════════════════════════════════════════════

type Axis = 'body' | 'mesh' | 'forge' | 'shield';
export type { Axis };
const AXIS_NAMES: Axis[] = ['body', 'mesh', 'forge', 'shield'];

const AXIS_DIRS: ReadonlyArray<[Axis, readonly [number, number, number]]> = [
  ['body', [1, 1, 1]],
  ['mesh', [1, -1, -1]],
  ['forge', [-1, 1, -1]],
  ['shield', [-1, -1, 1]],
];

function len2(v: readonly [number, number, number]): number {
  return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
}

const _vertexAxis: Axis[] = DOME_VERTICES.map((v) => {
  const invLen = 1 / Math.sqrt(len2(v));
  let best: Axis = 'body';
  let bestDot = -Infinity;
  for (const [name, dir] of AXIS_DIRS) {
    const d = (v[0] * dir[0] + v[1] * dir[1] + v[2] * dir[2]) * invLen / Math.sqrt(len2(dir));
    if (d > bestDot) { bestDot = d; best = name; }
  }
  return best;
});

/** Which tetrahedron axis a given geodesic vertex belongs to */
export function vertexAxis(idx: number): Axis {
  return _vertexAxis[idx];
}

// ═══════════════════════════════════════════════════════════════
// NODE-TO-VERTEX ASSIGNMENT
// ═══════════════════════════════════════════════════════════════

type AxisCounts = Record<Axis, number>;

/**
 * Assign each semantic node a unique dome vertex, preserving per‑axis counts.
 * Nodes with the same axis get vertices closest to that axis.
 * Returns an array of vertex indices (one per node, matching nodes[i]).
 */
export function assignNodeVertices(counts: AxisCounts): number[] {
  const used = new Set<number>();
  const indices: number[] = [];

  for (const axis of AXIS_NAMES) {
    const need = counts[axis];
    const candidates: number[] = [];
    for (let i = 0; i < DOME_VERTICES.length; i++) {
      if (!used.has(i) && _vertexAxis[i] === axis) {
        candidates.push(i);
      }
    }
    for (let i = 0; i < Math.min(need, candidates.length); i++) {
      used.add(candidates[i]);
      indices.push(candidates[i]);
    }
  }

  for (let i = 0; i < DOME_VERTICES.length && indices.length < total(counts); i++) {
    if (!used.has(i)) { used.add(i); indices.push(i); }
  }

  return indices;
}

function total(counts: AxisCounts): number {
  return counts.body + counts.mesh + counts.forge + counts.shield;
}

// ═══════════════════════════════════════════════════════════════
// BFS SHORTEST PATH
// ═══════════════════════════════════════════════════════════════

/**
 * Shortest path along the geodesic wireframe.
 * Returns the sequence of vertex indices from start to end (inclusive).
 */
export function shortestPath(start: number, end: number): number[] | null {
  if (start === end) return [start];
  if (start < 0 || start >= ADJ.length || end < 0 || end >= ADJ.length) return null;

  const queue: number[] = [start];
  const visited = new Set<number>([start]);
  const parent: number[] = new Array(ADJ.length).fill(-1);

  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const nxt of ADJ[cur]) {
      if (!visited.has(nxt)) {
        visited.add(nxt);
        parent[nxt] = cur;
        if (nxt === end) {
          const path: number[] = [];
          let node: number = end;
          while (node !== -1) { path.unshift(node); node = parent[node]; }
          return path;
        }
        queue.push(nxt);
      }
    }
  }
  return null;
}

/**
 * Shortest path between two faces (sequence of face indices).
 * Uses BFS on the face adjacency graph.
 */
export function shortestFacePath(start: number, end: number): number[] | null {
  if (start === end) return [start];
  if (start < 0 || start >= DOME_FACE_ADJACENCY.length || end < 0 || end >= DOME_FACE_ADJACENCY.length) return null;

  const queue: number[] = [start];
  const visited = new Set<number>([start]);
  const parent: number[] = new Array(DOME_FACE_ADJACENCY.length).fill(-1);

  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const nxt of DOME_FACE_ADJACENCY[cur]) {
      if (!visited.has(nxt)) {
        visited.add(nxt);
        parent[nxt] = cur;
        if (nxt === end) {
          const path: number[] = [];
          let node: number = end;
          while (node !== -1) { path.unshift(node); node = parent[node]; }
          return path;
        }
        queue.push(nxt);
      }
    }
  }
  return null;
}
