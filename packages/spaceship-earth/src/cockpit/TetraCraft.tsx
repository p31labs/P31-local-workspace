import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useShipStore } from '../store/shipStore';
import { regularTetra } from '../math/geometry';

export default function TetraCraft() {
  const { coherence, spoons } = useShipStore();
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const time = useRef(0);

  const tetra = useMemo(() => {
    const t = regularTetra(0.5);
    return {
      verts: [
        new THREE.Vector3(...t.v0),
        new THREE.Vector3(...t.v1),
        new THREE.Vector3(...t.v2),
        new THREE.Vector3(...t.v3),
      ],
      edges: [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]] as [number, number][],
    };
  }, []);

  const colors = [0xff9944, 0x44aaff, 0x44ffaa, 0xff4466];

  useFrame(({ clock }) => {
    time.current = clock.getElapsedTime();
    if (!groupRef.current) return;

    const camPos = camera.position;
    const lookDir = new THREE.Vector3(0, 0, 0).sub(camPos).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(lookDir, up).normalize();
    const adjustedUp = new THREE.Vector3().crossVectors(right, lookDir).normalize();

    const offset = lookDir.clone().multiplyScalar(-1.2)
      .add(adjustedUp.clone().multiplyScalar(-0.3))
      .add(right.clone().multiplyScalar(0.4));

    groupRef.current.position.copy(camPos).add(offset);
    groupRef.current.lookAt(0, 0, 0);

    groupRef.current.rotation.x += 0.02 * Math.sin(time.current * 0.4);
    groupRef.current.rotation.y += 0.03 * Math.sin(time.current * 0.3);
    groupRef.current.rotation.z += 0.01 * Math.sin(time.current * 0.2);

    const pulse = 0.95 + 0.05 * Math.sin(time.current * 0.5 + coherence * 2);
    groupRef.current.scale.setScalar(pulse);
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <tetrahedronGeometry args={[0.5]} />
        <meshPhysicalMaterial
          color={0x88ccff}
          transparent
          opacity={0.15}
          metalness={0.1}
          roughness={0.15}
          clearcoat={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {tetra.edges.map(([i, j], idx) => {
        const a = tetra.verts[i];
        const b = tetra.verts[j];
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const dir = b.clone().sub(a);
        const len = dir.length();
        const quat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          dir.normalize()
        );
        const color = colors[idx % 4];
        return (
          <mesh key={idx} position={mid} quaternion={quat}>
            <cylinderGeometry args={[0.012, 0.012, len, 4, 1]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.5 + 0.3 * coherence}
              roughness={0.2}
              metalness={0.7}
              toneMapped={false}
            />
          </mesh>
        );
      })}

      {tetra.verts.map((pos, i) => (
        <mesh key={`node-${i}`} position={pos}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial
            color={0xffffff}
            emissive={0xffffff}
            emissiveIntensity={0.3 + 0.3 * (spoons / 5)}
            roughness={0.1}
            metalness={0.9}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
