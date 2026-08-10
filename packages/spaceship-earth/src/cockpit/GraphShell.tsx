/**
 * @file cockpit/GraphShell.tsx — Geodesic Shell Wireframe
 *
 * Faint background shell at R=7, detail=1 (60 edges).
 * Opacity 0.03 keeps it subtle — graph nodes/edges take the foreground.
 */

import { useMemo } from 'react';
import * as THREE from 'three';

const SHELL_RADIUS = 7;
const SHELL_DETAIL = 1;
const SHELL_OPACITY = 0.03;

export default function GraphShell() {
  const geometry = useMemo(
    () => new THREE.IcosahedronGeometry(SHELL_RADIUS, SHELL_DETAIL),
    [],
  );

  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0x88ccff,
        wireframe: true,
        transparent: true,
        opacity: SHELL_OPACITY,
        roughness: 0.3,
        metalness: 0.1,
        depthWrite: false,
      }),
    [],
  );

  return (
    <group name="graph-shell">
      <mesh geometry={geometry} material={material} />
    </group>
  );
}
