/**
 * @file DeltaMesh.tsx — Tetrahedron K4 Mesh 3D Visualizer
 * 
 * Renders the K4 complete graph (4 nodes, 6 edges) in 3D space.
 * Visualizes the Delta topology for systemic resilience awareness.
 * 
 * Section 1.2: Tetrahedron Protocol - K4 Complete Graph
 * Mathematical Foundation: Isostatic rigidity, 57.7% capacity at single-node loss
 * 
 * Features:
 * - 4-node tetrahedron with floating animation
 * - Edge rendering (6 equidistant edges)
 * - Ollivier-Ricci curvature proxy (κ) calculation
 * - Discrete Ricci Flow Graph Embedding (dRfge) scale oscillation
 * 
 * CWP-JITTERBUG-15: Delta Topology Visualizer
 */
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Text } from '@react-three/drei';
import * as THREE from 'three';
import { RicciMath } from '../../lib/engine/ricci';
import type { K4Graph } from '@p31/quantum-core/k4';

export interface DeltaMeshNode {
  id: string;
  position: THREE.Vector3;
  label: string;
  isGateway?: boolean;
}

export interface DeltaMeshEdge {
  from: number;
  to: number;
}

/**
 * Generate K4 complete graph node positions (regular tetrahedron)
 * Vertices of a regular tetrahedron inscribed in a sphere of radius 1
 */
export function generateK4Nodes(): DeltaMeshNode[] {
  const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
  
  // Regular tetrahedron vertices (normalized)
  const positions = [
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(-0.9428, -0.3333, 0),
    new THREE.Vector3(0.4714, -0.3333, 0.8165),
    new THREE.Vector3(0.4714, -0.3333, -0.8165),
  ];
  
  return positions.map((pos, i) => ({
    id: `node_${i}`,
    position: pos.multiplyScalar(1.5), // Scale up for visibility
    label: i === 0 ? 'GATEWAY' : `NODE_0${i}`,
    isGateway: i === 0,
  }));
}

/**
 * K4 complete graph edges (all pairs connected)
 */
export function generateK4Edges(): DeltaMeshEdge[] {
  const edges: DeltaMeshEdge[] = [];
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      edges.push({ from: i, to: j });
    }
  }
  return edges;
}

/**
 * Calculate Ollivier-Ricci Curvature proxy (κ)
 * Based on local edge stress and network noise
 * 
 * @param time - Current time for oscillation
 * @param networkStress - Optional stress factor from mesh
 * @returns κ value 0-2 (1 = optimal, <1 bottleneck, >1 expansive)
 */
export function calculateRicciCurvature(time: number, networkStress: number = 0): number {
  // Simulate Ricci flow adaptation: subtle oscillation around 1.0
  const baseCurvature = 1.0;
  const dRfgeOscillation = Math.sin(time * 0.5) * 0.2; // Slow breathing
  const stressImpact = networkStress * 0.3;
  
  return Math.max(0.2, Math.min(2.0, baseCurvature + dRfgeOscillation + stressImpact));
}

/**
 * Calculate 57.7% resilience threshold display value
 */
export function calculateResilienceThreshold(lostNodes: number): number {
  if (lostNodes === 0) return 100;
  if (lostNodes === 1) return 57.7; // Single node loss resilience
  if (lostNodes === 2) return 0;    // Collapse
  return 0;
}

interface DeltaMeshProps {
  networkStress?: number;
  showLabels?: boolean;
  autoRotate?: boolean;
  /** Phase 2: live K₄ skeleton. When provided, curvature + edge health are
   * driven by the live graph (meshHealth), not the cosmetic proxy. */
  graph?: K4Graph;
}

