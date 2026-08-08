import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useShipStore } from '../store/shipStore';

export default function CameraRig() {
  const controlsRef = useRef<any>(null);
  const selectedPort = useShipStore((s) => s.selectedPort);
  const portPositions = useShipStore((s) => s.portPositions);
  const spoons = useShipStore((s) => s.spoons);
  const desiredTarget = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (selectedPort !== null && selectedPort < portPositions.length) {
      desiredTarget.current.copy(new THREE.Vector3(...portPositions[selectedPort]));
    } else {
      desiredTarget.current.set(0, 0, 0);
    }
  }, [selectedPort, portPositions]);

  useFrame((_, delta) => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;
    const f = 1 - Math.exp(-3 * delta);
    ctrl.target.lerp(desiredTarget.current, f);
    ctrl.autoRotateSpeed = 0.3 + (spoons / 5) * 0.3;
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={8}
      maxDistance={50}
      autoRotate={selectedPort === null}
      enablePan
      enableZoom
    />
  );
}
