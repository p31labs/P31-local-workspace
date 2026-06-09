/**
 * Merged-joint Maxwell rigidity — matches geodesic-room/src/platonic.ts (Three.js r160 solids).
 */

export const PLATONIC_VERTS = {
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

export const PLATONIC_EDGES = {
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

const MERGE_EPS = 0.11;
const SHAPE_FACES = { tet: 4, oct: 8, ico: 20, cube: 6 };

function worldPos(pose, vi) {
  const verts = PLATONIC_VERTS[pose.type];
  if (!verts || vi < 0 || vi >= verts.length) return [pose.x, pose.y, pose.z];
  const [lx, ly, lz] = verts[vi];
  const ry = pose.rotY ?? 0;
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  const wx = lx * c - lz * s + pose.x;
  const wy = ly + pose.y;
  const wz = lx * s + lz * c + pose.z;
  return [wx, wy, wz];
}

/**
 * @param {Record<string, { type: string, x: number, y: number, z: number, rotY?: number }>} shapes
 * @param {Array<{ aShape: string, aVi: number, bShape: string, bVi: number }>} struts
 */
export function computeMergedFrameRigidity(shapes, struts) {
  const ids = Object.keys(shapes);
  if (ids.length === 0) {
    return { j: 0, e: 0, m: 0, F: 0, rigid: false };
  }

  /** @type {{ shapeId: string, vi: number, x: number, y: number, z: number }[]} */
  const refs = [];
  for (const shapeId of ids) {
    const pose = shapes[shapeId];
    const verts = PLATONIC_VERTS[pose.type];
    if (!verts) continue;
    for (let vi = 0; vi < verts.length; vi++) {
      const [x, y, z] = worldPos(pose, vi);
      refs.push({ shapeId, vi, x, y, z });
    }
  }

  /** @type {[number, number, number][]} */
  const jointCenters = [];
  /** @type {Map<string, number>} */
  const jointOfKey = new Map();

  for (const r of refs) {
    let assigned = -1;
    for (let j = 0; j < jointCenters.length; j++) {
      const [cx, cy, cz] = jointCenters[j];
      const d = Math.hypot(r.x - cx, r.y - cy, r.z - cz);
      if (d <= MERGE_EPS) {
        assigned = j;
        jointCenters[j] = [(cx + r.x) * 0.5, (cy + r.y) * 0.5, (cz + r.z) * 0.5];
        break;
      }
    }
    if (assigned < 0) {
      assigned = jointCenters.length;
      jointCenters.push([r.x, r.y, r.z]);
    }
    jointOfKey.set(`${r.shapeId}:${r.vi}`, assigned);
  }

  const j = jointCenters.length;
  /** @type {Set<string>} */
  const edgeSet = new Set();

  function addEdge(ja, jb) {
    if (ja === jb) return;
    const a = Math.min(ja, jb);
    const b = Math.max(ja, jb);
    edgeSet.add(`${a},${b}`);
  }

  for (const shapeId of ids) {
    const pose = shapes[shapeId];
    const edges = PLATONIC_EDGES[pose.type];
    if (!edges) continue;
    for (const [va, vb] of edges) {
      const ja = jointOfKey.get(`${shapeId}:${va}`);
      const jb = jointOfKey.get(`${shapeId}:${vb}`);
      if (ja === undefined || jb === undefined) continue;
      addEdge(ja, jb);
    }
  }

  for (const st of struts) {
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

export function strutEndpointsKey(aShape, aVi, bShape, bVi) {
  const A = `${aShape}:${aVi}`;
  const B = `${bShape}:${bVi}`;
  return A < B ? `${A}|${B}` : `${B}|${A}`;
}
