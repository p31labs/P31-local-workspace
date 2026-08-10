/**
 * @file cockpit/GraphEdges.tsx — P31 Graph Edges (55 Typed Relationships)
 *
 * Geodesic arcs along the dome surface (R=12) between nodes.
 * Single LineSegments draw call.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { EDGES, VERTICES } from '@p31/shared';
import { pickDomeVertices } from './GraphNodes';

const DOME_RADIUS = 12;
const NODE_COUNT = 58;
const CURVE_SEGMENTS = 24;

function arcOnSphere(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  segments: number,
): number[] {
  const cross = new THREE.Vector3().crossVectors(start, end);
  const len = cross.length();
  if (len < 0.001) {
    const out: number[] = [];
    for (let i = 0; i <= segments; i++) {
      const p = new THREE.Vector3().lerpVectors(start, end, i / segments).normalize().multiplyScalar(radius);
      out.push(p.x, p.y, p.z);
    }
    return out;
  }
  cross.normalize();
  const angle = start.angleTo(end);
  const out: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const p = start.clone().applyAxisAngle(cross, angle * (i / segments)).normalize().multiplyScalar(radius);
    out.push(p.x, p.y, p.z);
  }
  return out;
}

export default function GraphEdges() {
  const positions = useMemo(() => {
    const { positions: domePositions, indices: domeVertexIndices } = pickDomeVertices(NODE_COUNT);

    const nodeIdToPos = new Map<string, THREE.Vector3>();
    VERTICES.slice(0, NODE_COUNT).forEach((v, i) => {
      nodeIdToPos.set(v.id, new THREE.Vector3(...domePositions[i]));
    });

    const verts: number[] = [];
    for (const edge of EDGES) {
      const a = nodeIdToPos.get(edge.source);
      const b = nodeIdToPos.get(edge.target);
      if (!a || !b) continue;

      const arc = arcOnSphere(a, b, DOME_RADIUS, CURVE_SEGMENTS);
      for (let i = 0; i < arc.length / 3 - 1; i++) {
        verts.push(arc[i * 3], arc[i * 3 + 1], arc[i * 3 + 2]);
        verts.push(arc[i * 3 + 3], arc[i * 3 + 4], arc[i * 3 + 5]);
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
