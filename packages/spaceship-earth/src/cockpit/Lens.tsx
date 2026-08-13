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
import SceneProbe from '../verify/SceneProbe';

export default function Lens({
  spoons = 5,
  starCount = 1600,
  frameInterval = 16.67,
  lastFrameRef,
}: {
  spoons?: number;
  starCount?: number;
  frameInterval?: number;
  lastFrameRef?: React.RefObject<number>;
}) {
  const cyanLightRef = useRef<THREE.PointLight>(null);
  const amberLightRef = useRef<THREE.PointLight>(null);
  const time = useRef(0);
  const lastNotifPulse = useShipStore((s) => s.lastNotifPulse || 0);
  const highUnread = useShipStore((s) => s.highUnread || 0);
  const speedFactor = Math.max(0.05, spoons / 5);

  useFrame((_, delta) => {
    if (lastFrameRef && frameInterval > 0) {
      const now = performance.now();
      if (now - lastFrameRef.current < frameInterval) return;
      lastFrameRef.current = now;
    }

    time.current += delta * speedFactor;
    const t = time.current;

    if (cyanLightRef.current) {
      const r = 8;
      cyanLightRef.current.position.set(
        r * Math.sin(t * 0.6),
        r * Math.sin(t * 0.4),
        r * Math.cos(t * 0.6)
      );
      cyanLightRef.current.intensity = 0.6 * speedFactor;
    }

    if (amberLightRef.current) {
      const r = 6;
      amberLightRef.current.position.set(
        r * Math.sin(t * 0.2),
        r * Math.cos(t * 0.25),
        r * Math.sin(t * 0.3)
      );
      amberLightRef.current.intensity = 0.5 * speedFactor;
    }
  });

  return (
    <group>
      <ambientLight intensity={0.1 * speedFactor} />
      <pointLight ref={cyanLightRef} intensity={0.6 * speedFactor} color={0x22d3ee} distance={30} decay={1.5} />
      <pointLight ref={amberLightRef} intensity={0.5 * speedFactor} color={0xf59e0b} distance={30} decay={1.5} />

      {/* GPU Starfield (in-canvas, 3D points far away) */}
      <StarfieldField
        count={starCount}
        spoons={spoons}
        highUnread={highUnread}
        pulseAt={lastNotifPulse}
        warm="#d9a066"
        cool="#8a7a68"
      />

      {/* Outer Aesthetic (ice shell + NeoPixel + tetra frame + graph) */}
      <OuterDome>
        <GraphNodes />
        <GraphEdges />
        <K4Wireframe />
      </OuterDome>
      <TetraCraft />
      <SceneProbe />
    </group>
  );
}
