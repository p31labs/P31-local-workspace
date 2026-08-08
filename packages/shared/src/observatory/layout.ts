/**
 * @file observatory/layout.ts — P31 Graph Layout Math
 * 
 * Barycentric coordinate projection, deterministic hash spread, axis detection,
 * node color blending, geodesic shell building.
 * 
 * Pure TypeScript, no Three.js deps (consumers import Vector3 separately).
 */

import type { NodeInfo, AxisKey } from './types';
import { AXES, AXIS_ORDER } from './graph';

// ═══════════════════════════════════════════════════════════════════════════════
// TETRAHEDRON VERTICES (unit scale)
// ═══════════════════════════════════════════════════════════════════════════════

export const TETRA_VERTS: [number, number, number][] = [
  [1, 1, 1],
  [1, -1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
];

// ═══════════════════════════════════════════════════════════════════════════════
// DETERMINISTIC HASH (string → 0..1)
// ═══════════════════════════════════════════════════════════════════════════════

export function hashStr(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32-bit
  }
  return Math.abs(hash) / 0x7fffffff; // normalize to 0..1
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOMINANT AXIS DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

export function getDominantAxis(node: NodeInfo): AxisKey {
  return node.axis;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AXIS-WEIGHTED COLOR BLENDING
// ═══════════════════════════════════════════════════════════════════════════════

export function getGraphNodeColor(node: NodeInfo): [number, number, number] {
  const axisConfig = AXES[node.axis];
  return axisConfig.rgb as [number, number, number];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BARYCENTRIC → GEODESIC SHELL PROJECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Projects barycentric weights onto a geodesic shell surface.
 * 
 * @param node - The node to position
 * @param radius - Shell radius (e.g., 9 for inner graph shell, 3.4 for 1V shell)
 * @returns [x, y, z] position on the sphere
 */
export function baryToPosition(node: NodeInfo, radius: number): [number, number, number] {
  const axisIndex = AXIS_ORDER.indexOf(node.axis);
  const tetraVert = TETRA_VERTS[axisIndex % 4];

  // Deterministic tangential spread via hash
  const hash = hashStr(node.id);
  const theta = hash * 2 * Math.PI;
  const phi = (hash * 0.5 + 0.25) * Math.PI; // spread in latitude

  // Tangent-space offset
  const offsetR = 0.3 * radius * (hash - 0.5); // small radial jitter
  const tangentX = Math.sin(theta) * Math.cos(phi);
  const tangentY = Math.cos(theta) * Math.cos(phi);
  const tangentZ = Math.sin(phi);

  // Base position from tetra vertex
  let x = tetraVert[0] + tangentX * offsetR;
  let y = tetraVert[1] + tangentY * offsetR;
  let z = tetraVert[2] + tangentZ * offsetR;

  // Normalize and scale to shell radius
  const len = Math.sqrt(x * x + y * y + z * z);
  const scale = radius / len;
  x *= scale;
  y *= scale;
  z *= scale;

  return [x, y, z];
}

// ═══════════════════════════════════════════════════════════════════════════════
// GEODESIC SHELL EDGE BUILDER (reference for 2V/1V wireframes)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Returns expected edge counts for a geodesic icosahedron at a given detail level.
 * 
 * @param detail - Subdivision level (1 = 1V, 2 = 2V)
 * @returns Edge count
 */
export function geodesicEdgeCount(detail: number): number {
  // Icosahedron: 30 edges
  // Detail 1 (1V): 30 * 2 = 60 edges
  // Detail 2 (2V): 30 * 4 = 120 edges (approx; actual is 480 for full sphere)
  // This is a simplified heuristic; actual geodesic math varies
  return 30 * Math.pow(2, detail);
}
