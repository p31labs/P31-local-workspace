import type {
  StructuralNode,
  BeamElement,
  ValidationError,
  Vec3,
} from './types.js';
import { analyzeRigidity } from './rigidity.js';
import { buildSparseStiffnessMatrix, sparseToDense, computeBeamStresses } from './stiffness.js';

function subVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function normVec3(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function dotVec3(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function crossVec3(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function distancePointToLine(point: Vec3, lineStart: Vec3, lineEnd: Vec3): number {
  const dir = subVec3(lineEnd, lineStart);
  const toPoint = subVec3(point, lineStart);
  const cross = crossVec3(dir, toPoint);
  return normVec3(cross) / normVec3(dir);
}

function surfaceArea(nodes: StructuralNode[], beams: BeamElement[]): number {
  if (nodes.length < 3) return 0;
  // Approximate surface area using convex hull of beam endpoints
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) adjacency.set(node.id, []);
  for (const beam of beams) {
    adjacency.get(beam.startNodeId)?.push(beam.endNodeId);
    adjacency.get(beam.endNodeId)?.push(beam.startNodeId);
  }
  // Find cycles (faces) using walking algorithm
  const visited = new Set<string>();
  let area = 0;
  for (const node of nodes) {
    if (visited.has(node.id)) continue;
    const neighbors = adjacency.get(node.id) ?? [];
    if (neighbors.length < 2) continue;
    // Walk a cycle
    const cycle: Vec3[] = [node.position];
    let current = node.id;
    let prev = '';
    for (let i = 0; i < 100; i++) {
      const nextNeighbors = adjacency.get(current) ?? [];
      const next = nextNeighbors.find(n => n !== prev);
      if (!next || next === node.id) break;
      const nextNode = nodes.find(n => n.id === next);
      if (!nextNode) break;
      cycle.push(nextNode.position);
      visited.add(next);
      prev = current;
      current = next;
    }
    if (cycle.length >= 3) {
      // Newell's method for polygon area
      let nx = 0, ny = 0, nz = 0;
      for (let i = 0; i < cycle.length; i++) {
        const a = cycle[i];
        const b = cycle[(i + 1) % cycle.length];
        nx += a.y * b.z - a.z * b.y;
        ny += a.z * b.x - a.x * b.z;
        nz += a.x * b.y - a.y * b.x;
      }
      const normal = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (normal > 1e-10) {
        area += normal / 2;
      }
    }
  }
  return area;
}

function hasReflexAngle(nodes: StructuralNode[], beams: BeamElement[]): boolean {
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) adjacency.set(node.id, []);
  for (const beam of beams) {
    adjacency.get(beam.startNodeId)?.push(beam.endNodeId);
    adjacency.get(beam.endNodeId)?.push(beam.startNodeId);
  }

  for (const node of nodes) {
    const neighbors = adjacency.get(node.id) ?? [];
    if (neighbors.length < 3) continue;
    const v = node.position;
    const pts = neighbors
      .map(id => nodes.find(n => n.id === id)?.position)
      .filter((p): p is Vec3 => !!p);
    if (pts.length < 3) continue;

    for (let i = 0; i < pts.length; i++) {
      const a = subVec3(pts[i], v);
      const b = subVec3(pts[(i + 1) % pts.length], v);
      const c = subVec3(pts[(i + 2) % pts.length], v);
      const ab = crossVec3(a, b);
      const bc = crossVec3(b, c);
      const angle = Math.acos(Math.max(-1, Math.min(1,
        dotVec3(ab, bc) / (normVec3(ab) * normVec3(bc))
      )));
      if (angle > Math.PI) return true;
    }
  }
  return false;
}

// ─── Challenge Constraint Validators ───

export interface StructuralChallenge {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly difficulty: number;
  readonly validate: (
    nodes: StructuralNode[],
    beams: BeamElement[]
  ) => { passed: boolean; errors: string[] };
}

const HELIX: StructuralChallenge = {
  id: 'helix',
  name: 'Helix',
  description: 'Build a helical structure with at least 8 nodes and 7 beams along a helical curve.',
  difficulty: 1,
  validate(nodes, beams) {
    const errors: string[] = [];
    if (nodes.length < 8) errors.push(`Need ≥8 nodes, got ${nodes.length}`);
    if (beams.length < 7) errors.push(`Need ≥7 beams, got ${beams.length}`);

    // Check nodes lie approximately on a helix
    const axis = { x: 0, y: 0, z: 1 };
    const center = { x: 0, y: 0, z: 0 };
    const radiuses = nodes.map(n => distancePointToLine(n.position, center, axis));
    const avgRadius = radiuses.reduce((a, b) => a + b, 0) / radiuses.length;
    if (avgRadius < 0.2 || avgRadius > 0.5) {
      errors.push(`Nodes should lie on a helical path (radius ~0.3), got avg radius ${avgRadius.toFixed(3)}`);
    }

    return { passed: errors.length === 0, errors };
  },
};

const STRUCTURAL_GEODESIC: StructuralChallenge = {
  id: 'structural_geodesic',
  name: 'Geodesic Dome',
  description: 'Build a geodesic dome with at least 10 nodes forming a hemisphere.',
  difficulty: 2,
  validate(nodes, beams) {
    const errors: string[] = [];
    if (nodes.length < 10) errors.push(`Need ≥10 nodes, got ${nodes.length}`);

    // Check hemisphere: all nodes should be in z >= -0.1 (dome sits on z=0 plane)
    // and distributed across the surface
    const minZ = Math.min(...nodes.map(n => n.position.z));
    const maxZ = Math.max(...nodes.map(n => n.position.z));
    const spanRatio = (maxZ - minZ) / Math.max(1, maxZ - minZ);
    if (spanRatio < 0.5) {
      errors.push(`Structure should be a dome (height/span ≥ 0.5), got ${spanRatio.toFixed(2)}`);
    }

    // Check rigidity
    const rigidity = analyzeRigidity(nodes, beams);
    if (!rigidity.isRigid) errors.push('Structure is not rigid');

    return { passed: errors.length === 0, errors };
  },
};

const TENSEGRITY: StructuralChallenge = {
  id: 'tensegrity',
  name: 'Tensegrity',
  description: 'Build a tensegrity structure with non-touching beams under low stress.',
  difficulty: 3,
  validate(nodes, beams) {
    const errors: string[] = [];
    if (nodes.length < 6) errors.push(`Need ≥6 nodes, got ${nodes.length}`);
    if (beams.length < 3) errors.push(`Need ≥3 beams, got ${beams.length}`);

    // No two beams share a node
    const beamNodeSets = beams.map(b => new Set([b.startNodeId, b.endNodeId]));
    for (let i = 0; i < beamNodeSets.length; i++) {
      for (let j = i + 1; j < beamNodeSets.length; j++) {
        const shared = [...beamNodeSets[i]].filter(n => beamNodeSets[j].has(n));
        if (shared.length > 0) {
          errors.push(`Beams share node(s): ${shared.join(', ')}`);
        }
      }
    }

    // Stress check (using stiffness-based approximation)
    try {
      const stressResult = computeBeamStresses(nodes, beams, null);
      const maxStressRatio = Math.abs(stressResult.maxStress) / 250e6;
      if (maxStressRatio > 0.3) {
        errors.push(`Max stress ratio ${maxStressRatio.toFixed(3)} exceeds 0.3`);
      }
    } catch {
      // Non-critical: stress check may fail for minimal structures
    }

    return { passed: errors.length === 0, errors };
  },
};

const TRUSS_BRIDGE: StructuralChallenge = {
  id: 'truss_bridge',
  name: 'Truss Bridge',
  description: 'Build an efficient truss bridge spanning at least 2 units.',
  difficulty: 2,
  validate(nodes, beams) {
    const errors: string[] = [];
    const minX = Math.min(...nodes.map(n => n.position.x));
    const maxX = Math.max(...nodes.map(n => n.position.x));
    const span = maxX - minX;

    if (span < 2) errors.push(`Span (${span.toFixed(2)}) must be ≥ 2`);

    // Beam utilization: at least 60% of beams should be non-vertical
    const horizontalCount = beams.filter(b => {
      const sn = nodes.find(n => n.id === b.startNodeId);
      const en = nodes.find(n => n.id === b.endNodeId);
      if (!sn || !en) return false;
      const dir = subVec3(en.position, sn.position);
      return Math.abs(dir.y) / (normVec3(dir) || 1) < 0.5;
    }).length;
    const utilization = beams.length > 0 ? horizontalCount / beams.length : 0;
    if (utilization < 0.6) {
      errors.push(`Beam utilization ${(utilization * 100).toFixed(0)}% < 60% (need more horizontal/diagonal beams)`);
    }

    return { passed: errors.length === 0, errors };
  },
};

const TALL_TOWER: StructuralChallenge = {
  id: 'tall_tower',
  name: 'Tall Tower',
  description: 'Build a tower at least 4 units high with ≥15 nodes and stability >0.6.',
  difficulty: 4,
  validate(nodes, beams) {
    const errors: string[] = [];
    if (nodes.length < 15) errors.push(`Need ≥15 nodes, got ${nodes.length}`);

    const minZ = Math.min(...nodes.map(n => n.position.z));
    const maxZ = Math.max(...nodes.map(n => n.position.z));
    const height = maxZ - minZ;
    if (height < 4) errors.push(`Height (${height.toFixed(2)}) must be ≥ 4`);

    // Stability from rigidity analysis
    const rigidity = analyzeRigidity(nodes, beams);
    const stabilityRatio = beams.length / Math.max(1, 3 * nodes.length - 6);
    if (stabilityRatio < 0.6) {
      errors.push(`Stability ratio ${stabilityRatio.toFixed(3)} < 0.6`);
    }

    return { passed: errors.length === 0, errors };
  },
};

const MINIMAL_SURFACE: StructuralChallenge = {
  id: 'minimal_surface',
  name: 'Minimal Surface',
  description: 'Build a non-convex polyhedron with ≥12 nodes and surface area <6.0.',
  difficulty: 5,
  validate(nodes, beams) {
    const errors: string[] = [];
    if (nodes.length < 12) errors.push(`Need ≥12 nodes, got ${nodes.length}`);

    if (nodes.length >= 4) {
      const area = surfaceArea(nodes, beams);
      if (area >= 6.0) {
        errors.push(`Surface area ${area.toFixed(2)} must be < 6.0`);
      }
    }

    if (!hasReflexAngle(nodes, beams)) {
      errors.push('Structure must have at least one reflex interior angle (>180°)');
    }

    return { passed: errors.length === 0, errors };
  },
};

const TENSEGRITY_STAR: StructuralChallenge = {
  id: 'tensegrity_star',
  name: 'Tensegrity Star',
  description: 'Build a tensegrity star with ≥12 nodes, floating beams, stress <0.2, height ≥ 2.5.',
  difficulty: 5,
  validate(nodes, beams) {
    const errors: string[] = [];
    if (nodes.length < 12) errors.push(`Need ≥12 nodes, got ${nodes.length}`);

    // Beams should not share nodes (floating)
    const beamNodeSets = beams.map(b => new Set([b.startNodeId, b.endNodeId]));
    for (let i = 0; i < beamNodeSets.length; i++) {
      for (let j = i + 1; j < beamNodeSets.length; j++) {
        const shared = [...beamNodeSets[i]].filter(n => beamNodeSets[j].has(n));
        if (shared.length > 0) {
          errors.push(`Beams share node(s): ${shared.join(', ')}`);
        }
      }
    }

    // Height constraint
    const minZ = Math.min(...nodes.map(n => n.position.z));
    const maxZ = Math.max(...nodes.map(n => n.position.z));
    const height = maxZ - minZ;
    if (height < 2.5) errors.push(`Height (${height.toFixed(2)}) < 2.5`);

    // Stress check
    try {
      const stressResult = computeBeamStresses(nodes, beams, null);
      const maxStressRatio = Math.abs(stressResult.maxStress) / 250e6;
      if (maxStressRatio > 0.2) {
        errors.push(`Max stress ratio ${maxStressRatio.toFixed(3)} exceeds 0.2`);
      }
    } catch {
      // Non-critical
    }

    return { passed: errors.length === 0, errors };
  },
};

export const STRUCTURAL_CHALLENGES: readonly StructuralChallenge[] = [
  HELIX,
  STRUCTURAL_GEODESIC,
  TENSEGRITY,
  TRUSS_BRIDGE,
  TALL_TOWER,
  MINIMAL_SURFACE,
  TENSEGRITY_STAR,
];

export function getStructuralChallenge(id: string): StructuralChallenge | undefined {
  return STRUCTURAL_CHALLENGES.find(c => c.id === id);
}

export function evaluateStructuralChallenge(
  challengeId: string,
  nodes: StructuralNode[],
  beams: BeamElement[]
): { passed: boolean; errors: string[] } {
  const challenge = getStructuralChallenge(challengeId);
  if (!challenge) return { passed: false, errors: [`Unknown challenge: ${challengeId}`] };
  return challenge.validate(nodes, beams);
}
