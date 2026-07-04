import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EntanglementLineProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
}

export function EntanglementLine({ start, end }: EntanglementLineProps) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array([
      start.x, start.y, start.z,
      end.x, end.y, end.z,
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [start, end]);

  const material = useMemo(() => new THREE.LineBasicMaterial({
    color: '#00FF88',
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  useFrame(({ clock }) => {
    material.opacity = 0.08 + 0.1 * Math.sin(clock.getElapsedTime() * 0.5);
  });

  return (
    <lineSegments geometry={geometry} material={material} />
  );
}

export default EntanglementLine;
