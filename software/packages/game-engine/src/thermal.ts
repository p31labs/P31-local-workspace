import type { StructuralNode, BeamElement, Vec3, BeamMaterial } from './types.js';
import { MATERIAL_PROPERTIES } from './types.js';

function subVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function addVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function scaleVec3(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function normVec3(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z );
}

function normalizeVec3(v: Vec3): Vec3 {
  const n = normVec3(v) || 1;
  return { x: v.x / n, y: v.y / n, z: v.z / n };
}

export interface ThermalResult {
  readonly displacedNodes: readonly StructuralNode[];
  readonly maxDisplacement: number;
  readonly beamStrain: Map<string, number>;
}

export function thermalExpand(
  nodes: readonly StructuralNode[],
  beams: readonly BeamElement[],
  deltaTemp: number,
  alphaOverride?: number
): ThermalResult {
  const nodePos = new Map<string, Vec3>();
  const nodeDisplacement = new Map<string, Vec3>();
  const beamStrain = new Map<string, number>();

  for (const node of nodes) {
    nodePos.set(node.id, node.position);
    nodeDisplacement.set(node.id, { x: 0, y: 0, z: 0 });
  }

  for (const beam of beams) {
    const start = nodePos.get(beam.startNodeId);
    const end = nodePos.get(beam.endNodeId);
    if (!start || !end) continue;

    const alpha = alphaOverride ?? MATERIAL_PROPERTIES[beam.material].thermalExpansion;
    const dir = subVec3(end, start);
    const len = normVec3(dir);
    if (len < 1e-12) continue;

    const deltaL = alpha * deltaTemp * len;
    const strain = deltaL / len;
    beamStrain.set(beam.id, strain);

    const halfDelta = scaleVec3(normalizeVec3(dir), deltaL / 2);
    const existingStart = nodeDisplacement.get(beam.startNodeId)!;
    const existingEnd = nodeDisplacement.get(beam.endNodeId)!;
    nodeDisplacement.set(beam.startNodeId, addVec3(existingStart, halfDelta));
    nodeDisplacement.set(beam.endNodeId, addVec3(existingEnd, halfDelta));
  }

  let maxDisplacement = 0;
  const displacedNodes = nodes.map(node => {
    const disp = nodeDisplacement.get(node.id) ?? { x: 0, y: 0, z: 0 };
    const d = normVec3(disp);
    if (d > maxDisplacement) maxDisplacement = d;
    return {
      id: node.id,
      position: addVec3(node.position, disp),
    };
  });

  return { displacedNodes, maxDisplacement, beamStrain };
}
