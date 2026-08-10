/**
 * @file cockpit/GraphEdges.tsx — P31 Graph Edges (55 Typed Relationships)
 *
 * Edges follow the shortest path along the dome's 480‑edge wireframe (BFS).
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { EDGES, VERTICES } from '@p31/shared';
import { icosahedronGeodesic } from '../math/geodesic';
import { pickDomeVertices } from './GraphNodes';

const DOME_RADIUS = 12;
const NODE_COUNT = 58;

function buildGraph() {
  const shell = icosahedronGeodesic(DOME_RADIUS, 2);
  const adj: number[][] = Array.from({ length: shell.vertices.length }, () => []);
  for (const [a, b] of shell.edges) {
    adj[a].push(b);
    adj[b].push(a);
  }
  return { vertices: shell.vertices, adj };
}

function bfsShortestPath(start: number, end: number, adj: number[][]): number[] | null {
  if (start === end) return [start];
  const queue: number[] = [start];
  const visited = new Set<number>([start]);
  const parent: Record<number, number> = {};
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const nxt of adj[cur]) {
      if (!visited.has(nxt)) {
        visited.add(nxt);
        parent[nxt] = cur;
        if (nxt === end) {
          const path: number[] = [];
          let node: number | undefined = end;
          while (node !== undefined) { path.unshift(node); node = parent[node]; }
          return path;
        }
        queue.push(nxt);
      }
    }
  }
  return null;
}

export default function GraphEdges() {
  const positions = useMemo(() => {
    const { vertices, adj } = buildGraph();
    const { indices: domeVertexIndices } = pickDomeVertices(NODE_COUNT);

    const nodeIdToDomeIdx = new Map<string, number>();
    VERTICES.slice(0, NODE_COUNT).forEach((v, i) => {
      nodeIdToDomeIdx.set(v.id, domeVertexIndices[i]);
    });

    const verts: number[] = [];
    for (const edge of EDGES) {
      const s = nodeIdToDomeIdx.get(edge.source);
      const t = nodeIdToDomeIdx.get(edge.target);
      if (s === undefined || t === undefined) continue;
      const path = bfsShortestPath(s, t, adj);
      if (!path || path.length < 2) continue;
      for (let i = 0; i < path.length - 1; i++) {
        const a = new THREE.Vector3(...vertices[path[i]]);
        const b = new THREE.Vector3(...vertices[path[i + 1]]);
        verts.push(a.x, a.y, a.z);
        verts.push(b.x, b.y, b.z);
      }
    }
    return new Float32Array(verts);
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: 0x44aaff,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
    [],
  );

  return (
    <group name="graph-edges">
      <lineSegments geometry={geometry} material={material} />
    </group>
  );
}
