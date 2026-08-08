import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useShipStore } from '../store/shipStore';

const NODE_RADIUS = 2.4;

export default function Nodes() {
  const { nodePositions, nodeData, selectedNode, setSelectedNode, spoons, coherence } = useShipStore();
  const coreRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.InstancedMesh>(null);
  const haloRef = useRef<THREE.InstancedMesh>(null);
  const time = useRef(0);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  const coreGeo = useMemo(() => new THREE.SphereGeometry(0.12, 24, 24), []);
  const glowGeo = useMemo(() => new THREE.SphereGeometry(0.22, 16, 16), []);
  const haloGeo = useMemo(() => new THREE.SphereGeometry(0.30, 16, 16), []);

  // Pre-compute initial transforms and colors
  useEffect(() => {
    if (!coreRef.current || !glowRef.current || !haloRef.current) return;

    nodePositions.forEach((pos, i) => {
      dummy.position.set(...pos);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();

      coreRef.current!.setMatrixAt(i, dummy.matrix);
      glowRef.current!.setMatrixAt(i, dummy.matrix);
      haloRef.current!.setMatrixAt(i, dummy.matrix);

      tempColor.set(nodeData[i].color);
      coreRef.current!.setColorAt(i, tempColor);
      glowRef.current!.setColorAt(i, tempColor);
      haloRef.current!.setColorAt(i, tempColor);
    });

    coreRef.current.instanceMatrix.needsUpdate = true;
    glowRef.current.instanceMatrix.needsUpdate = true;
    haloRef.current.instanceMatrix.needsUpdate = true;
    coreRef.current.instanceColor!.needsUpdate = true;
    glowRef.current.instanceColor!.needsUpdate = true;
    haloRef.current.instanceColor!.needsUpdate = true;
  }, [nodePositions, nodeData, dummy, tempColor]);

  // Animate pulse
  useFrame(({ clock }) => {
    time.current = clock.getElapsedTime();
    if (!coreRef.current || !glowRef.current || !haloRef.current) return;

    nodePositions.forEach((pos, i) => {
      const pulse = 0.85 + 0.15 * Math.sin(time.current * (1.2 + i * 0.1) + i * 2.3);
      dummy.position.set(...pos);
      dummy.scale.setScalar(pulse);
      dummy.updateMatrix();

      coreRef.current!.setMatrixAt(i, dummy.matrix);
      glowRef.current!.setMatrixAt(i, dummy.matrix);
      haloRef.current!.setMatrixAt(i, dummy.matrix);
    });

    coreRef.current.instanceMatrix.needsUpdate = true;
    glowRef.current.instanceMatrix.needsUpdate = true;
    haloRef.current.instanceMatrix.needsUpdate = true;

    // Update halo visibility for selected node
    if (selectedNode !== null) {
      const haloOpacity = 0.2 + 0.15 * Math.sin(time.current * 3);
      tempColor.set(0xffffff);
      haloRef.current.setColorAt(selectedNode, tempColor);
      haloRef.current.instanceColor!.needsUpdate = true;
    }
  });

  const glowIntensity = 0.3 + 0.7 * coherence * (spoons / 5);

  return (
    <>
      <instancedMesh ref={coreRef} args={[coreGeo, undefined, nodePositions.length]}>
        <meshStandardMaterial
          emissiveIntensity={0.5 * glowIntensity}
          roughness={0.15}
          metalness={0.1}
        />
      </instancedMesh>

      <instancedMesh ref={glowRef} args={[glowGeo, undefined, nodePositions.length]}>
        <meshBasicMaterial
          transparent
          opacity={0.12 * glowIntensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>

      <instancedMesh ref={haloRef} args={[haloGeo, undefined, nodePositions.length]}>
        <meshBasicMaterial
          transparent
          opacity={selectedNode !== null ? 0.2 : 0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
    </>
  );
}
