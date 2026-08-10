/**
 * @file cockpit/GraphNodes.tsx — P31 Graph Nodes (58 Instanced Spheres)
 *
 * Nodes sit on the outer dome surface (R=12, detail=2).
 * 58 vertices picked from 162, grouped by 4 tetrahedron axes.
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
import { icosahedronGeodesic } from '../math/geodesic';

const DOME_RADIUS = 12;
const NODE_COUNT = 58;

const AXIS_DIRS: ReadonlyArray<[string, number[]]> = [
  ['body', [1, 1, 1]],
  ['mesh', [1, -1, -1]],
  ['forge', [-1, 1, -1]],
  ['shield', [-1, -1, 1]],
];

export function pickDomeVertices(count: number): { positions: [number, number, number][]; indices: number[] } {
  const shell = icosahedronGeodesic(DOME_RADIUS, 2);
  const { vertices } = shell;

  function dot(a: [number, number, number], b: number[]): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function len(b: number[]): number {
    return Math.sqrt(b[0] * b[0] + b[1] * b[1] + b[2] * b[2]);
  }

  const groups: Map<string, { idx: number; dot: number }[]> = new Map();
  for (const [name] of AXIS_DIRS) groups.set(name, []);

  for (let i = 0; i < vertices.length; i++) {
    const dirLen = Math.sqrt(vertices[i][0] ** 2 + vertices[i][1] ** 2 + vertices[i][2] ** 2);
    let best = '';
    let bestDot = -Infinity;
    for (const [name, axis] of AXIS_DIRS) {
      const d = (vertices[i][0] * axis[0] + vertices[i][1] * axis[1] + vertices[i][2] * axis[2]) / (dirLen * len(axis));
      if (d > bestDot) { bestDot = d; best = name; }
    }
    groups.get(best)!.push({ idx: i, dot: bestDot });
  }

  const perAxis = Math.ceil(count / AXIS_DIRS.length);
  const positions: [number, number, number][] = [];
  const indices: number[] = [];
  for (const [name] of AXIS_DIRS) {
    const sorted = groups.get(name)!.sort((a, b) => b.dot - a.dot);
    for (let i = 0; i < Math.min(perAxis, sorted.length); i++) {
      positions.push(vertices[sorted[i].idx]);
      indices.push(sorted[i].idx);
    }
  }

  while (indices.length > count) { positions.pop(); indices.pop(); }
  const seen = new Set(indices);
  for (let i = 0; i < vertices.length && indices.length < count; i++) {
    if (!seen.has(i)) { positions.push(vertices[i]); indices.push(i); seen.add(i); }
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
      position: new THREE.Vector3(...domeSelection.positions[i]),
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
