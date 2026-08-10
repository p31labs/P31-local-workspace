/**
 * @file cockpit/GraphNodes.tsx — P31 Graph Nodes (58 Instanced Spheres)
 *
 * Nodes sit on the outer dome surface (R=12, detail=2).
 * Dome vertex assignment via domeMap — axis‑aware, one vertex per node.
 */

import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import {
  VERTICES,
  getGraphNodeColor,
  STATE_GLOW,
  shouldPulse,
} from '@p31/shared';
import { useShipStore } from '../store/shipStore';
import { DOME_VERTICES, assignNodeVertices } from '../math/domeMap';
import type { Axis } from '../math/domeMap';

const NODE_COUNT = 58;

export default function GraphNodes() {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const coreRef = useRef<THREE.InstancedMesh>(null!);
  const setSelectedNode = useShipStore((s) => s.setSelectedNode);
  const setSelectedPort = useShipStore((s) => s.setSelectedPort);

  const nodes = useMemo(() => {
    const axisCounts: Record<Axis, number> = { body: 0, mesh: 0, forge: 0, shield: 0 };
    for (const v of VERTICES) {
      const a = v.axis.toLowerCase() as Axis;
      axisCounts[a] = (axisCounts[a] || 0) + 1;
    }
    const vertexIndices = assignNodeVertices(axisCounts);

    return VERTICES.slice(0, NODE_COUNT).map((node, i) => ({
      ...node,
      position: new THREE.Vector3(...DOME_VERTICES[vertexIndices[i] ?? 0]),
      color: getGraphNodeColor(node),
      glow: STATE_GLOW[node.state],
    }));
  }, []);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    nodes.forEach((node, i) => {
      dummy.position.copy(node.position);
      dummy.scale.setScalar(node.glow.scale);
      dummy.updateMatrix();
      coreRef.current.setMatrixAt(i, dummy.matrix);
      color.setRGB(node.color[0] / 255, node.color[1] / 255, node.color[2] / 255);
      coreRef.current.setColorAt(i, color);
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

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const dummy = new THREE.Object3D();
    let updated = false;
    nodes.forEach((node, i) => {
      if (shouldPulse(node)) {
        const pulse = 1 + 0.15 * Math.sin(t * 2);
        dummy.position.copy(node.position);
        dummy.scale.setScalar(node.glow.scale * pulse);
        dummy.updateMatrix();
        coreRef.current.setMatrixAt(i, dummy.matrix);
        dummy.scale.setScalar(node.glow.scale * pulse * 1.4);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        updated = true;
      }
    });
    if (updated) {
      coreRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current.instanceMatrix.needsUpdate = true;
      coreRef.current.computeBoundingSphere();
      meshRef.current.computeBoundingSphere();
    }
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.instanceId !== undefined) {
      setSelectedPort(null);
      setSelectedNode(e.instanceId);
      console.log('[GraphNodes] Selected:', nodes[e.instanceId].id, nodes[e.instanceId].label);
    }
  }, [setSelectedNode, setSelectedPort, nodes]);

  const handlePointerOver = useCallback(() => {
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback(() => {
    document.body.style.cursor = '';
  }, []);

  return (
    <group name="graph-nodes">
      <instancedMesh ref={coreRef} args={[undefined, undefined, NODE_COUNT]} onClick={handleClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        <sphereGeometry args={[0.12, 16, 12]} />
        <meshStandardMaterial metalness={0.3} roughness={0.6} emissive={0x44aaff} emissiveIntensity={0.3} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={meshRef} args={[undefined, undefined, NODE_COUNT]} renderOrder={-1} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        <sphereGeometry args={[0.12, 16, 12]} />
        <meshBasicMaterial transparent opacity={0.4} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}
