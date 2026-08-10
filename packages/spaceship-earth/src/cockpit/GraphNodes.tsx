/**
 * @file cockpit/GraphNodes.tsx — P31 Graph Nodes (58 Instanced Spheres)
 *
 * Nodes sit on the outer dome surface (R=12, detail=2).
 * 58 vertices picked from 162, grouped by 4 tetrahedron axes.
 * Click-select via raycaster (instanceId → node.id).
 * State-driven glow/scale (countdown pulse, crisis bump).
 */

import { useRef, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import {
  VERTICES,
  getGraphNodeColor,
  STATE_GLOW,
  shouldPulse,
} from '@p31/shared';
import { useShipStore } from '../store/shipStore';

const DOME_RADIUS = 12;
const NODE_COUNT = 58;

const AXIS_DIRS: [string, THREE.Vector3][] = [
  ['body', new THREE.Vector3(1, 1, 1).normalize()],
  ['mesh', new THREE.Vector3(1, -1, -1).normalize()],
  ['forge', new THREE.Vector3(-1, 1, -1).normalize()],
  ['shield', new THREE.Vector3(-1, -1, 1).normalize()],
];

export function pickDomeVertices(count: number): { positions: THREE.Vector3[]; indices: number[] } {
  const geo = new THREE.IcosahedronGeometry(DOME_RADIUS, 2);
  const pos = geo.getAttribute('position');
  const all: THREE.Vector3[] = [];
  for (let i = 0; i < pos.count; i++) {
    all.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
  }

  const groups = new Map<string, { idx: number; dot: number }[]>();
  for (const [name] of AXIS_DIRS) groups.set(name, []);

  for (let i = 0; i < all.length; i++) {
    const dir = all[i].clone().normalize();
    let best = '';
    let bestDot = -Infinity;
    for (const [name, ax] of AXIS_DIRS) {
      const d = dir.dot(ax);
      if (d > bestDot) { bestDot = d; best = name; }
    }
    groups.get(best)!.push({ idx: i, dot: bestDot });
  }

  const perAxis = Math.ceil(count / AXIS_DIRS.length);
  const positions: THREE.Vector3[] = [];
  const indices: number[] = [];
  for (const [name] of AXIS_DIRS) {
    const sorted = groups.get(name)!.sort((a, b) => b.dot - a.dot);
    for (let i = 0; i < Math.min(perAxis, sorted.length); i++) {
      positions.push(all[sorted[i].idx]);
      indices.push(sorted[i].idx);
    }
  }

  while (indices.length > count) { positions.pop(); indices.pop(); }
  const seen = new Set(indices);
  for (let i = 0; i < all.length && indices.length < count; i++) {
    if (!seen.has(i)) { positions.push(all[i]); indices.push(i); seen.add(i); }
  }

  return { positions, indices };
}

export default function GraphNodes() {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const coreRef = useRef<THREE.InstancedMesh>(null!);
  const setSelectedNode = useShipStore((s) => s.setSelectedNode);

  const domeSelection = useRef(pickDomeVertices(NODE_COUNT)).current;

  const nodes = useRef(
    VERTICES.slice(0, NODE_COUNT).map((node, i) => ({
      ...node,
      position: domeSelection.positions[i].clone(),
      color: getGraphNodeColor(node),
      glow: STATE_GLOW[node.state],
    }))
  ).current;

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
      <instancedMesh ref={coreRef} args={[undefined, undefined, NODE_COUNT]} onClick={handleClick}>
        <sphereGeometry args={[0.12, 16, 12]} />
        <meshStandardMaterial metalness={0.3} roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={meshRef} args={[undefined, undefined, NODE_COUNT]} renderOrder={-1}>
        <sphereGeometry args={[0.12, 16, 12]} />
        <meshBasicMaterial transparent opacity={0.4} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}
