import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useShipStore } from '../store/shipStore';

export default function AmbientField() {
  const coherence = useShipStore((s) => s.coherence);
  const pointsRef = useRef<THREE.Points>(null);
  const count = 2000;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 10 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  useEffect(() => () => {
    geometry.dispose();
  }, [geometry]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const density = 0.3 + 0.7 * coherence;
    pointsRef.current.rotation.y += 0.00015 * density;
    pointsRef.current.rotation.x += 0.00005 * density;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial color={0x88aaff} size={0.05} transparent opacity={0.4}
        blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}
