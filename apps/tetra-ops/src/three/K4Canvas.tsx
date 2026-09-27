import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useMemo } from 'react';
import { Tetrahedron } from './Tetrahedron';
import { PosnerMolecule } from './PosnerMolecule';
import { CradleScene } from './CradleScene';
import { WorkerMesh } from './WorkerMesh';
import { useSpoonStore } from '../state/spoonStore';
import type { SceneKind } from '../state/spoonStore';
import { K4Graph } from '@p31ca/quantum-core';

const k4Topology = new K4Graph();

export function K4Canvas({ scene }: { scene: SceneKind }) {
  const spoons = useSpoonStore((s) => s.spoons);
  const autoRotate = spoons > 1;
  const autoRotateSpeed = spoons <= 2 ? 0.3 : spoons === 3 ? 1 : spoons === 4 ? 0.7 : 1.4;

  const colors = useMemo(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      accent: s.getPropertyValue('--p31-accent').trim() || '#00f0ff',
      violet: s.getPropertyValue('--p31-accent-violet').trim() || '#a78bfa',
      gold: s.getPropertyValue('--p31-accent-gold').trim() || '#fbbf24',
      green: s.getPropertyValue('--p31-accent-green').trim() || '#34d399',
      bg: s.getPropertyValue('--p31-bg').trim() || '#0a0a0f',
    };
  }, []);

  return (
    <Canvas camera={{ position: [0, 0.4, 6.5], fov: 44 }} dpr={[1, 2]} gl={{ alpha: true }} style={{ background: 'transparent' }}>
      <ambientLight intensity={3} color={colors.bg} />
      <directionalLight position={[5, 8, 4]} intensity={2.2} color={colors.accent} />
      <directionalLight position={[-4, -3, -3]} intensity={1.8} color={colors.violet} />
      <directionalLight position={[2, -4, 2]} intensity={1.2} color={colors.gold} />
      <gridHelper args={[14, 56, '#14203a', '#0b1220']} position={[0, -2.4, 0]} />
      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={12}
        autoRotate={autoRotate}
        autoRotateSpeed={autoRotateSpeed}
      />
      <Suspense fallback={null}>
        {scene === 'tetra' ? (
          <>
            <Tetrahedron />
            <WorkerMesh />
          </>
        ) : scene === 'posner' ? <PosnerMolecule /> : <CradleScene />}
      </Suspense>
    </Canvas>
  );
}
