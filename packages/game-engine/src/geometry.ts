/**
 * @module game-engine/geometry
 * @description Geodesic geometry primitives and Maxwell rigidity validation.
 */

import type {
  Vec3,
  PrimitiveType,
  PrimitiveGeometry,
  PlacedPiece,
  RigidityAnalysis,
} from "./types.js";

// ─── Vector Operations ──────────────────────────────────────────────

export function vec3(x: number, y: number, z: number): Vec3 {
  return { x, y, z };
}

export function addVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function scaleVec3(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function distanceVec3(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// ─── Primitive Definitions ──────────────────────────────────────────

const TETRAHEDRON_VERTICES: readonly Vec3[] = [
  vec3(1, 1, 1),
  vec3(1, -1, -1),
  vec3(-1, 1, -1),
  vec3(-1, -1, 1),
];

const OCTAHEDRON_VERTICES: readonly Vec3[] = [
  vec3(1, 0, 0),
  vec3(-1, 0, 0),
  vec3(0, 1, 0),
  vec3(0, -1, 0),
  vec3(0, 0, 1),
  vec3(0, 0, -1),
];

const PHI = (1 + Math.sqrt(5)) / 2;
const ICOSAHEDRON_VERTICES: readonly Vec3[] = [
  vec3(0, 1, PHI), vec3(0, 1, -PHI), vec3(0, -1, PHI), vec3(0, -1, -PHI),
  vec3(1, PHI, 0), vec3(1, -PHI, 0), vec3(-1, PHI, 0), vec3(-1, -PHI, 0),
  vec3(PHI, 0, 1), vec3(PHI, 0, -1), vec3(-PHI, 0, 1), vec3(-PHI, 0, -1),
];

export const PRIMITIVES: Readonly<Record<PrimitiveType, PrimitiveGeometry>> = {
  tetrahedron: {
    type: "tetrahedron",
    vertices: 4,
    edges: 6,
    faces: 4,
    maxwellRatio: 1.0,
    isRigid: true,
    connectionPoints: TETRAHEDRON_VERTICES,
    vertexPositions: TETRAHEDRON_VERTICES,
  },
  octahedron: {
    type: "octahedron",
    vertices: 6,
    edges: 12,
    faces: 8,
    maxwellRatio: 1.0,
    isRigid: true,
    connectionPoints: OCTAHEDRON_VERTICES,
    vertexPositions: OCTAHEDRON_VERTICES,
  },
  icosahedron: {
    type: "icosahedron",
    vertices: 12,
    edges: 30,
    faces: 20,
    maxwellRatio: 1.0,
    isRigid: true,
    connectionPoints: ICOSAHEDRON_VERTICES,
    vertexPositions: ICOSAHEDRON_VERTICES,
  },
  strut: {
    type: "strut",
    vertices: 2,
    edges: 1,
    faces: 0,
    maxwellRatio: 0,
    isRigid: false,
    connectionPoints: [vec3(0, -0.5, 0), vec3(0, 0.5, 0)],
    vertexPositions: [vec3(0, -0.5, 0), vec3(0, 0.5, 0)],
  },
  hub: {
    type: "hub",
    vertices: 1,
    edges: 0,
    faces: 0,
    maxwellRatio: 0,
    isRigid: false,
    connectionPoints: [vec3(0, 0, 0)],
    vertexPositions: [vec3(0, 0, 0)],
  },
} as const;

// ─── Maxwell Rigidity Analysis ──────────────────────────────────────

export function maxwellAnalysis(vertices: number, edges: number): RigidityAnalysis {
  if (vertices < 2) {
    return {
      vertices, edges,
      maxwellThreshold: 0,
      coherence: 0,
      isRigid: false,
      degreesOfFreedom: 0,
      isOverConstrained: false,
    };
  }

  const threshold = 3 * vertices - 6;

  if (threshold <= 0) {
    return {
      vertices, edges,
      maxwellThreshold: Math.max(0, threshold),
      coherence: edges > 0 ? Infinity : 0,
      isRigid: edges >= 1,
      degreesOfFreedom: 0,
      isOverConstrained: edges > 1,
    };
  }

  const coherence = edges / threshold;
  const dof = Math.max(0, threshold - edges);

  return {
    vertices,
    edges,
    maxwellThreshold: threshold,
    coherence,
    isRigid: edges >= threshold,
    degreesOfFreedom: dof,
    isOverConstrained: edges > threshold,
  };
}

export function analyzeStructure(pieces: readonly PlacedPiece[]): RigidityAnalysis {
  if (pieces.length === 0) {
    return maxwellAnalysis(0, 0);
  }

  let totalVertices = 0;
  let totalEdges = 0;

  for (const piece of pieces) {
    const geom = PRIMITIVES[piece.type];
    totalVertices += geom.vertices;
    totalEdges += geom.edges;
  }

  const connectionSet = new Set<string>();
  for (const piece of pieces) {
    for (const connId of piece.connectedTo) {
      const key = [piece.id, connId].sort().join(":");
      if (!connectionSet.has(key)) {
        connectionSet.add(key);
        totalVertices -= 1;
        totalEdges += 1;
      }
    }
  }

  return maxwellAnalysis(totalVertices, totalEdges);
}

export function canSnap(
  pieceA: PlacedPiece,
  pointA: Vec3,
  pieceB: PlacedPiece,
  pointB: Vec3,
  tolerance: number = 0.1
): boolean {
  const worldA = addVec3(pieceA.position, scaleVec3(pointA, pieceA.scale));
  const worldB = addVec3(pieceB.position, scaleVec3(pointB, pieceB.scale));
  return distanceVec3(worldA, worldB) <= tolerance;
}

export function findSnaps(
  newPiece: PlacedPiece,
  existing: readonly PlacedPiece[],
  tolerance: number = 0.1
): Array<{ existingPieceId: string; newPoint: Vec3; existingPoint: Vec3 }> {
  const newGeom = PRIMITIVES[newPiece.type];
  const snaps: Array<{ existingPieceId: string; newPoint: Vec3; existingPoint: Vec3 }> = [];

  for (const piece of existing) {
    if (piece.id === newPiece.id) continue;
    const existGeom = PRIMITIVES[piece.type];

    for (const np of newGeom.connectionPoints) {
      for (const ep of existGeom.connectionPoints) {
        if (canSnap(newPiece, np, piece, ep, tolerance)) {
          snaps.push({ existingPieceId: piece.id, newPoint: np, existingPoint: ep });
        }
      }
    }
  }

  return snaps;
}
