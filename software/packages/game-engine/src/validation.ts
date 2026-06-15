import type {
  StructuralNode,
  BeamElement,
  ValidationError,
  ValidationErrorCode,
  Vec3,
} from './types.js';
import { analyzeRigidity } from './rigidity.js';

function distanceSq(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

function distance(a: Vec3, b: Vec3): number {
  return Math.sqrt(distanceSq(a, b));
}

function crossVec3(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function subVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function dotVec3(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export interface ValidationParams {
  readonly maxNodes: number;
  readonly gridBounds: readonly [number, number, number];
  readonly minNodes?: number;
  readonly minBeams?: number;
}

const DEFAULT_PARAMS: ValidationParams = {
  maxNodes: 100,
  gridBounds: [10, 10, 10] as [number, number, number],
  minNodes: 2,
  minBeams: 1,
};

export function validateStructure(
  nodes: readonly StructuralNode[],
  beams: readonly BeamElement[],
  params: Partial<ValidationParams> = {}
): ValidationError[] {
  const errors: ValidationError[] = [];
  const p = { ...DEFAULT_PARAMS, ...params };

  const [bx, by, bz] = p.gridBounds;

  // Insufficient nodes
  if (nodes.length === 0) {
    errors.push({
      code: 'INSUFFICIENT_NODES',
      message: 'No nodes defined. A structure must have at least one node.',
    });
    return errors;
  }

  // Max nodes exceeded
  if (nodes.length > p.maxNodes) {
    errors.push({
      code: 'MAX_NODES_EXCEEDED',
      message: `Node count (${nodes.length}) exceeds maximum (${p.maxNodes}).`,
    });
  }

  // Insufficient beams
  if (beams.length === 0) {
    errors.push({
      code: 'INSUFFICIENT_BEAMS',
      message: 'No beams defined. A structure must have at least one beam.',
    });
  }

  // Node duplicates
  const nodeIdSet = new Set<string>();
  const nodePosMap = new Map<string, StructuralNode[]>();
  const addedIds = new Set<string>();
  for (const node of nodes) {
    if (addedIds.has(node.id)) {
      errors.push({
        code: 'NODE_DUPLICATE',
        message: `Duplicate node id: ${node.id}.`,
        nodeIds: [node.id],
      });
    }
    addedIds.add(node.id);

    nodeIdSet.add(node.id);

    const key = `${node.position.x.toFixed(6)},${node.position.y.toFixed(6)},${node.position.z.toFixed(6)}`;
    const existing = nodePosMap.get(key) || [];
    existing.push(node);
    nodePosMap.set(key, existing);
  }

  // Node out of bounds
  for (const node of nodes) {
    if (
      Math.abs(node.position.x) > bx ||
      Math.abs(node.position.y) > by ||
      Math.abs(node.position.z) > bz
    ) {
      errors.push({
        code: 'NODE_OUT_OF_BOUNDS',
        message: `Node ${node.id} position (${node.position.x.toFixed(2)}, ${node.position.y.toFixed(2)}, ${node.position.z.toFixed(2)}) exceeds grid bounds [±${bx}, ±${by}, ±${bz}].`,
        nodeIds: [node.id],
      });
    }
  }

  // Coincident nodes
  for (const [key, dupes] of nodePosMap) {
    if (dupes.length > 1) {
      const ids = dupes.map(d => d.id);
      if (ids.length > 1) {
        errors.push({
          code: 'NODE_DUPLICATE',
          message: `${ids.length} nodes share position (${key}). Consider merging: ${ids.join(', ')}.`,
          nodeIds: ids,
        });
      }
    }
  }

  // Beam self-references
  for (const beam of beams) {
    if (beam.startNodeId === beam.endNodeId) {
      errors.push({
        code: 'BEAM_SELF_REFERENCE',
        message: `Beam ${beam.id} starts and ends at the same node (${beam.startNodeId}).`,
        beamIds: [beam.id],
      });
    }
  }

  // Beam duplicates (same start-end pair)
  const beamPairSet = new Set<string>();
  for (const beam of beams) {
    const pair = [beam.startNodeId, beam.endNodeId].sort().join(':');
    if (beamPairSet.has(pair)) {
      errors.push({
        code: 'BEAM_DUPLICATE',
        message: `Multiple beams connect nodes ${beam.startNodeId} and ${beam.endNodeId}.`,
        beamIds: [beam.id],
      });
    }
    beamPairSet.add(pair);

    if (!nodeIdSet.has(beam.startNodeId)) {
      errors.push({
        code: 'INSUFFICIENT_NODES',
        message: `Beam ${beam.id} references nonexistent start node ${beam.startNodeId}.`,
        beamIds: [beam.id],
      });
    }
    if (!nodeIdSet.has(beam.endNodeId)) {
      errors.push({
        code: 'INSUFFICIENT_NODES',
        message: `Beam ${beam.id} references nonexistent end node ${beam.endNodeId}.`,
        beamIds: [beam.id],
      });
    }
  }

  // Overlapping beams (non-parallel beams that cross within tolerance)
  const OVERLAP_TOLERANCE_SQ = 1e-12;
  for (let i = 0; i < beams.length; i++) {
    for (let j = i + 1; j < beams.length; j++) {
      const bi = beams[i];
      const bj = beams[j];

      if (bi.startNodeId === bj.startNodeId || bi.startNodeId === bj.endNodeId ||
          bi.endNodeId === bj.startNodeId || bi.endNodeId === bj.endNodeId) {
        continue;
      }

      const si = nodes.find(n => n.id === bi.startNodeId);
      const ei = nodes.find(n => n.id === bi.endNodeId);
      const sj = nodes.find(n => n.id === bj.startNodeId);
      const ej = nodes.find(n => n.id === bj.endNodeId);
      if (!si || !ei || !sj || !ej) continue;

      const dir1 = subVec3(ei.position, si.position);
      const dir2 = subVec3(ej.position, sj.position);
      const cross = crossVec3(dir1, dir2);
      const crossNormSq = dotVec3(cross, cross);

      if (crossNormSq < OVERLAP_TOLERANCE_SQ) continue;

      const diff = subVec3(sj.position, si.position);
      const t = dotVec3(crossVec3(diff, dir2), cross) / crossNormSq;
      const u = dotVec3(crossVec3(diff, dir1), cross) / crossNormSq;

      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        errors.push({
          code: 'OVERLAP',
          message: `Beams ${bi.id} and ${bj.id} intersect in 3D space.`,
          beamIds: [bi.id, bj.id],
        });
        break;
      }
    }
  }

  // Rigidity check
  if (errors.some(e => e.code === 'INSUFFICIENT_NODES' || e.code === 'INSUFFICIENT_BEAMS')) {
    return errors;
  }

  const rigidity = analyzeRigidity(nodes, beams);
  if (!rigidity.isRigid) {
    errors.push({
      code: 'NOT_RIGID',
      message: `Structure is not rigid. Rank ${rigidity.rank} < threshold ${Math.max(0, 3 * nodes.length - 6)}. Deficiency: ${rigidity.rankDeficiency}.`,
    });
  }

  // Discontinuity check (graph connectivity)
  if (nodes.length > 0 && beams.length > 0) {
    const adjacency = new Map<string, string[]>();
    for (const node of nodes) adjacency.set(node.id, []);
    for (const beam of beams) {
      adjacency.get(beam.startNodeId)?.push(beam.endNodeId);
      adjacency.get(beam.endNodeId)?.push(beam.startNodeId);
    }

    const visited = new Set<string>();
    const queue = [nodes[0].id];
    visited.add(nodes[0].id);
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const neighbor of adjacency.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        errors.push({
          code: 'DISCONTINUITY',
          message: `Node ${node.id} is disconnected from the main structure.`,
          nodeIds: [node.id],
        });
      }
    }
  }

  return errors;
}
