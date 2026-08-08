import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useShipStore } from '../store/shipStore';
import { icosahedronGeodesic } from '../math/geodesic';

export default function InnerDome() {
  const { coherence, spoons, dockedPorts, memberCount, dunaTarget } = useShipStore();
  const groupRef = useRef<THREE.Group>(null);
  const time = useRef(0);

  const radius = 2.5;
  const shell = useMemo(() => icosahedronGeodesic(radius, 1), []);
  const edgeSegments = useMemo(() => {
    return shell.edges.map(([a, b]) => [
      new THREE.Vector3(...shell.vertices[a]),
      new THREE.Vector3(...shell.vertices[b]),
    ]) as [THREE.Vector3, THREE.Vector3][];
  }, [shell]);

  const statNodes = useMemo(() => [
    { label: 'Members', value: memberCount, color: '#44aaff' },
    { label: 'Target', value: dunaTarget, color: '#ff9944' },
    { label: 'Coherence', value: coherence, color: '#44ffaa' },
    { label: 'Engagement', value: 0.72, color: '#ff4466' },
  ], [memberCount, dunaTarget, coherence]);

  useFrame(({ clock }) => {
    time.current = clock.getElapsedTime();
    if (!groupRef.current) return;
    groupRef.current.rotation.y -= 0.0005 * (0.5 + 0.5 * (spoons / 5));
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <icosahedronGeometry args={[radius, 1]} />
        <meshBasicMaterial
          color={0xd9a066}
          wireframe
          transparent
          opacity={0.15 + 0.1 * coherence}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {statNodes.map((node, i) => {
        const angle = (i / statNodes.length) * Math.PI * 2;
        const pos = new THREE.Vector3(
          radius * 0.8 * Math.cos(angle),
          radius * 0.8 * Math.sin(angle),
          0
        );
        return (
          <group key={i} position={pos}>
            <mesh>
              <sphereGeometry args={[0.15, 12, 12]} />
              <meshStandardMaterial
                color={node.color}
                emissive={node.color}
                emissiveIntensity={0.3 + 0.3 * node.value}
                roughness={0.2}
                metalness={0.5}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
