/**
 * @file cockpit/GraphNodes.tsx — Data-driven dome nodes
 *
 * Reads the canonical vertex layer (`useActiveVertexData`) plus the layout
 * manager's settled positions. Node count, positions, and colors all come from
 * the active dataset — there is no static VERTICES table. During a
 * live-settlement the nodes glide to their positions; otherwise they fade in
 * locked.
 */

import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useShipStore } from '../store/shipStore';
import { useActiveVertexData } from '../store/datasetStore';
import { useGraphLayout } from '../hooks/useGraphLayout';
import { DOME_VERTICES } from '../math/domeMap';

export default function GraphNodes() {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const coreRef = useRef<THREE.InstancedMesh>(null!);
  const setSelectedNode = useShipStore((s) => s.setSelectedNode);
  const setSelectedPort = useShipStore((s) => s.setSelectedPort);
  const selectedNode = useShipStore((s) => s.selectedNode);
  const setNodeScreenPos = useShipStore((s) => s.setNodeScreenPos);
  const setNodeVisible = useShipStore((s) => s.setNodeVisible);
  const spoons = useShipStore((s) => s.spoons);

  const vertexData = useActiveVertexData();
  const { positions, status, strategy } = useGraphLayout();

  // Active nodes: skip the empty "unlit" placeholders from the vertex layer.
  const nodes = useMemo(() => vertexData.filter((v) => v.value !== null), [vertexData]);

  // Settled/target positions for every active node (layout first, else dome vertex).
  const targets = useMemo(() => {
    const arr = new Float32Array(nodes.length * 3);
    for (let i = 0; i < nodes.length; i++) {
      const laid = nodes[i].id ? positions?.[nodes[i].id!] : undefined;
      const vi = nodes[i].vertexIndex;
      const src = laid ?? (vi >= 0 && vi < DOME_VERTICES.length ? DOME_VERTICES[vi] : [0, 0, 0]);
      arr[i * 3] = src[0];
      arr[i * 3 + 1] = src[1];
      arr[i * 3 + 2] = src[2];
    }
    return arr;
  }, [nodes, positions]);

  const current = useRef(new Float32Array(0));
  const firstRun = useRef(true);
  const lastVisibleRef = useRef(false);
  const count = nodes.length;
  const live = strategy === 'live-settlement';

  useEffect(() => {
    current.current = new Float32Array(targets);
    firstRun.current = true;
  }, [targets]);

  useEffect(() => {
    if (!coreRef.current || !meshRef.current) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const v = nodes[i];
      color.set(v.color || '#22d3ee');
      dummy.position.set(current.current[i * 3], current.current[i * 3 + 1], current.current[i * 3 + 2]);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      coreRef.current.setMatrixAt(i, dummy.matrix);
      coreRef.current.setColorAt(i, color);
      dummy.scale.setScalar(1.4);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, color.clone().multiplyScalar(0.6));
    }
    coreRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (coreRef.current.instanceColor) coreRef.current.instanceColor.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    coreRef.current.computeBoundingSphere();
    meshRef.current.computeBoundingSphere();
  }, [nodes, count]);

  useFrame(({ clock, camera, size }, delta) => {
    if (!coreRef.current || !meshRef.current) return;
    const t = clock.getElapsedTime();
    const dummy = new THREE.Object3D();
    const lerp = live ? Math.min(1, delta * 8) : 1;
    const pulse = spoons >= 2 ? 1 + 0.08 * (spoons / 5) * Math.sin(t * 2) : 1;
    let moved = false;
    for (let i = 0; i < count; i++) {
      const cx = current.current[i * 3];
      const cy = current.current[i * 3 + 1];
      const cz = current.current[i * 3 + 2];
      const nx = cx + (targets[i * 3] - cx) * lerp;
      const ny = cy + (targets[i * 3 + 1] - cy) * lerp;
      const nz = cz + (targets[i * 3 + 2] - cz) * lerp;
      current.current[i * 3] = nx;
      current.current[i * 3 + 1] = ny;
      current.current[i * 3 + 2] = nz;
      if (firstRun.current || Math.abs(nx - cx) > 1e-5 || Math.abs(ny - cy) > 1e-5 || Math.abs(nz - cz) > 1e-5) {
        dummy.position.set(nx, ny, nz);
        dummy.scale.setScalar(pulse);
        dummy.updateMatrix();
        coreRef.current.setMatrixAt(i, dummy.matrix);
        dummy.scale.setScalar(pulse * 1.4);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        moved = true;
      }
    }
    firstRun.current = false;
    if (moved) {
      coreRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Project the selected node for the HUD tooltip (world-space via the dome group).
    if (selectedNode !== null && selectedNode < count) {
      const wp = new THREE.Vector3(
        current.current[selectedNode * 3],
        current.current[selectedNode * 3 + 1],
        current.current[selectedNode * 3 + 2],
      );
      coreRef.current.localToWorld(wp);
      const projected = wp.clone().project(camera);
      setNodeScreenPos({
        x: (projected.x * 0.5 + 0.5) * size.width,
        y: (-projected.y * 0.5 + 0.5) * size.height,
      });
      const visible = projected.z < 1;
      if (visible !== lastVisibleRef.current) {
        lastVisibleRef.current = visible;
        setNodeVisible(visible);
      }
    } else if (lastVisibleRef.current) {
      lastVisibleRef.current = false;
      setNodeVisible(false);
    }
  });

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.instanceId !== undefined) {
        setSelectedPort(null);
        setSelectedNode(e.instanceId);
      }
    },
    [setSelectedNode, setSelectedPort],
  );

  const hidden = status === 'settling' && strategy === 'locked-only' && positions === null;
  if (hidden || count === 0) return null;

  return (
    <group name="graph-nodes">
      <instancedMesh ref={coreRef} args={[undefined, undefined, Math.max(1, count)]} onClick={handleClick} onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = '')}>
        <sphereGeometry args={[0.12, 16, 12]} />
        <meshStandardMaterial metalness={0.3} roughness={0.6} emissive={0x44aaff} emissiveIntensity={0.3} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={meshRef} args={[undefined, undefined, Math.max(1, count)]} renderOrder={-1} onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = '')}>
        <sphereGeometry args={[0.12, 16, 12]} />
        <meshBasicMaterial transparent opacity={0.4} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}
