// ═══════════════════════════════════════════════════════
// @p31/shared — Sierpinski Tetrahedron Generator
//
// Generates Sierpinski tetrahedron nodes using IVM coordinates
// for the ZUI mesh visualizer. Depth 5 = 1,024 nodes (mobile safe),
// depth 6 = 4,096 (desktop). Uses IVM tetrahedral basis vectors.
//
// Based on WCD-SE-SDS specification for Spaceship Earth.
// ═══════════════════════════════════════════════════════

import * as THREE from 'three';
import { IVMCoordinate, MacroNode, ZoomLevel } from './types';

// Tetrahedron vertices in Cartesian coordinates
const TETRA_VERTICES = [
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(Math.sqrt(8/9), -1/3, 0),
  new THREE.Vector3(-Math.sqrt(2/9), -1/3, Math.sqrt(2/3)),
  new THREE.Vector3(-Math.sqrt(2/9), -1/3, -Math.sqrt(2/3)),
];

// IVM basis vectors (60° angles) — hoisted to avoid per-call allocation
const IVM_E1 = new THREE.Vector3(1, 0, 0);
const IVM_E2 = new THREE.Vector3(0.5, Math.sqrt(3) / 2, 0);
const IVM_E3 = new THREE.Vector3(0.5, Math.sqrt(3) / 6, Math.sqrt(6) / 3);

// Reusable scratch objects — hoisted to eliminate per-call GC pressure
const _tempPos = new THREE.Vector3();
const _tempMatrix = new THREE.Matrix4();
const _tempColor = new THREE.Color();

// Cached GPU tier (doesn't change during session)
let cachedGPUTier: 'low' | 'medium' | 'high' | null = null;

/**
 * Generate Sierpinski tetrahedron nodes recursively.
 * Uses IVM coordinates to avoid floating-point accumulation errors.
 */
export function generateSierpinskiNodes(
  maxDepth: number,
  center = new THREE.Vector3(),
  scale = 1,
  depth = 0,
  parentId = 'root'
): MacroNode[] {
  if (depth >= maxDepth) {
    return [{
      id: parentId,
      ivmCoord: cartesianToIVM(center),
      worldPosition: [center.x, center.y, center.z],
      zoneLabel: `Zone ${parentId}`,
      health: Math.random(), // Random for now, will be set by zone data
      childCount: 0,
    }];
  }

  const nodes: MacroNode[] = [];
  const half = scale / 2;

  for (let i = 0; i < 4; i++) {
    const child = center.clone().add(
      TETRA_VERTICES[i].clone().multiplyScalar(half)
    );
    const childId = `${parentId}-${i}`;

    // Add this node
    nodes.push({
      id: childId,
      ivmCoord: cartesianToIVM(child),
      worldPosition: [child.x, child.y, child.z],
      zoneLabel: `Zone ${childId}`,
      health: Math.random(),
      childCount: 0,
    });

    // Recurse
    nodes.push(...generateSierpinskiNodes(maxDepth, child, half, depth + 1, childId));
  }

  return nodes;
}

/**
 * Convert Cartesian coordinates to IVM (Isotropic Vector Matrix) coordinates.
 * IVM uses tetrahedral basis vectors with 60° angles.
 */
export function cartesianToIVM(cartesian: THREE.Vector3): IVMCoordinate {
  // Solve for IVM coordinates: cartesian = a*e1 + b*e2 + c*e3
  // This is a linear system that can be solved directly
  const a = cartesian.x - cartesian.y / Math.sqrt(3);
  const b = (2 * cartesian.y) / Math.sqrt(3);
  const c = (Math.sqrt(6) * cartesian.z) / 2;

  return {
    a: Math.round(a * 1000) / 1000, // Round to avoid floating point errors
    b: Math.round(b * 1000) / 1000,
    c: Math.round(c * 1000) / 1000,
    d: 0, // Fourth coordinate for completeness
  };
}

/**
 * Convert IVM coordinates back to Cartesian.
 */
