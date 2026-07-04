/**
 * @file tetra.ts — Core tetrahedron mathematics and transformations
 *
 * Implements the universal tetrahedral coordinate system for the P31 stack.
 * Every entity (personal, hub, marketplace, ecosystem) is a tetrahedron.
 * Scale is achieved through recursive subdivision and instanced rendering.
 *
 * Mathematical foundations:
 * - Vertices of regular tetrahedron centered at origin, edge length = 1
 * - Barycentric coordinates for interior point queries
 * - Jitterbug transformation sequence (tetrahedron ↔ octahedron ↔ cuboid)
 * - Recursive subdivision (each vertex spawns child tetrahedron)
 */

import * as THREE from 'three';

// ── Regular tetrahedron vertices (centered at origin, edge length = 1) ──────
// Coordinates from: https://en.wikipedia.org/wiki/Tetrahedron#Coordinates_for_a_regular_tetrahedron
// Edge length = √(8/3) ≈ 1.633, but we scale to unit edge for consistency

export const TETRA_VERTICES: [number, number, number][] = [
  [0.5, 0.5, 0.5],    // [1, 1, 1] * 0.5
  [0.5, -0.5, -0.5],  // [1, -1, -1] * 0.5
  [-0.5, 0.5, -0.5],  // [-1, 1, -1] * 0.5
  [-0.5, -0.5, 0.5],  // [-1, -1, 1] * 0.5
];

export function createTetrahedronGeometry(scale: number = 1): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const vertices = new Float32Array(4 * 3);
  const indices = new Uint16Array(12); // 4 faces × 3 vertices

  // Vertices (scaled)
  for (let i = 0; i < 4; i++) {
    vertices[i * 3]     = TETRA_VERTICES[i][0] * scale;
    vertices[i * 3 + 1] = TETRA_VERTICES[i][1] * scale;
    vertices[i * 3 + 2] = TETRA_VERTICES[i][2] * scale;
  }

  // Faces (counter-clockwise winding)
  // Base triangle: v1, v2, v3
  indices[0] = 1; indices[1] = 2; indices[2] = 3;
  // Side triangles: v0,v2,v1; v0,v3,v2; v0,v1,v3
  indices[3] = 0; indices[4] = 2; indices[5] = 1;
  indices[6] = 0; indices[7] = 3; indices[8] = 2;
  indices[9] = 0; indices[10] = 1; indices[11] = 3;

  geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  geo.computeVertexNormals();

  return geo;
}

// ── Tetrahedron data structure ──────────────────────────────────────────────

export interface TetraVertex {
  id: string;
  label: string;
  val: number;        // 0-1 normalized value
  color: string;      // hex color
  raw?: unknown;      // Original data payload
}

export interface TetraEdge {
  source: string;     // vertex id
  target: string;     // vertex id
  weight: number;     // 0-1 normalized connection strength
  relation?: 'flow' | 'causal' | 'synchrony' | 'dependency'; // Optional relationship type
}

export interface TetraMetadata {
  timestamp: string;
  source: string;
  version: string;
  scale: 'personal' | 'family' | 'hub' | 'marketplace' | 'ecosystem';
  class: string;      // e.g., PHYSIOLOGICAL, AGENT_HUB, MARKETPLACE
}

export interface TetraData {
  schema: 'p31.tetra/v1';
  id: string;
  metadata: TetraMetadata;
  vertices: TetraVertex[];
  edges: TetraEdge[];
  sub_tetras?: Record<string, TetraData>;  // Recursive children (for zoom)
  parent_id?: string;        // Parent tetrahedron id
  parent_hash?: string;      // SHA-256 of parent for consistency
}

// ── Utility: Compute edge weights from vertex correlations ─────────────────

export function computeEdgeWeights(data: TetraData, correlationMatrix: number[][]): void {
  // correlationMatrix[i][j] gives correlation between vertex i and vertex j
  for (const edge of data.edges) {
    const i = parseInt(edge.source.slice(1));
    const j = parseInt(edge.target.slice(1));
    if (!isNaN(i) && !isNaN(j) && correlationMatrix[i]?.[j] !== undefined) {
      edge.weight = Math.max(0, Math.min(1, correlationMatrix[i][j]));
    }
  }
}

// ── Utility: Create tetrahedron from scalar values ─────────────────────────

export function tetraFromScalars(
  id: string,
  labels: string[],
  values: number[],
  colors: string[],
  scale: TetraMetadata['scale'],
  class_: string
): TetraData {
  if (labels.length !== 4 || values.length !== 4 || colors.length !== 4) {
    throw new Error('Tetrahedron requires exactly 4 vertices');
  }

  const vertices: TetraVertex[] = labels.map((label, i) => ({
    id: `v${i}`,
    label,
    val: Math.max(0, Math.min(1, values[i])),  // Clamp to 0-1
    color: colors[i],
  }));

  const edges: TetraEdge[] = [];
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      edges.push({
        source: `v${i}`,
        target: `v${j}`,
        weight: 0.5,  // Default equal weight - will be computed from data
      });
    }
  }

  return {
    schema: 'p31.tetra/v1',
    id,
    metadata: {
      timestamp: new Date().toISOString(),
      source: 'spaceship-earth',
      version: '1.0.0',
      scale,
      class: class_,
    },
    vertices,
    edges,
  };
}

