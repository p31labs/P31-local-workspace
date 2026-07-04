import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text, Line, MeshTransmissionMaterial, Float, Environment } from '@react-three/drei';
import { TetraData, TetraVertex } from '@p31/tetra';
import { TETRA_VERTICES } from '@p31/tetra/tetra';

function lerpColor(a: string, b: string, t: number): string {
  const ah = parseInt(a.slice(1), 16);
  const bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return `#${((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1)}`;
}

interface UniversalTetraProps {
  data: TetraData;
  mode?: 'view' | 'edit' | 'debug';
  interactive?: boolean;
  onVertexClick?: (vertexId: string, vertex: TetraVertex) => void;
  lod?: 'high' | 'medium' | 'low' | 'minimal';
  showLabels?: boolean;
  showEdges?: boolean;
  vertexScale?: number;
  pulseSpeed?: number;
}

export function UniversalTetra({
  data,
  mode = 'view',
  interactive = true,
  onVertexClick,
  lod = 'high',
  showLabels = true,
  showEdges = true,
  vertexScale = 1,
  pulseSpeed = 1,
}: UniversalTetraProps) {
  const [hoveredVertex, setHoveredVertex] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const domeRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    setTime(t => t + delta * pulseSpeed);
    if (domeRef.current) {
      domeRef.current.rotation.y += delta * 0.08;
      domeRef.current.rotation.x += delta * 0.03;
    }
  });

  const vertexPositions = useMemo(() =>
    TETRA_VERTICES.map(v => new THREE.Vector3(v[0] * 1.5, v[1] * 1.5, v[2] * 1.5)),
  []);

  const vertexSizes = useMemo(() =>
    data.vertices.map(v => (0.15 * vertexScale) * (0.7 + v.val * 0.8)),
  [data.vertices, vertexScale]);

  const isUrgent = data.vertices.some(v => v.val < 0.2);
  const pulseFactor = 1.0 + (isUrgent ? 0.15 * Math.sin(time * 5) : 0.05 * Math.sin(time * 2));
  const accentColor = isUrgent ? '#EF4444' : '#00D4FF';

  const getVertexColor = (vertex: TetraVertex): string => {
    let base = vertex.color;
    if (hoveredVertex === vertex.id) base = lerpColor(base, '#FFFFFF', 0.5);
    if (vertex.val < 0.2) base = lerpColor(base, '#EF4444', 0.6);
    return base;
  };

  const basePosition = data.transform?.rotation
    ? new THREE.Vector3(...(data.transform.rotation as [number, number, number]))
    : new THREE.Vector3(0, 0, 0);

  return (
    <group position={basePosition}>

      {/* ── Environment lighting for glass refraction ── */}
      <Environment preset="city" />

      {/* ── Geodesic dome shell ── */}
      <mesh ref={domeRef}>
        <icosahedronGeometry args={[4.5, 3]} />
        <meshBasicMaterial
          color={accentColor}
          wireframe
          transparent
          opacity={isUrgent ? 0.10 : 0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ── Glowing energy edges ── */}
      {showEdges && data.edges.map((edge, i) => {
        const srcIdx = data.vertices.findIndex(v => v.id === edge.source);
        const tgtIdx = data.vertices.findIndex(v => v.id === edge.target);
        if (srcIdx === -1 || tgtIdx === -1) return null;
        return (
          <Line
            key={`edge-${i}`}
            points={[vertexPositions[srcIdx], vertexPositions[tgtIdx]]}
            color={accentColor}
            lineWidth={edge.weight * 3 + 1}
            transparent
            opacity={0.35 + edge.weight * 0.45}
            blending={THREE.AdditiveBlending}
          />
        );
      })}

      {/* ── Quantum glass vertex orbs ── */}
      {data.vertices.map((vertex, i) => {
        const pos = vertexPositions[i];
        const size = vertexSizes[i] * pulseFactor;
        const color = getVertexColor(vertex);

        return (
          <Float
            key={vertex.id}
            speed={isUrgent ? 6 : 2}
            rotationIntensity={1}
            floatIntensity={0.5}
            position={pos}
          >
            <group
              onClick={e => { e.stopPropagation(); if (interactive && onVertexClick) onVertexClick(vertex.id, vertex); }}
              onPointerOver={e => { e.stopPropagation(); if (interactive) setHoveredVertex(vertex.id); }}
              onPointerOut={e => { e.stopPropagation(); if (interactive) setHoveredVertex(null); }}
            >
              {/* Outer refractive glass shell */}
              <mesh scale={size * 2.2}>
                <sphereGeometry args={[1, 32, 32]} />
                <MeshTransmissionMaterial
                  backside
                  thickness={0.5}
                  roughness={0.05}
                  transmission={1}
                  ior={1.2}
                  chromaticAberration={0.3}
                  color={color}
                  transparent
                />
              </mesh>

              {/* Inner glowing core */}
              <mesh scale={size * 0.7}>
                <sphereGeometry args={[1, 16, 16]} />
                <meshBasicMaterial
                  color={color}
                  toneMapped={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>

              {/* Holographic label */}
              {showLabels && lod !== 'minimal' && (
                <Text
                  position={[0, size * 3.0, 0]}
                  fontSize={0.10}
                  color="#FFFFFF"
                  anchorX="center"
                  anchorY="middle"
                  font={`${import.meta.env.BASE_URL}fonts/JetBrainsMono-Bold.ttf`}
                >
                  {vertex.label}
                </Text>
              )}

              {/* Value % (high LOD only) */}
              {lod === 'high' && (
                <Text
                  position={[0, -size * 2.5, 0]}
                  fontSize={0.07}
                  color={color}
                  anchorX="center"
                  anchorY="middle"
                >
                  {(vertex.val * 100).toFixed(0)}%
                </Text>
              )}
            </group>
          </Float>
        );
      })}

    </group>
  );
}

export default UniversalTetra;
