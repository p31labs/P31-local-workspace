import { useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSpoonStore } from '../state/spoonStore';

// K4 regular tetrahedron vertices (scaled to match the artifact's layout).
export const TV: [number, number, number][] = [
  [0, 1.9, 0],
  [-1.62, -0.63, 0.94],
  [1.62, -0.63, 0.94],
  [0, -0.63, -1.88],
];
export const TC = [0xfbbf24, 0x00f0ff, 0xa78bfa, 0x34d399];
const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 2],
  [1, 3],
  [2, 3],
];

function buildEdgeArray(positions: THREE.Vector3[]): Float32Array {
  const pts: number[] = [];
  for (const [a, b] of EDGES) {
    pts.push(positions[a].x, positions[a].y, positions[a].z, positions[b].x, positions[b].y, positions[b].z);
  }
  return new Float32Array(pts);
}

export function Tetrahedron() {
  const groupRef = useRef<THREE.Group>(null);
  const instRef = useRef<THREE.InstancedMesh>(null);
  const positions = TV.map((v) => new THREE.Vector3(v[0], v[1], v[2]));

  // Populate instance matrices + colors once mounted.
  useLayoutEffect(() => {
    const mesh = instRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    positions.forEach((p, i) => {
      dummy.position.copy(p);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, new THREE.Color(TC[i]));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [positions]);

  useFrame((_, delta) => {
    const spoons = useSpoonStore.getState().spoons;
    if (!groupRef.current || spoons <= 1) return;
    // design-core motion contract: 2 slowed, 3 default, 4 calmer, 5 brisk.
    const speed = spoons <= 2 ? 0.1 : spoons === 3 ? 0.25 : spoons === 4 ? 0.18 : 0.4;
    groupRef.current.rotation.y += delta * speed;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={instRef} args={[undefined, undefined, positions.length]}>
        <sphereGeometry args={[0.14, 24, 24]} />
        <meshStandardMaterial roughness={0.12} metalness={0.25} emissiveIntensity={0.5} toneMapped={false} />
      </instancedMesh>

      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[buildEdgeArray(positions), 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#1e3050" transparent opacity={0.65} />
      </lineSegments>
    </group>
  );
}