export function ivmToCartesian(ivm: IVMCoordinate): THREE.Vector3 {
  return new THREE.Vector3()
    .addScaledVector(IVM_E1, ivm.a)
    .addScaledVector(IVM_E2, ivm.b)
    .addScaledVector(IVM_E3, ivm.c);
}

/**
 * Get performance-appropriate Sierpinski depth based on device capabilities.
 */
export function getOptimalSierpinskiDepth(): number {
  // Check device capabilities
  const gpuTier = getGPUTier();
  
  if (gpuTier === 'high') {
    return 6; // 4,096 nodes for desktop
  } else if (gpuTier === 'medium') {
    return 5; // 1,024 nodes for mid-range mobile
  } else {
    return 4; // 256 nodes for low-end devices
  }
}

/**
 * Simple GPU tier detection based on device memory and WebGL capabilities.
 */
function getGPUTier(): 'low' | 'medium' | 'high' {
  if (cachedGPUTier !== null) return cachedGPUTier;

  // Check device memory
  const deviceMemory = (navigator as any).deviceMemory || 4;
  
  // Check WebGL renderer
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) { cachedGPUTier = 'low'; return cachedGPUTier; }

  const renderer = (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).RENDERER);
  // Release the context immediately — browsers cap WebGL contexts at ~16; leaking one per page load can exhaust the pool.
  (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')?.loseContext();
  const isMobile = /Mobile|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (deviceMemory >= 8 && !isMobile) {
    cachedGPUTier = 'high';
  } else if (deviceMemory >= 4) {
    cachedGPUTier = 'medium';
  } else {
    cachedGPUTier = 'low';
  }
  return cachedGPUTier;
}

/**
 * Generate instance matrices for InstancedMesh rendering.
 */
export function generateInstanceMatrices(nodes: MacroNode[]): THREE.Matrix4[] {
  return nodes.map(node => {
    _tempPos.set(node.worldPosition[0], node.worldPosition[1], node.worldPosition[2]);
    const scale = 0.1 + (node.health * 0.2);
    _tempMatrix.makeScale(scale, scale, scale);
    _tempMatrix.setPosition(_tempPos);
    return _tempMatrix.clone(); // clone once per node; scratch is reused each iteration
  });
}

/**
 * Create color based on zone health and energy.
 */
export function getNodeColor(health: number, energy: string): THREE.Color {
  switch (energy) {
    case 'kinetic':
      _tempColor.setHSL(0.05, 1, 0.5 + (health * 0.3)); // Orange-red
      break;
    case 'balanced':
      _tempColor.setHSL(0.33, 1, 0.5 + (health * 0.3)); // Green
      break;
    case 'ordered':
      _tempColor.setHSL(0.6, 1, 0.5 + (health * 0.3)); // Blue
      break;
    case 'still':
      _tempColor.setHSL(0.8, 1, 0.5 + (health * 0.3)); // Purple
      break;
    default:
      _tempColor.setHSL(0.5, 0.5, 0.5 + (health * 0.3)); // Gray
  }
  return _tempColor.clone();
}

/**
 * Generate zone configuration from Sierpinski nodes.
 */
export function generateZonesFromNodes(nodes: MacroNode[]): any[] {
  return nodes.map(node => ({
    id: node.id,
    name: node.zoneLabel,
    energy: getZoneEnergyFromPosition(node.worldPosition),
    rules: [],
    sovereignResident: 'SYSTEM',
    memberCount: Math.floor(Math.random() * 10),
    lastActivity: Date.now(),
    health: node.health,
  }));
}

/**
 * Determine zone energy based on position in the tetrahedron.
 */
function getZoneEnergyFromPosition(position: [number, number, number]): string {
  const [x, y, z] = position;
  const distance = Math.sqrt(x*x + y*y + z*z);
  
  if (distance < 5) return 'still';
  if (distance < 15) return 'ordered';
  if (distance < 25) return 'balanced';
  return 'kinetic';
}