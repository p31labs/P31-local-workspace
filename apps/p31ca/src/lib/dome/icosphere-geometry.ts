/**
 * Spherical "geodesic" shell from icosahedron + edge midpoint subdivision
 * (same construction as the Sovereign Cockpit /dome mesh). For structural
 * geodesic domes, chord sets differ by class/frequency; this is a common
 * graphics approximation, not a steel schedule.
 */

export type Vec3 = [number, number, number];
export type Face3 = [number, number, number];
export type Edge2 = [number, number];

const PHI = (1 + Math.sqrt(5)) / 2;

const RAW_ICOSA_VERTS: Vec3[] = [
  [-1, PHI, 0],
  [1, PHI, 0],
  [-1, -PHI, 0],
  [1, -PHI, 0],
  [0, -1, PHI],
  [0, 1, PHI],
  [0, -1, -PHI],
  [0, 1, -PHI],
  [PHI, 0, -1],
  [PHI, 0, 1],
  [-PHI, 0, -1],
  [-PHI, 0, 1],
];

const ICOSA_FACES: Face3[] = [
  [0, 11, 5],
  [0, 5, 1],
  [0, 1, 7],
  [0, 7, 10],
  [0, 10, 11],
  [1, 5, 9],
  [5, 11, 4],
  [11, 10, 2],
  [10, 7, 6],
  [7, 1, 8],
  [3, 9, 4],
  [3, 4, 2],
  [3, 2, 6],
  [3, 6, 8],
  [3, 8, 9],
  [4, 9, 5],
  [2, 4, 11],
  [6, 2, 10],
  [8, 6, 7],
  [9, 8, 1],
];

export function buildIcosaSphereDome(
  rad: number,
  subs: number
): { vertices: Vec3[]; faces: Face3[]; edges: Edge2[] } {
  let vertices: Vec3[] = RAW_ICOSA_VERTS.map(([x, y, z]) => {
    const l = Math.hypot(x, y, z);
    return [(x / l) * rad, (y / l) * rad, (z / l) * rad];
  });

  let faces: Face3[] = ICOSA_FACES.map((f) => [...f] as Face3);

  for (let s = 0; s < subs; s++) {
    const cache: Record<string, number> = {};
    const getMid = (i: number, j: number): number => {
      const k = `${Math.min(i, j)}_${Math.max(i, j)}`;
      if (cache[k] !== undefined) return cache[k]!;
      const a = vertices[i]!;
      const b = vertices[j]!;
      const nx = a[0]! + b[0]!;
      const ny = a[1]! + b[1]!;
      const nz = a[2]! + b[2]!;
      const len = Math.hypot(nx, ny, nz) || 1;
      const idx = vertices.length;
      vertices.push([(nx / len) * rad, (ny / len) * rad, (nz / len) * rad]);
      cache[k] = idx;
      return idx;
    };

    const nf: Face3[] = [];
    for (const [a, b, c] of faces) {
      const ab = getMid(a, b);
      const bc = getMid(b, c);
      const ca = getMid(c, a);
      nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = nf;
  }

  const es = new Set<string>();
  for (const [a, b, c] of faces) {
    es.add(`${Math.min(a, b)}_${Math.max(a, b)}`);
    es.add(`${Math.min(b, c)}_${Math.max(b, c)}`);
    es.add(`${Math.min(a, c)}_${Math.max(a, c)}`);
  }
  const edges: Edge2[] = Array.from(es).map((e) => {
    const [x, y] = e.split("_").map(Number);
    return [x!, y!] as Edge2;
  });

  return { vertices, faces, edges };
}

export function edgeLengthStats(vertices: Vec3[], edges: Edge2[]) {
  const lens = edges.map(([a, b]) => {
    const p = vertices[a]!;
    const q = vertices[b]!;
    return Math.hypot(p[0]! - q[0]!, p[1]! - q[1]!, p[2]! - q[2]!);
  });
  const mean = lens.reduce((s, L) => s + L, 0) / lens.length;
  const min = Math.min(...lens);
  const max = Math.max(...lens);
  const var_ = lens.reduce((s, L) => s + (L - mean) ** 2, 0) / lens.length;
  return {
    min,
    max,
    mean,
    std: Math.sqrt(var_),
    count: edges.length,
    relStd: mean > 0 ? Math.sqrt(var_) / mean : 0,
  };
}

export function uniqueChordBuckets(vertices: Vec3[], edges: Edge2[], eps = 1e-4) {
  const lens = edges.map(([a, b]) => {
    const p = vertices[a]!;
    const q = vertices[b]!;
    return Math.hypot(p[0]! - q[0]!, p[1]! - q[1]!, p[2]! - q[2]!);
  });
  const sorted = [...new Set(lens.map((L) => Math.round(L / eps) * eps))].sort(
    (a, b) => a - b
  );
  return sorted;
}