// ── Factory functions for common tetrahedron types ─────────────────────────

export function createPhysiologicalTetra(
  id: string,
  calcium: number,
  hrv: number,
  spoons: number,
  genesisSync: number
): TetraData {
  // Normalize values to 0-1 range
  const norm = (val: number, min: number, max: number) => Math.max(0, Math.min(1, (val - min) / (max - min)));

  return {
    schema: 'p31.tetra/v1',
    id,
    metadata: {
      timestamp: new Date().toISOString(),
      source: 'k4-personal',
      version: '1.0.0',
      scale: 'personal',
      class: 'PHYSIOLOGICAL',
    },
    vertices: [
      { id: 'v0', label: 'Calcium', val: norm(calcium, 7.5, 9.5), color: '#FFD93D', raw: { calcium, unit: 'mg/dL' } },
      { id: 'v1', label: 'HRV',     val: norm(hrv, 30, 100),        color: '#4D96FF', raw: { hrv, unit: 'ms' } },
      { id: 'v2', label: 'Spoons',  val: norm(spoons, 0, 12),       color: '#9B59B6', raw: { spoons } },
      { id: 'v3', label: 'Genesis',  val: genesisSync,                color: '#6BCB77', raw: { sync: genesisSync } },
    ],
    edges: [
      { source: 'v0', target: 'v1', weight: 0.8, relation: 'causal' },
      { source: 'v0', target: 'v2', weight: 0.6, relation: 'dependency' },
      { source: 'v0', target: 'v3', weight: 0.7, relation: 'synchrony' },
      { source: 'v1', target: 'v2', weight: 0.5, relation: 'flow' },
      { source: 'v1', target: 'v3', weight: 0.8, relation: 'synchrony' },
      { source: 'v2', target: 'v3', weight: 0.4, relation: 'flow' },
    ],
  };
}

// ── Pre-computed tetrahedron geometry with instancing support ───────────────

export function createInstancedTetrahedronGeometry(scale: number = 1): THREE.InstancedBufferGeometry {
  const baseGeo = createTetrahedronGeometry(scale);

  // Convert to instanced geometry (for rendering many tetrahedrons efficiently)
  const instancedGeo = new THREE.InstancedBufferGeometry();

  // Copy attributes from base geometry
  instancedGeo.index = baseGeo.index;
  instancedGeo.setAttribute('position', baseGeo.getAttribute('position')!.clone());
  instancedGeo.setAttribute('normal', baseGeo.getAttribute('normal')!.clone());

  // Add instance attributes (will be set per-instance)
  const instancePositions = new Float32Array(16 * 3); // Max 16 instances for demo
  const instanceColors = new Float32Array(16 * 3);
  const instanceScales = new Float32Array(16);

  instancedGeo.setAttribute('instancePosition', new THREE.InstancedBufferAttribute(instancePositions, 3));
  instancedGeo.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(instanceColors, 3));
  instancedGeo.setAttribute('instanceScale', new THREE.InstancedBufferAttribute(instanceScales, 1));

  return instancedGeo;
}

// ── Math: Barycentric coordinates ──────────────────────────────────────────

/**
 * Convert 3D point to barycentric coordinates within tetrahedron
 * Useful for determining which sub-tetrahedron a point lies in
 */
export function pointToBarycentric(
  point: THREE.Vector3,
  v0: THREE.Vector3,
  v1: THREE.Vector3,
  v2: THREE.Vector3,
  v3: THREE.Vector3
): [number, number, number, number] {
  const v0v1 = new THREE.Vector3().subVectors(v1, v0);
  const v0v2 = new THREE.Vector3().subVectors(v2, v0);
  const v0v3 = new THREE.Vector3().subVectors(v3, v0);
  const v0p = new THREE.Vector3().subVectors(point, v0);

  const d00 = v0v1.dot(v0v1);
  const d01 = v0v1.dot(v0v2);
  const d02 = v0v1.dot(v0v3);
  const d11 = v0v2.dot(v0v2);
  const d12 = v0v2.dot(v0v3);
  const d20 = v0v3.dot(v0v3);
  const d0p = v0v1.dot(v0p);
  const d1p = v0v2.dot(v0p);
  const d2p = v0v3.dot(v0p);

  const denom = d00 * d11 * d20 + 2 * d01 * d02 * d12 - d00 * d12 * d12 - d11 * d02 * d02 - d20 * d01 * d01;

  const a = (d11 * d20 * d0p + d02 * d12 * d1p + d01 * d02 * d2p - d02 * d02 * d1p - d12 * d12 * d0p) / denom;
  const b = (d00 * d20 * d1p + d01 * d02 * d0p + d01 * d12 * d2p - d02 * d02 * d0p - d12 * d01 * d1p) / denom;
  const c = (d00 * d11 * d2p + d01 * d02 * d1p + d02 * d11 * d0p - d01 * d01 * d2p - d11 * d02 * d0p) / denom;
  const d = 1 - a - b - c;

  return [a, b, c, d];
}

// ── Default export ──────────────────────────────────────────────────────────

export default {
  createTetrahedronGeometry,
  createInstancedTetrahedronGeometry,
  tetraFromScalars,
  createPhysiologicalTetra,
  computeEdgeWeights,
  pointToBarycentric,
  TETRA_VERTICES,
};
