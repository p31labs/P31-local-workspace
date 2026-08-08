import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useShipStore } from '../store/shipStore';
import OuterDome from './OuterDome';
import TetraCraft from './TetraCraft';
import InnerDome from './InnerDome';

export default function Lens() {
  const cyanLightRef = useRef<THREE.PointLight>(null);
  const amberLightRef = useRef<THREE.PointLight>(null);
  const time = useRef(0);

  useFrame(({ clock }) => {
    time.current = clock.getElapsedTime();
    const t = time.current;

    if (cyanLightRef.current) {
      const r = 8;
      cyanLightRef.current.position.set(
        r * Math.sin(t * 0.6),
        r * Math.sin(t * 0.4),
        r * Math.cos(t * 0.6)
      );
    }

    if (amberLightRef.current) {
      const r = 6;
      amberLightRef.current.position.set(
        r * Math.sin(t * 0.2),
        r * Math.cos(t * 0.25),
        r * Math.sin(t * 0.3)
      );
    }
  });

  return (
    <group>
      <ambientLight intensity={0.1} />
      <pointLight ref={cyanLightRef} intensity={0.6} color={0x22d3ee} distance={30} decay={1.5} />
      <pointLight ref={amberLightRef} intensity={0.5} color={0xf59e0b} distance={30} decay={1.5} />

      <OuterDome />
      <TetraCraft />
      <InnerDome />
    </group>
  );
}
