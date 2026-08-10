/**
 * @file cockpit/GraphNodes.tsx — P31 Graph Nodes (58 Instanced Spheres)
 * 
 * InstancedMesh renders all 58 nodes in a single draw call.
 * Positioned via baryToPosition (barycentric → geodesic shell @ R=7).
 * Click-select via raycaster (instanceId → node.id).
 * State-driven glow/scale (countdown pulse, crisis bump).
 */

import { useRef, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import {
  VERTICES,
  baryToPosition,
  getGraphNodeColor,
  STATE_GLOW,
  shouldPulse,
  type NodeInfo,
} from '@p31/shared';
import { useShipStore } from '../store/shipStore';

export default function GraphNodes() {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const coreRef = useRef<THREE.InstancedMesh>(null!);
  const setSelectedNode = useShipStore((s) => s.setSelectedNode);
  const selectedNode = useShipStore((s) => s.selectedNode);

  const nodes = useRef(
    VERTICES.map((node) => ({
      ...node,
      position: baryToPosition(node, 7),
      color: getGraphNodeColor(node),
      glow: STATE_GLOW[node.state],
    }))
  ).current;

  // Initialize instance matrices + colors
  useEffect(() => {
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    nodes.forEach((node, i) => {
      // Core sphere
      dummy.position.set(...node.position);
      dummy.scale.setScalar(node.glow.scale);
      dummy.updateMatrix();
      coreRef.current.setMatrixAt(i, dummy.matrix);
      color.setRGB(node.color[0] / 255, node.color[1] / 255, node.color[2] / 255);
      coreRef.current.setColorAt(i, color);

      // Glow sphere (slightly larger)
      dummy.scale.setScalar(node.glow.scale * 1.4);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, color.multiplyScalar(0.6));
    });

    coreRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (coreRef.current.instanceColor) coreRef.current.instanceColor.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    coreRef.current.computeBoundingSphere();
    meshRef.current.computeBoundingSphere();
  }, [nodes]);

  // Animate countdown/pulse nodes
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const dummy = new THREE.Object3D();

    nodes.forEach((node, i) => {
      if (shouldPulse(node)) {
        const pulse = 1 + 0.15 * Math.sin(t * 2);
        dummy.position.set(...node.position);
        dummy.scale.setScalar(node.glow.scale * pulse);
        dummy.updateMatrix();
        coreRef.current.setMatrixAt(i, dummy.matrix);

        dummy.scale.setScalar(node.glow.scale * pulse * 1.4);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
    });

    coreRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceMatrix.needsUpdate = true;
    coreRef.current.computeBoundingSphere();
    meshRef.current.computeBoundingSphere();
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.instanceId !== undefined) {
      const node = nodes[e.instanceId];
      setSelectedNode(e.instanceId);
      console.log('[GraphNodes] Selected:', node.id, node.label);
    }
  };

  return (
    <group name="graph-nodes">
      {/* Core spheres (opaque) */}
      <instancedMesh
        ref={coreRef}
        args={[undefined, undefined, 58]}
        onClick={handleClick}
      >
        <sphereGeometry args={[0.12, 16, 12]} />
        <meshStandardMaterial metalness={0.3} roughness={0.6} />
      </instancedMesh>

      {/* Glow spheres (emissive) */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, 58]}
        onClick={handleClick}
        renderOrder={-1}
      >
        <sphereGeometry args={[0.12, 16, 12]} />
        <meshBasicMaterial transparent opacity={0.4} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}
