// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Starfield — Persistent molecular field background
//
// Lightweight R3F Canvas with MolecularWarp in gentle drift.
// Used behind ModeSelect and Lobby so the molecular field
// is visible throughout the entire app flow.
// ═══════════════════════════════════════════════════════

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { MolecularWarp } from './MolecularWarp';

function DriftingMolecules() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.01;
  });
  return (
    <group ref={ref}>
      <MolecularWarp />
    </group>
  );
}

export function Starfield() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={60} />
        <color attach="background" args={['#000000']} />
        <DriftingMolecules />
      </Canvas>
    </div>
  );
}
