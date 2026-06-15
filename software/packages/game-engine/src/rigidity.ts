import { Matrix, SVD } from 'ml-matrix';
import type { StructuralNode, BeamElement, StructuralAnalysis, Vec3 } from './types.js';

function subVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function dotVec3(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function normVec3(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function buildEquilibriumMatrix(
  nodes: readonly StructuralNode[],
  beams: readonly BeamElement[]
): Matrix {
  const n = nodes.length;
  const b = beams.length;
  const nodeIndex = new Map<string, number>();
  nodes.forEach((node, i) => nodeIndex.set(node.id, i));

  const A = new Matrix(3 * n, b);

  for (let j = 0; j < b; j++) {
    const beam = beams[j];
    const si = nodeIndex.get(beam.startNodeId);
    const ei = nodeIndex.get(beam.endNodeId);
    if (si === undefined || ei === undefined) continue;

    const start = nodes[si].position;
    const end = nodes[ei].position;
    const dir = subVec3(end, start);
    const len = normVec3(dir) || 1;
    const dx = dir.x / len;
    const dy = dir.y / len;
    const dz = dir.z / len;

    A.set(3 * si, j, dx);
    A.set(3 * si + 1, j, dy);
    A.set(3 * si + 2, j, dz);
    A.set(3 * ei, j, -dx);
    A.set(3 * ei + 1, j, -dy);
    A.set(3 * ei + 2, j, -dz);
  }

  return A;
}

export interface RigidityResult {
  readonly isRigid: boolean;
  readonly rank: number;
  readonly nullity: number;
  readonly rankDeficiency: number;
  readonly internalMechanisms: number;
}

export function analyzeRigidity(
  nodes: readonly StructuralNode[],
  beams: readonly BeamElement[]
): RigidityResult {
  const n = nodes.length;
  const b = beams.length;
  const threshold = Math.max(0, 3 * n - 6);

  if (n < 2 || b === 0) {
    return {
      isRigid: false,
      rank: 0,
      nullity: 0,
      rankDeficiency: threshold,
      internalMechanisms: 0,
    };
  }

  const A = buildEquilibriumMatrix(nodes, beams);

  try {
    const svd = new SVD(A, { computeLeftSingularVectors: false, computeRightSingularVectors: false });
    const singularValues = svd.diagonal;
    const tol = 1e-8;
    const rank = singularValues.filter((s: number) => Math.abs(s) > tol).length;
    const nullity = b - rank;
    const rankDeficiency = Math.max(0, threshold - rank);

    return {
      isRigid: rank >= threshold,
      rank,
      nullity,
      rankDeficiency,
      internalMechanisms: Math.max(0, b - rank),
    };
  } catch {
    return {
      isRigid: false,
      rank: 0,
      nullity: b,
      rankDeficiency: threshold,
      internalMechanisms: b,
    };
  }
}

export function computeMass(
  nodes: readonly StructuralNode[],
  beams: readonly BeamElement[],
  materialDensity: number
): number {
  let totalMass = 0;
  const nodePos = new Map<string, Vec3>();
  nodes.forEach(n => nodePos.set(n.id, n.position));

  for (const beam of beams) {
    const start = nodePos.get(beam.startNodeId);
    const end = nodePos.get(beam.endNodeId);
    if (!start || !end) continue;
    const len = normVec3(subVec3(end, start));
    totalMass += beam.crossSection * len * materialDensity;
  }

  return totalMass;
}

export function analyzeStructureFull(
  nodes: readonly StructuralNode[],
  beams: readonly BeamElement[],
  materialDensity: number
): StructuralAnalysis {
  const rigidity = analyzeRigidity(nodes, beams);

  return {
    nodeCount: nodes.length,
    beamCount: beams.length,
    maxwellThreshold: Math.max(0, 3 * nodes.length - 6),
    rank: rigidity.rank,
    nullity: rigidity.nullity,
    rankDeficiency: rigidity.rankDeficiency,
    isRigid: rigidity.isRigid,
    naturalFrequencies: [],
    maxStress: 0,
    totalMass: computeMass(nodes, beams, materialDensity),
    displacement: [],
  };
}
