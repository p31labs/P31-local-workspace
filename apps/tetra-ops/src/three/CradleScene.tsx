/**
 * @file CradleScene — Cosmic Cradle 3D visualization.
 *
 * 4 planetary spheres at K4 tetrahedron vertices + 6 pulsing edge lines
 * pulsing at 863 Hz + Grand Trine glowing triangle + Moon orbit.
 * Spoon-aware animation via useFrame.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { TV } from './Tetrahedron';
import { useSpoonStore } from '../state/spoonStore';

const PLANETS = [
  { name: 'JUPITER', label: 'Jupiter · Cancer 10°', color: '#fbbf24', em: 0x2a1800 },
  { name: 'URANUS',  label: 'Uranus · Taurus 10°',  color: '#00f0ff', em: 0x001218 },
  { name: 'NEPTUNE', label: 'Neptune · Pisces 10°',  color: '#a78bfa', em: 0x0a0020 },
  { name: 'PLUTO',   label: 'Pluto · Capricorn 10°', color: '#34d399', em: 0x001808 },
];

const EDGES = [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]] as const;

// Grand Trine: Moon (between Uranus=1 and Pluto=3), with top midpoint
function trineMidpoint(): [number,number,number] {
  const u = TV[1];
  const p = TV[3];
  return [(u[0]+p[0])/2, (u[1]+p[1])/2, (u[2]+p[2])/2];
}

/** Pulsing edge line between two vertex indices */
function CradleEdge({ a, b }: { a: number; b: number }) {
  const matRef = useRef<THREE.LineBasicMaterial>(null);
  const va = TV[a]; const vb = TV[b];
  const positions = useRef(new Float32Array([va[0], va[1], va[2], vb[0], vb[1], vb[2]])).current;

  useFrame(() => {
    if (!matRef.current) return;
    const t = Date.now() * 0.001;
    const pulse = 0.3 + 0.4 * Math.sin(t * Math.PI * 2 * 863 * 0.01);
    matRef.current.opacity = Math.max(0.2, Math.min(0.9, pulse));
  });

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[new Float32Array([va[0], va[1], va[2], vb[0], vb[1], vb[2]]), 3]} />
      </bufferGeometry>
      <lineBasicMaterial ref={matRef} color="#f0f0ff" transparent opacity={0.5} />
    </line>
  );
}

export function CradleScene() {
  const ref = useRef<THREE.Group>(null);
  const moonRef = useRef<THREE.Group>(null);
  const startTime = useRef(Date.now());

  useFrame(() => {
    const s = useSpoonStore.getState().spoons;
    if (s <= 1) return;
    const speed = s <= 2 ? 0.08 : s === 3 ? 0.2 : s === 4 ? 0.14 : 0.32;
    if (ref.current) ref.current.rotation.y += speed * 0.016;
    // Moon orbit around Grand Trine vertices
    if (moonRef.current) {
      const elapsed = (Date.now() - startTime.current) / 1000;
      const cycle = elapsed % 8; // 8-second orbit
      const idx = Math.floor(cycle / (8/3)) % 3;
      const next = (idx + 1) % 3;
      const t = (cycle % (8/3)) / (8/3);
      const triVerts = [TV[1], TV[3], trineMidpoint()];
      const a = triVerts[idx];
      const b = triVerts[next];
      moonRef.current.position.set(
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
      );
    }
  });

  return (
    <group ref={ref}>
      {/* Planetary spheres */}
      {PLANETS.map((p, i) => (
        <group key={i}>
          <mesh position={TV[i]}>
            <sphereGeometry args={[0.28, 32, 32]} />
            <meshStandardMaterial
              color={p.color}
              emissive={p.em}
              emissiveIntensity={0.6}
              roughness={0.1}
              metalness={0.3}
              toneMapped={false}
            />
          </mesh>
          <Text
            position={[TV[i][0], TV[i][1] + 0.6, TV[i][2]]}
            fontSize={0.18}
            color={p.color}
            anchorX="center"
            anchorY="bottom"
            font="https://cdn.jsdelivr.net/npm/three@0.163.0/examples/fonts/helvetiker_regular.typeface.json"
          >
            {p.label}
          </Text>
        </group>
      ))}

      {/* Pulsing edges at 863 Hz */}
      {EDGES.map(([a, b]) => (
        <CradleEdge key={`${a}-${b}`} a={a} b={b} />
      ))}

      {/* Grand Trine triangle: Uranus(1)–Pluto(3)–Midpoint */}
      <mesh>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([...TV[1], ...TV[3], ...trineMidpoint()]), 3]} />
        </bufferGeometry>
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Moon — small white sphere orbiting the Grand Trine */}
      <group ref={moonRef}>
        <mesh>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <Text position={[0, 0.2, 0]} fontSize={0.12} color="#fbbf24" anchorX="center" font="https://cdn.jsdelivr.net/npm/three@0.163.0/examples/fonts/helvetiker_regular.typeface.json">
          ☽ Moon · Virgo
        </Text>
      </group>
    </group>
  );
}

export default CradleScene;
