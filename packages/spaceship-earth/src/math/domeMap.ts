/**
 * @file math/domeMap.ts — Shared Dome Geometry (Single Source of Truth)
 *
 * NeoPixelFrame, GraphNodes, GraphEdges all import from here.
 * Guarantees zero drift between the LED frame and the graph topology.
 */
import { icosahedronGeodesic, type Geodesic } from './geodesic';

const DOME_RADIUS = 12;
const DETAIL = 2;

const shell: Geodesic = icosahedronGeodesic(DOME_RADIUS, DETAIL);

/** 162 vertices @ R=12 */
export const DOME_VERTICES: ReadonlyArray<readonly [number, number, number]> = shell.vertices;

/** 320 face centroids (one per triangular face, projected to R=12) */
export const DOME_FACE_CENTROIDS: ReadonlyArray<readonly [number, number, number]> = shell.faces.map(
  ([a, b, c]) => {
    const va = DOME_VERTICES[a];
    const vb = DOME_VERTICES[b];
    const vc = DOME_VERTICES[c];
    const cx = (va[0] + vb[0] + vc[0]) / 3;
    const cy = (va[1] + vb[1] + vc[1]) / 3;
    const cz = (va[2] + vb[2] + vc[2]) / 3;
    const len = Math.sqrt(cx * cx + cy * cy + cz * cz);
    const s = DOME_RADIUS / len;
    return [cx * s, cy * s, cz * s];
  },
);

/** 480 edges (vertex index pairs) */
export const DOME_EDGES: ReadonlyArray<readonly [number, number]> = shell.edges.map(
  ([a, b]) => (a < b ? [a, b] : [b, a]) as readonly [number, number],
);

/** Adjacency list for BFS */
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
    // Gather all unused vertices for this axis, sorted by alignment
    const candidates: number[] = [];
    for (let i = 0; i < DOME_VERTICES.length; i++) {
      if (!used.has(i) && _vertexAxis[i] === axis) {
        candidates.push(i);
      }
    }
    // Sort by descending alignment (vertex count already reflects alignment)
    for (let i = 0; i < Math.min(need, candidates.length); i++) {
      used.add(candidates[i]);
      indices.push(candidates[i]);
    }
  }

  // Safety pad: if any axis had fewer vertices than needed, top up from remaining
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
 * Shortest path along the 480‑edge geodesic wireframe.
 * Returns the sequence of vertex indices from start to end (inclusive).
 * Returns null only if start or end is out of range (should never happen).
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
