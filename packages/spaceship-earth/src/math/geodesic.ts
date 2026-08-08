export interface Geodesic {
  vertices: [number, number, number][];
  edges: [number, number][];
  faces: [number, number, number][];
}

const BASE: [number, number, number][] = [
  [-1, 1.618034, 0], [1, 1.618034, 0], [-1, -1.618034, 0], [1, -1.618034, 0],
  [0, -1, 1.618034], [0, 1, 1.618034], [0, -1, -1.618034], [0, 1, -1.618034],
  [1.618034, 0, -1], [1.618034, 0, 1], [-1.618034, 0, -1], [-1.618034, 0, 1],
];

const BASE_FACES: [number, number, number][] = [
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
];

const KEY_PRECISION = 8;
const key = (p: [number, number, number]) =>
  p.map((n) => n.toFixed(KEY_PRECISION)).join(',');

function normalize(p: [number, number, number], radius: number): [number, number, number] {
  const len = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]);
  const s = len > 0 ? radius / len : 1;
  return [p[0] * s, p[1] * s, p[2] * s];
}

function midpoint(a: [number, number, number], b: [number, number, number], radius: number): [number, number, number] {
  return normalize([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], radius);
}

export function icosahedronGeodesic(radius: number, detail: number): Geodesic {
  const verts: [number, number, number][] = BASE.map((p) => normalize(p, radius));
  const index = new Map<string, number>();
  verts.forEach((v, i) => index.set(key(v), i));

  const point = (p: [number, number, number]): number => {
    const k = key(p);
    const hit = index.get(k);
    if (hit !== undefined) return hit;
    const id = verts.length;
    verts.push(p);
    index.set(k, id);
    return id;
  };

  let faces: [number, number, number][] = BASE_FACES.slice();

  for (let d = 0; d < detail; d++) {
    const next: [number, number, number][] = [];
    for (const [a, b, c] of faces) {
      const ab = point(midpoint(verts[a], verts[b], radius));
      const bc = point(midpoint(verts[b], verts[c], radius));
      const ca = point(midpoint(verts[c], verts[a], radius));
      next.push([a, ab, ca]);
      next.push([b, bc, ab]);
      next.push([c, ca, bc]);
      next.push([ab, bc, ca]);
    }
    faces = next;
  }

  const edgeSet = new Set<string>();
  const edges: [number, number][] = [];
  for (const [a, b, c] of faces) {
    for (const [x, y] of [[a, b], [b, c], [c, a]] as [number, number][]) {
      const k = x < y ? `${x},${y}` : `${y},${x}`;
      if (!edgeSet.has(k)) {
        edgeSet.add(k);
        edges.push(x < y ? [x, y] : [y, x]);
      }
    }
  }

  return { vertices: verts, edges, faces };
}

export function icosahedronVertices(radius: number, detail: number): [number, number, number][] {
  return icosahedronGeodesic(radius, detail).vertices;
}

export function icosahedronEdges(radius: number, detail: number): [number, number][] {
  return icosahedronGeodesic(radius, detail).edges;
}

export function icosahedronFaces(radius: number, detail: number): [number, number, number][] {
  return icosahedronGeodesic(radius, detail).faces;
}

export function nearestPairs(
  points: [number, number, number][],
  maxDist: number,
): [number, number][] {
  const pairs: [number, number][] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const d = Math.hypot(
        points[i][0] - points[j][0],
        points[i][1] - points[j][1],
        points[i][2] - points[j][2],
      );
      if (d < maxDist) pairs.push([i, j]);
    }
  }
  return pairs;
}

export function skewStruts(count: number, step = Math.floor(count * 0.6)): [number, number][] {
  const out: [number, number][] = [];
  const seen = new Set<string>();
  for (let i = 0; i < count; i++) {
    const j = (i + step) % count;
    const k = i < j ? `${i},${j}` : `${j},${i}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push([i, j]);
    }
  }
  return out;
}
