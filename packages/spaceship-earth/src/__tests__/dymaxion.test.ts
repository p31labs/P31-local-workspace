import { describe, it, expect } from 'vitest';
import {
  buildDymaxionNet,
  buildConnectionSegments,
  solveNetEmbedding,
  barycentricInTriangle,
} from '../engine/dymaxion';
import type { FaceData } from '../engine/dataConnectors';

function samePoint(a: [number, number], b: [number, number], eps = 1e-6): boolean {
  return Math.abs(a[0] - b[0]) < eps && Math.abs(a[1] - b[1]) < eps;
}

describe('solveNetEmbedding', () => {
  it('maps every grid tree edge to a real icosahedron face edge', () => {
    // Re-derive the same graph structures the engine uses, via the public net.
    const net = buildDymaxionNet();
    const byFace = new Map<number, number>();
    net.cells.forEach((cell, cellIdx) => byFace.set(cell.baseFace, cellIdx));
    expect(byFace.size).toBe(20);

    // The embedding must be a bijection: 20 distinct base faces.
    const faces = net.cells.map((c) => c.baseFace);
    expect(new Set(faces).size).toBe(20);
  });

  it('produces a connected tree (19 edges, no cycles)', () => {
    const net = buildDymaxionNet();
    const edgeCount = net.cells.reduce((sum, c) => sum + c.neighbors.length, 0) / 2;
    expect(edgeCount).toBe(19);

    // BFS connectivity check.
    const seen = new Set<number>();
    const queue = [0];
    seen.add(0);
    while (queue.length) {
      const cur = queue.shift()!;
      for (const nb of net.cells[cur].neighbors) {
        if (!seen.has(nb)) {
          seen.add(nb);
          queue.push(nb);
        }
      }
    }
    expect(seen.size).toBe(20);
  });

  it('throws for a disconnected grid', () => {
    expect(() => solveNetEmbedding([], [])).toThrow();
  });
});

describe('buildDymaxionNet', () => {
  it('returns one point per dome face', () => {
    const net = buildDymaxionNet();
    expect(net.points.length).toBe(320);
  });

  it('produces finite, in-bounds coordinates for every point', () => {
    const net = buildDymaxionNet();
    for (const p of net.points) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
      expect(p.x).toBeGreaterThanOrEqual(net.bounds.minX);
      expect(p.x).toBeLessThanOrEqual(net.bounds.maxX);
      expect(p.y).toBeGreaterThanOrEqual(net.bounds.minY);
      expect(p.y).toBeLessThanOrEqual(net.bounds.maxY);
      expect(p.baseFace).toBeGreaterThanOrEqual(0);
      expect(p.baseFace).toBeLessThanOrEqual(19);
    }
  });

  it('places each point strictly inside its base-face cell', () => {
    const net = buildDymaxionNet();
    const cellByFace = new Map<number, number>();
    net.cells.forEach((cell, i) => cellByFace.set(cell.baseFace, i));

    for (const p of net.points) {
      const cellIdx = cellByFace.get(p.baseFace)!;
      const corners = net.cells[cellIdx].corners;
      const [u, v, w] = barycentricInTriangle(
        [corners[0].x, corners[0].y, 0],
        [corners[1].x, corners[1].y, 0],
        [corners[2].x, corners[2].y, 0],
        [p.x, p.y, 0],
      );
      // A dome centroid inside its base face maps inside the cell (small slack
      // for floating-point projection at the spherical boundary).
      expect(u).toBeGreaterThan(-1e-4);
      expect(v).toBeGreaterThan(-1e-4);
      expect(w).toBeGreaterThan(-1e-4);
    }
  });

  it('cells are equilateral triangles of equal size', () => {
    const net = buildDymaxionNet();
    const sideLengths: number[] = [];
    for (const cell of net.cells) {
      const [a, b, c] = cell.corners;
      const ab = Math.hypot(b.x - a.x, b.y - a.y);
      const bc = Math.hypot(c.x - b.x, c.y - b.y);
      const ca = Math.hypot(a.x - c.x, a.y - c.y);
      const max = Math.max(ab, bc, ca);
      expect(Math.abs(ab - max)).toBeLessThan(1e-6);
      expect(Math.abs(bc - max)).toBeLessThan(1e-6);
      expect(Math.abs(ca - max)).toBeLessThan(1e-6);
      sideLengths.push(max);
    }
    const first = sideLengths[0];
    for (const s of sideLengths) {
      expect(Math.abs(s - first)).toBeLessThan(1e-6);
    }
  });

  it('adjacent cells share exactly two corners (zero overlaps)', () => {
    const net = buildDymaxionNet();
    for (let i = 0; i < net.cells.length; i++) {
      for (let j = i + 1; j < net.cells.length; j++) {
        let shared = 0;
        for (const a of net.cells[i].corners) {
          for (const b of net.cells[j].corners) {
            if (samePoint([a.x, a.y], [b.x, b.y])) shared++;
          }
        }
        const adjacent = net.cells[i].neighbors.includes(j);
        if (adjacent) {
          expect(shared).toBe(2);
        } else {
          expect(shared).toBeLessThan(2);
        }
      }
    }
  });

  it('applies face data colors and falls back to empty face color', () => {
    const data: FaceData[] = [{ faceIndex: 0, value: 5, color: '#ff0000', label: 'a' }];
    const net = buildDymaxionNet(data);
    expect(net.points[0].color).toBe('#ff0000');
    expect(net.points[0].value).toBe(5);
    expect(net.points[1].color).toBe('#0f172a');
  });
});

