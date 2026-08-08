/**
 * @file cockpit/GraphShell.tsx — Geodesic Shell Wireframes
 * 
 * Outer 2V shell (R=9) + Inner 1V shell (R=3.4) + Tetra frame axis markers.
 * Reuses existing InstancedEdges for efficient rendering.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { icosahedronGeodesic } from '../math/geodesic';
import InstancedEdges from './InstancedEdges';
import { TETRA_VERTS } from '@p31/shared';

export default function GraphShell() {
  const outerShell = useMemo(() => icosahedronGeodesic(9, 2), []); // 2V @ R9
  const innerShell = useMemo(() => icosahedronGeodesic(3.4, 1), []); // 1V @ R3.4

  const outerSegments = useMemo(() => {
    return outerShell.edges.map(([a, b]) => {
      const vA = outerShell.vertices[a];
      const vB = outerShell.vertices[b];
      return [
        new THREE.Vector3(vA[0], vA[1], vA[2]),
        new THREE.Vector3(vB[0], vB[1], vB[2]),
      ] as [THREE.Vector3, THREE.Vector3];
    });
  }, [outerShell]);

  const innerSegments = useMemo(() => {
    return innerShell.edges.map(([a, b]) => {
      const vA = innerShell.vertices[a];
      const vB = innerShell.vertices[b];
      return [
        new THREE.Vector3(vA[0], vA[1], vA[2]),
        new THREE.Vector3(vB[0], vB[1], vB[2]),
      ] as [THREE.Vector3, THREE.Vector3];
    });
  }, [innerShell]);

  // Tetra frame axis markers (scaled to R=8.4 to fit inside graph shell)
  const tetraSegments = useMemo(() => {
    const scale = 8.4;
    const verts = TETRA_VERTS.map(([x, y, z]) => {
      const len = Math.sqrt(x * x + y * y + z * z);
      const s = scale / len;
      return new THREE.Vector3(x * s, y * s, z * s);
    });
    return [
      [verts[0], verts[1]],
      [verts[0], verts[2]],
      [verts[0], verts[3]],
      [verts[1], verts[2]],
      [verts[1], verts[3]],
      [verts[2], verts[3]],
    ] as [THREE.Vector3, THREE.Vector3][];
  }, []);

  return (
    <group name="graph-shell">
      {/* Outer 2V shell (graph node container) */}
      <InstancedEdges
        segments={outerSegments}
        color="#44aaff"
        opacity={0.12}
        radius={0.008}
      />

      {/* Inner 1V shell (info dome) */}
      <InstancedEdges
        segments={innerSegments}
        color="#ff9944"
        opacity={0.08}
        radius={0.006}
      />

      {/* Tetra frame (axis markers) */}
      <InstancedEdges
        segments={tetraSegments}
        color="#ff9944"
        opacity={0.25}
        radius={0.015}
      />
    </group>
  );
}
