/**
 * @file cockpit/GraphEdges.tsx — P31 Graph Edges (55 Typed Relationships)
 *
 * Connections follow the shortest path along the dome's 480‑edge wireframe
 * (the same edges that carry NeoPixel LED segments).
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { EDGES, VERTICES } from '@p31/shared';
import { DOME_VERTICES, assignNodeVertices, shortestPath } from '../math/domeMap';
import type { Axis } from '../math/domeMap';

const NODE_COUNT = 58;

function nodeToVertexIndex(): Map<string, number> {
  const axisCounts: Record<Axis, number> = { body: 0, mesh: 0, forge: 0, shield: 0 };
  for (const v of VERTICES) {
    const a = v.axis.toLowerCase() as Axis;
    axisCounts[a] = (axisCounts[a] || 0) + 1;
  }
  const indices = assignNodeVertices(axisCounts);
  const map = new Map<string, number>();
  VERTICES.slice(0, NODE_COUNT).forEach((v, i) => map.set(v.id, indices[i] ?? 0));
  return map;
}

export default function GraphEdges() {
  const positions = useMemo(() => {
    const idToVertex = nodeToVertexIndex();
    const verts: number[] = [];

    for (const edge of EDGES) {
      const s = idToVertex.get(edge.source);
      const t = idToVertex.get(edge.target);
      if (s === undefined || t === undefined) continue;

      const path = shortestPath(s, t);
      if (!path || path.length < 2) continue;

      for (let i = 0; i < path.length - 1; i++) {
        const a = DOME_VERTICES[path[i]];
        const b = DOME_VERTICES[path[i + 1]];
        verts.push(a[0], a[1], a[2]);
        verts.push(b[0], b[1], b[2]);
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
