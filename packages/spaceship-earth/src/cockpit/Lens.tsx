import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useShipStore } from '../store/shipStore';
import OuterDome from './OuterDome';
import TetraCraft from './TetraCraft';
import GraphNodes from './GraphNodes';
import GraphEdges from './GraphEdges';
import { StarfieldField } from './StarfieldField';
import K4Wireframe from './K4Wireframe';

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

  const spoons = useShipStore((s) => s.spoons);
  const lastNotifPulse = useShipStore((s) => s.lastNotifPulse || 0);
  const highUnread = useShipStore((s) => s.highUnread || 0);

  return (
    <group>
      <ambientLight intensity={0.1} />
      <pointLight ref={cyanLightRef} intensity={0.6} color={0x22d3ee} distance={30} decay={1.5} />
      <pointLight ref={amberLightRef} intensity={0.5} color={0xf59e0b} distance={30} decay={1.5} />

      {/* GPU Starfield (in-canvas, 3D points far away) */}
      <StarfieldField
        count={1600}
        spoons={spoons}
        highUnread={highUnread}
        pulseAt={lastNotifPulse}
        warm="#d9a066"
        cool="#8a7a68"
      />

      {/* Outer Aesthetic (ice shell + NeoPixel + tetra frame) */}
      <OuterDome />
      <TetraCraft />

      {/* Graph Interior — nodes/edges on dome surface */}
      <GraphNodes />
      <GraphEdges />
      <K4Wireframe />
    </group>
  );
}
