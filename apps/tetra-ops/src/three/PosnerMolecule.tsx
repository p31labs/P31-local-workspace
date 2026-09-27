import { useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSpoonStore } from '../state/spoonStore';
import { posnerAtoms, bondThreshold } from '@p31ca/quantum-core/posner';

const ATOMS = posnerAtoms();

export function PosnerMolecule() {
  const groupRef = useRef<THREE.Group>(null);
  const instRef = useRef<THREE.InstancedMesh>(null);
  const positions = ATOMS.map((a) => new THREE.Vector3(...a.position));

  useLayoutEffect(() => {
    const mesh = instRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    ATOMS.forEach((a, i) => {
      dummy.position.set(...a.position);
      dummy.scale.setScalar(a.radius * 0.13);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, new THREE.Color(a.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  useFrame((_, delta) => {
    const spoons = useSpoonStore.getState().spoons;
    if (!groupRef.current || spoons <= 1) return;
    const speed = spoons <= 2 ? 0.08 : spoons === 3 ? 0.2 : spoons === 4 ? 0.14 : 0.32;
    groupRef.current.rotation.y += delta * speed;
  });

  const bondPts: number[] = [];
  const thresh = bondThreshold() * 0.1;
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      if (positions[i].distanceTo(positions[j]) < thresh) {
        bondPts.push(positions[i].x, positions[i].y, positions[i].z, positions[j].x, positions[j].y, positions[j].z);
      }
    }
  }

  return (
    <group ref={groupRef}>
      <instancedMesh ref={instRef} args={[undefined, undefined, ATOMS.length]}>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshStandardMaterial roughness={0.18} metalness={0.55} toneMapped={false} />
      </instancedMesh>

      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(bondPts), 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#1e3050" transparent opacity={0.45} />
      </lineSegments>

      <mesh>
        <icosahedronGeometry args={[1.8, 0]} />
        <meshBasicMaterial color="#122040" wireframe transparent opacity={0.07} />
      </mesh>
    </group>
  );
}
