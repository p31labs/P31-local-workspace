/**
 * @file cockpit/GraphEdges.tsx — P31 Graph Edges (55 Typed Relationships)
 *
 * Single LineSegments draw-call with geodesic arcs on the sphere surface.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { EDGES, VERTICES, baryToPosition } from '@p31/shared';

const GRAPH_RADIUS = 7;
const CURVE_SEGMENTS = 20;

function arcPointsOnSphere(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  segments: number,
): THREE.Vector3[] {
  const normal = new THREE.Vector3().crossVectors(start, end);
  if (normal.length() < 0.001) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      pts.push(
        new THREE.Vector3()
          .lerpVectors(start, end, i / segments)
          .normalize()
          .multiplyScalar(radius),
      );
    }
    return pts;
  }
  normal.normalize();
  const angle = start.angleTo(end);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    pts.push(
      start
        .clone()
        .applyAxisAngle(normal, angle * (i / segments))
        .normalize()
        .multiplyScalar(radius),
    );
  }
  return pts;
}

export default function GraphEdges() {
  const positions = useMemo(() => {
    const nodePositions = new Map(
      VERTICES.map((v) => [v.id, baryToPosition(v, GRAPH_RADIUS)]),
    );

    const verts: number[] = [];
    for (const edge of EDGES) {
      const a = nodePositions.get(edge.source);
      const b = nodePositions.get(edge.target);
      if (!a || !b) continue;

      const start = new THREE.Vector3(...a);
      const end = new THREE.Vector3(...b);
      const arc = arcPointsOnSphere(start, end, GRAPH_RADIUS, CURVE_SEGMENTS);

      for (let i = 0; i < arc.length - 1; i++) {
        verts.push(arc[i].x, arc[i].y, arc[i].z);
        verts.push(arc[i + 1].x, arc[i + 1].y, arc[i + 1].z);
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
        opacity: 0.35,
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
