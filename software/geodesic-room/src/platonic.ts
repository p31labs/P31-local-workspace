/**
 * Platonic solid local vertices + edges — byte-aligned with Three.js r160
 * (TetrahedronGeometry(1), OctahedronGeometry(1), IcosahedronGeometry(1), BoxGeometry(1.5³)).
 */

export type ShapeType = 'tet' | 'oct' | 'ico' | 'cube';

export type StrutMap = Record<string, StrutRecord>;

export interface StrutRecord {
  id: string;
  aShape: string;
  aVi: number;
  bShape: string;
  bVi: number;
  clientId: string;
  ts: number;
}

export interface ShapePose {
  type: ShapeType;
  x: number;
  y: number;
  z: number;
  rotY?: number;
}

/** Unique local vertices (object space), matching Three.js BufferGeometry order after dedupe. */
export const PLATONIC_VERTS: Record<ShapeType, readonly [number, number, number][]> = {
  tet: [
    [-0.5773502588272095, -0.5773502588272095, 0.5773502588272095],
    [0.5773502588272095, 0.5773502588272095, 0.5773502588272095],
    [-0.5773502588272095, 0.5773502588272095, -0.5773502588272095],
    [0.5773502588272095, -0.5773502588272095, -0.5773502588272095],
  ],
  oct: [
    [0, 1, 0],
    [0, 0, 1],
    [1, 0, 0],
    [0, -1, 0],
    [0, 0, -1],
    [-1, 0, 0],
  ],
  ico: [
    [-0.8506507873535156, 0, 0.525731086730957],
    [0, 0.525731086730957, 0.8506507873535156],
    [-0.525731086730957, 0.8506507873535156, 0],
    [0.525731086730957, 0.8506507873535156, 0],
    [0, 0.525731086730957, -0.8506507873535156],
    [-0.8506507873535156, 0, -0.525731086730957],
    [0.8506507873535156, 0, 0.525731086730957],
    [0, -0.525731086730957, 0.8506507873535156],
    [-0.525731086730957, -0.8506507873535156, 0],
    [0, -0.525731086730957, -0.8506507873535156],
    [0.8506507873535156, 0, -0.525731086730957],
    [0.525731086730957, -0.8506507873535156, 0],
  ],
  cube: [
    [0.75, 0.75, 0.75],
    [0.75, 0.75, -0.75],
    [0.75, -0.75, 0.75],
    [0.75, -0.75, -0.75],
    [-0.75, 0.75, -0.75],
    [-0.75, 0.75, 0.75],
    [-0.75, -0.75, -0.75],
    [-0.75, -0.75, 0.75],
  ],
};

export const PLATONIC_EDGES: Record<ShapeType, readonly [number, number][]> = {
  tet: [
    [1, 2],
    [1, 3],
    [0, 1],
    [0, 3],
    [0, 2],
    [2, 3],
  ],
  oct: [
    [1, 2],
    [2, 3],
    [0, 2],
    [2, 4],
    [0, 4],
    [3, 4],
    [4, 5],
    [1, 3],
    [3, 5],
    [0, 1],
    [0, 5],
    [1, 5],
  ],
  ico: [
    [1, 2],
    [2, 3],
    [2, 4],
    [0, 2],
    [2, 5],
    [1, 3],
    [0, 1],
    [0, 5],
    [4, 5],
    [3, 4],
    [7, 11],
    [8, 11],
    [9, 11],
    [6, 11],
    [10, 11],
    [1, 6],
    [1, 7],
    [6, 7],
    [0, 7],
    [0, 8],
    [7, 8],
    [5, 8],
    [5, 9],
    [8, 9],
    [4, 9],
    [4, 10],
    [9, 10],
    [3, 10],
    [3, 6],
    [6, 10],
  ],
  cube: [
    [4, 5],
    [0, 1],
    [6, 7],
    [2, 3],
    [5, 7],
    [0, 5],
    [2, 7],
    [0, 2],
    [1, 3],
    [1, 4],
    [3, 6],
    [4, 6],
  ],
};

const SHAPE_FACES: Record<ShapeType, number> = { tet: 4, oct: 8, ico: 20, cube: 6 };

const MERGE_EPS = 0.11;

