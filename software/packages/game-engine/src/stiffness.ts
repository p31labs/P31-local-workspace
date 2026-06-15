import { Matrix, EigenvalueDecomposition, inverse, pseudoInverse } from 'ml-matrix';
import type { StructuralNode, BeamElement, Vec3, BeamMaterial } from './types.js';
import { MATERIAL_PROPERTIES } from './types.js';

function subVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function normVec3(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export interface SparseStiffnessEntry {
  readonly row: number;
  readonly col: number;
  readonly value: number;
}

export function buildSparseStiffnessMatrix(
  nodes: readonly StructuralNode[],
  beams: readonly BeamElement[],
  EOverride?: number,
  AOverride?: number
): { entries: SparseStiffnessEntry[]; dimension: number } {
  const n = nodes.length;
  const dim = 3 * n;
  const entries: SparseStiffnessEntry[] = [];
  const nodeIndex = new Map<string, number>();
  nodes.forEach((node, i) => nodeIndex.set(node.id, i));

  for (const beam of beams) {
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

    const E = EOverride ?? MATERIAL_PROPERTIES[beam.material].youngModulus;
    const A = AOverride ?? beam.crossSection;
    const k = (E * A) / len;

    const ke = [
      [k * dx * dx, k * dx * dy, k * dx * dz],
      [k * dy * dx, k * dy * dy, k * dy * dz],
      [k * dz * dx, k * dz * dy, k * dz * dz],
    ];

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        entries.push({ row: 3 * si + i, col: 3 * si + j, value: ke[i][j] });
        entries.push({ row: 3 * ei + i, col: 3 * ei + j, value: ke[i][j] });
        entries.push({ row: 3 * si + i, col: 3 * ei + j, value: -ke[i][j] });
        entries.push({ row: 3 * ei + i, col: 3 * si + j, value: -ke[i][j] });
      }
    }
  }

  return { entries, dimension: dim };
}

export function sparseToDense(
  entries: readonly SparseStiffnessEntry[],
  dimension: number
): Matrix {
  const K = new Matrix(dimension, dimension);
  for (const e of entries) {
    const current = K.get(e.row, e.col);
    K.set(e.row, e.col, current + e.value);
  }
  return K;
}

export interface EigenResult {
  readonly eigenvalues: readonly number[];
  readonly eigenvectors: readonly number[][];
  readonly naturalFrequencies: readonly number[];
}

export function computeEigen(
  nodes: readonly StructuralNode[],
  beams: readonly BeamElement[],
  EOverride?: number,
  AOverride?: number,
  densityOverride?: number
): EigenResult {
  const { entries, dimension } = buildSparseStiffnessMatrix(nodes, beams, EOverride, AOverride);
  if (dimension === 0) {
    return { eigenvalues: [], eigenvectors: [], naturalFrequencies: [] };
  }

  const K = sparseToDense(entries, dimension);

  try {
    const eig = new EigenvalueDecomposition(K);
    const real = eig.realEigenvalues;
    const imag = eig.imaginaryEigenvalues;

    const stableEigenvalues = real
      .map((val: number, idx: number) => ({ val, idx }))
      .filter(({ val, idx }: { val: number; idx: number }) => val > 1e-6 && Math.abs(imag[idx]) < 1e-8)
      .sort((a: { val: number; idx: number }, b: { val: number; idx: number }) => a.val - b.val);

    const modeShapes = eig.eigenvectorMatrix;

    const frequencies = stableEigenvalues.map(({ val }: { val: number }) =>
      Math.sqrt(val) / (2 * Math.PI)
    );

    const eigenvectors = stableEigenvalues.map(({ idx }: { idx: number }) => {
      const vec: number[] = [];
      for (let r = 0; r < dimension; r++) {
        vec.push(modeShapes.get(r, idx));
      }
      return vec;
    });

    return {
      eigenvalues: stableEigenvalues.map((e: { val: number }) => e.val),
      eigenvectors,
      naturalFrequencies: frequencies,
    };
  } catch {
    return { eigenvalues: [], eigenvectors: [], naturalFrequencies: [] };
  }
}

export interface StressAnalysis {
  readonly beamStresses: Map<string, number>;
  readonly maxStress: number;
  readonly maxStressBeamId: string;
}

export function computeBeamStresses(
  nodes: readonly StructuralNode[],
  beams: readonly BeamElement[],
  externalForces: readonly number[] | null
): StressAnalysis {
  const n = nodes.length;
  const b = beams.length;
  const nodeIndex = new Map<string, number>();
  nodes.forEach((node, i) => nodeIndex.set(node.id, i));

  if (!externalForces || externalForces.length < 3 * n) {
    const beamStresses = new Map<string, number>();
    let maxStress = 0;
    let maxStressBeamId = '';

    for (const beam of beams) {
      const E = MATERIAL_PROPERTIES[beam.material].youngModulus;
      const A = beam.crossSection;
      const si = nodeIndex.get(beam.startNodeId);
      const ei = nodeIndex.get(beam.endNodeId);
      if (si === undefined || ei === undefined) continue;
      const dir = subVec3(nodes[ei].position, nodes[si].position);
      const len = normVec3(dir) || 1;
      const axialStrain = (len - len) / len;
      const stress = E * axialStrain;
      beamStresses.set(beam.id, stress);
    }

    return { beamStresses, maxStress: 0, maxStressBeamId: '' };
  }

  const A = new Matrix(3 * n, b);
  for (let j = 0; j < b; j++) {
    const beam = beams[j];
    const si = nodeIndex.get(beam.startNodeId);
    const ei = nodeIndex.get(beam.endNodeId);
    if (si === undefined || ei === undefined) continue;
    const dir = subVec3(nodes[ei].position, nodes[si].position);
    const len = normVec3(dir) || 1;
    A.set(3 * si, j, dir.x / len);
    A.set(3 * si + 1, j, dir.y / len);
    A.set(3 * si + 2, j, dir.z / len);
    A.set(3 * ei, j, -dir.x / len);
    A.set(3 * ei + 1, j, -dir.y / len);
    A.set(3 * ei + 2, j, -dir.z / len);
  }

  const forceMat = new Matrix(3 * n, 1);
  for (let i = 0; i < 3 * n && i < externalForces.length; i++) {
    forceMat.set(i, 0, externalForces[i]);
  }
  let beamForces: Matrix;
  try {
    const AT = A.transpose();
    const ATA = AT.mmul(A);
    const regularized = ATA.clone();
    for (let i = 0; i < b; i++) {
      regularized.set(i, i, regularized.get(i, i) + 1e-10);
    }
    const ATAInv = inverse(regularized);
    beamForces = ATAInv.mmul(AT).mmul(forceMat);
  } catch {
    const beamStresses = new Map<string, number>();
    return { beamStresses, maxStress: 0, maxStressBeamId: '' };
  }

  const beamStresses = new Map<string, number>();
  let maxStress = 0;
  let maxStressBeamId = '';

  for (let j = 0; j < b; j++) {
    const beam = beams[j];
    const A_cs = beam.crossSection;
    const force = beamForces.get(j, 0);
    const stress = force / A_cs;
    beamStresses.set(beam.id, stress);
    if (Math.abs(stress) > Math.abs(maxStress)) {
      maxStress = stress;
      maxStressBeamId = beam.id;
    }
  }

  return { beamStresses, maxStress, maxStressBeamId };
}
