import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useHealthStore, WORKERS } from '../state/healthStore';
import { useSpoonStore } from '../state/spoonStore';

// Fibonacci sphere distribution for workers around the core tetrahedron
function fibonacciSphere(n: number, radius: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = ((1 + Math.sqrt(5)) / 2) * i;
    pts.push([radius * r * Math.cos(theta), radius * y, radius * r * Math.sin(theta)]);
  }
  return pts;
}

const WORKER_POSITIONS = fibonacciSphere(WORKERS.length, 2.8);

const HEALTH_COLORS = {
  healthy: '#34d399',
  down: '#fb7185',
  pending: 'rgba(240,242,245,0.2)',
} as const;

export function WorkerMesh() {
  const groupRef = useRef<THREE.Group>(null);
  const workerHealth = useHealthStore((s) => s.workerHealth);

  // Start shared health polling (idempotent — only one interval runs)
  useEffect(() => {
    const store = useHealthStore.getState();
    store.start();
  }, []);

  useFrame((_, delta) => {
    const spoons = useSpoonStore.getState().spoons;
    if (!groupRef.current || spoons <= 1) return;
    const speed = spoons <= 2 ? 0.04 : spoons === 3 ? 0.1 : spoons === 4 ? 0.08 : 0.16;
    groupRef.current.rotation.y += delta * speed;
  });

  return (
    <group ref={groupRef}>
      {WORKERS.map((w, i) => {
        const pos = WORKER_POSITIONS[i];
        const up = workerHealth[w.name];
        const alive = up === true;
        const unknown = up === null;
        const color = unknown ? HEALTH_COLORS.pending : alive ? HEALTH_COLORS.healthy : HEALTH_COLORS.down;

        return (
          <group key={w.name} position={pos}>
            <mesh>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={unknown ? 0 : 0.3}
                roughness={0.2}
                metalness={0.1}
                toneMapped={false}
              />
            </mesh>
            <Text
              position={[0, 0.22, 0]}
              fontSize={0.08}
              color={color}
              anchorX="center"
              anchorY="bottom"
              font="https://cdn.jsdelivr.net/npm/three@0.163.0/examples/fonts/helvetiker_regular.typeface.json"
            >
              {w.name}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