export function DeltaMesh({ 
  networkStress = 0, 
  showLabels = true, 
  autoRotate = true,
  graph,
}: DeltaMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const curvatureRef = useRef(1.0);

  // Generate static K4 topology (positions are always a regular tetrahedron).
  const nodes = useMemo(() => generateK4Nodes(), []);
  const edges = useMemo(() => generateK4Edges(), []);

  // Phase 2: when a live graph is supplied, curvature follows mesh health.
  const liveCurvature = useMemo(() => {
    if (!graph) return 1.0;
    const sum = graph.edges.reduce((a, e) => a + e.weight, 0);
    const health = graph.edges.length > 0 ? sum / graph.edges.length : 0;
    return 0.5 + Math.min(1, Math.max(0, health)) * 1.0; // κ ∈ [0.5,1.5]
  }, [graph]);
  const curvature = graph ? liveCurvature : 1.0 - networkStress * 0.5;
  
  // Animate curvature and scale each frame.
  // With a live graph, curvature is driven by mesh health (no cosmetic proxy).
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    curvatureRef.current = graph ? curvature : calculateRicciCurvature(t, networkStress);

    // Apply dRfge scale oscillation using RicciMath
    if (groupRef.current) {
      const scale = RicciMath.getScaleFactor(curvatureRef.current);
      groupRef.current.scale.setScalar(scale);
    }
  });

  // Curvature-based color scheme: κ maps to color
  // κ > 0.9 = green (healthy), κ 0.7-0.9 = cyan (stable), κ < 0.7 = red (degraded)
  const curvatureColor = useMemo(() => {
    const k = curvature;
    if (k >= 0.9) return '#00FF88';      // Green - isostatic
    if (k >= 0.7) return '#00D4FF';     // Cyan - stable
    return '#EF4444';                   // Red - degraded
  }, [curvature]);

  const gatewayColor = curvatureColor;   // Gateway reflects health
  const nodeColor = '#00D4FF';           // Cyan for regular nodes
  const edgeColor = curvature >= 0.8 ? '#1f2937' : '#7A27FF'; // Purple edge on stress
  const edgeHighlightColor = curvature >= 0.8 ? '#4db8a8' : '#EF4444';

  // Phase 2: per-vertex emissive scales with live subsystem activity.
  const vertexWeights = useMemo(
    () => (graph ? graph.vertices.map((v) => v.weight) : [1, 1, 1, 1]),
    [graph],
  );

  return (
    <group ref={groupRef}>
      {/* Render Nodes */}
      {nodes.map((node, index) => (
        <Float
          key={node.id}
          speed={2}
          rotationIntensity={0.3}
          floatIntensity={0.4}
        >
          <mesh position={node.position}>
            <sphereGeometry args={[0.12, 32, 32]} />
            <meshStandardMaterial
              color={node.isGateway ? gatewayColor : nodeColor}
              emissive={node.isGateway ? gatewayColor : nodeColor}
              emissiveIntensity={0.5 + (vertexWeights[index] ?? 1) * 1.5}
              roughness={0.3}
              metalness={0.7}
            />
          </mesh>
          
          {/* Node Label */}
          {showLabels && (
            <Text
              position={[node.position.x, node.position.y + 0.25, node.position.z]}
              fontSize={0.08}
              color="#E8ECF4"
              anchorX="center"
              anchorY="middle"
              font={`${import.meta.env.BASE_URL}fonts/JetBrainsMono-Bold.ttf`}
            >
              {graph?.vertices[index]?.label ?? node.label}
            </Text>
          )}
        </Float>
      ))}

       {/* Render Edges (K4 = 6 edges) — opacity reflects live flow health */}
       {edges.map((edge, index) => {
        const startNode = nodes[edge.from];
        const endNode = nodes[edge.to];

        // Create line geometry
        const points = [startNode.position, endNode.position];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

        // Phase 2: when a live graph is present, edge weight = flow health.
        const liveWeight = graph?.edges[index]?.weight;
        const opacity = liveWeight !== undefined ? 0.15 + liveWeight * 0.6 : 0.6;
        const color = liveWeight !== undefined && liveWeight < 0.4 ? '#EF4444' : edgeColor;

        return (
          <line key={`edge_${index}`}>
            <bufferGeometry {...lineGeometry} />
            <lineBasicMaterial 
              color={color} 
              transparent 
              opacity={opacity}
              linewidth={1}
            />
          </line>
        );
       })}

      {/* Central stress indicator (shows network health) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color={curvatureRef.current >= 0.8 ? gatewayColor : '#EF4444'}
          emissive={curvatureRef.current >= 0.8 ? gatewayColor : '#EF4444'}
          emissiveIntensity={curvatureRef.current >= 0.8 ? 1.0 : 2.0}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}

export default DeltaMesh;