function worldPos(shape: ShapePose, vi: number): [number, number, number] {
  const verts = PLATONIC_VERTS[shape.type];
  if (!verts || vi < 0 || vi >= verts.length) return [shape.x, shape.y, shape.z];
  const [lx, ly, lz] = verts[vi]!;
  const ry = shape.rotY ?? 0;
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  const wx = lx * c - lz * s + shape.x;
  const wy = ly + shape.y;
  const wz = lx * s + lz * c + shape.z;
  return [wx, wy, wz];
}

export interface RigidityComputed {
  /** Merged pin joints */
  j: number;
  /** Unique bars (solid edges + struts, after joint merge) */
  e: number;
  /** Maxwell count m = 3j − e − 6 (positive = under-constrained, zero = isostatic, negative = over-constrained) */
  m: number;
  /** Sum of face counts (cosmetic, for HUD Euler trivia) */
  F: number;
  rigid: boolean;
}

/**
 * Maxwell-style count for 3D pin-jointed framework after merging coincident joints.
 * `rigid` when m <= 0 (enough bars for a generic count — includes over-constrained).
 */
export function computeMergedRigidity(
  shapes: Record<string, ShapePose>,
  struts: StrutMap,
): RigidityComputed {
  type JointRef = { shapeId: string; vi: number; x: number; y: number; z: number };
  const refs: JointRef[] = [];
  for (const [shapeId, pose] of Object.entries(shapes)) {
    const verts = PLATONIC_VERTS[pose.type];
    if (!verts) continue;
    for (let vi = 0; vi < verts.length; vi++) {
      const [x, y, z] = worldPos(pose, vi);
      refs.push({ shapeId, vi, x, y, z });
    }
  }

  const jointOfKey = new Map<string, number>();
  const jointCenters: [number, number, number][] = [];
  let nextJ = 0;

  for (const r of refs) {
    let assigned = -1;
    for (let j = 0; j < jointCenters.length; j++) {
      const [cx, cy, cz] = jointCenters[j]!;
      const d = Math.hypot(r.x - cx, r.y - cy, r.z - cz);
      if (d <= MERGE_EPS) {
        assigned = j;
        const inv = 1 / 2;
        jointCenters[j] = [(cx + r.x) * inv, (cy + r.y) * inv, (cz + r.z) * inv];
        break;
      }
    }
    if (assigned < 0) {
      assigned = nextJ++;
      jointCenters.push([r.x, r.y, r.z]);
    }
    const k = `${r.shapeId}:${r.vi}`;
    jointOfKey.set(k, assigned);
  }

  const j = jointCenters.length;
  const edgeSet = new Set<string>();

  const addEdge = (ja: number, jb: number) => {
    if (ja === jb) return;
    const a = Math.min(ja, jb);
    const b = Math.max(ja, jb);
    edgeSet.add(`${a},${b}`);
  };

  for (const [shapeId, pose] of Object.entries(shapes)) {
    const edges = PLATONIC_EDGES[pose.type];
    if (!edges) continue;
    for (const [va, vb] of edges) {
      const ja = jointOfKey.get(`${shapeId}:${va}`);
      const jb = jointOfKey.get(`${shapeId}:${vb}`);
      if (ja === undefined || jb === undefined) continue;
      addEdge(ja, jb);
    }
  }

  for (const st of Object.values(struts)) {
    const sa = shapes[st.aShape];
    const sb = shapes[st.bShape];
    if (!sa || !sb) continue;
    const nA = PLATONIC_VERTS[sa.type]?.length ?? 0;
    const nB = PLATONIC_VERTS[sb.type]?.length ?? 0;
    if (st.aVi < 0 || st.aVi >= nA || st.bVi < 0 || st.bVi >= nB) continue;
    const ja = jointOfKey.get(`${st.aShape}:${st.aVi}`);
    const jb = jointOfKey.get(`${st.bShape}:${st.bVi}`);
    if (ja === undefined || jb === undefined) continue;
    addEdge(ja, jb);
  }

  let F = 0;
  for (const pose of Object.values(shapes)) {
    F += SHAPE_FACES[pose.type] ?? 0;
  }

  const e = edgeSet.size;
  const m = 3 * j - e - 6;
  const rigid = m <= 0;

  return { j, e, m, F, rigid };
}