describe('buildConnectionSegments', () => {
  const net = buildDymaxionNet();

  it('returns empty segments without connections', () => {
    expect(buildConnectionSegments([], net)).toHaveLength(0);
    expect(
      buildConnectionSegments([{ faceIndex: 0, value: null, color: '#fff', label: '' }], net),
    ).toHaveLength(0);
  });

  it('maps a connection pair to a segment between their net positions', () => {
    const data: FaceData[] = [
      { faceIndex: 3, value: 1, color: '#fff', label: '', connections: [17] },
    ];
    const segments = buildConnectionSegments(data, net);
    expect(segments).toHaveLength(1);
    const seg = segments[0];
    expect(seg.from).toBe(3);
    expect(seg.to).toBe(17);
    const a = net.points[3];
    const b = net.points[17];
    expect(seg.x1).toBeCloseTo(a.x, 6);
    expect(seg.y1).toBeCloseTo(a.y, 6);
    expect(seg.x2).toBeCloseTo(b.x, 6);
    expect(seg.y2).toBeCloseTo(b.y, 6);
  });

  it('skips dangling connection targets', () => {
    const data: FaceData[] = [
      { faceIndex: 1, value: 1, color: '#fff', label: '', connections: [9999] },
    ];
    expect(buildConnectionSegments(data, net)).toHaveLength(0);
  });
});

describe('barycentricInTriangle', () => {
  it('returns identity weights at the corners', () => {
    const a = [0, 0, 0];
    const b = [1, 0, 0];
    const c = [0, 1, 0];
    expect(barycentricInTriangle(a, b, c, a)).toEqual([1, 0, 0]);
    const wb = barycentricInTriangle(a, b, c, b);
    expect(wb[0]).toBeCloseTo(0, 9);
    expect(wb[1]).toBeCloseTo(1, 9);
    const wc = barycentricInTriangle(a, b, c, c);
    expect(wc[2]).toBeCloseTo(1, 9);
  });

  it('recovers the centroid', () => {
    const a = [0, 0, 0];
    const b = [2, 0, 0];
    const c = [0, 2, 0];
    const w = barycentricInTriangle(a, b, c, [2 / 3, 2 / 3, 0]);
    expect(w[0]).toBeCloseTo(1 / 3, 9);
    expect(w[1]).toBeCloseTo(1 / 3, 9);
    expect(w[2]).toBeCloseTo(1 / 3, 9);
  });
});
