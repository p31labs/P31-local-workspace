import { describe, it, expect } from "vitest";
import {
  vec3,
  addVec3,
  scaleVec3,
  distanceVec3,
  PRIMITIVES,
  maxwellAnalysis,
  analyzeStructure,
  canSnap,
  findSnaps,
} from "../src/geometry.js";
import type { PlacedPiece } from "../src/types.js";

describe("vec3", () => {
  it("creates vector", () => {
    const v = vec3(1, 2, 3);
    expect(v.x).toBe(1);
    expect(v.y).toBe(2);
    expect(v.z).toBe(3);
  });
});

describe("addVec3", () => {
  it("adds vectors", () => {
    expect(addVec3(vec3(1, 0, 0), vec3(0, 1, 0))).toEqual(vec3(1, 1, 0));
  });
});

describe("scaleVec3", () => {
  it("scales vector", () => {
    expect(scaleVec3(vec3(1, 2, 3), 2)).toEqual(vec3(2, 4, 6));
  });
});

describe("distanceVec3", () => {
  it("returns distance", () => {
    expect(distanceVec3(vec3(0, 0, 0), vec3(3, 4, 0))).toBe(5);
  });
});

describe("PRIMITIVES", () => {
  it("tetrahedron has V=4 E=6 coherence 1", () => {
    const t = PRIMITIVES.tetrahedron;
    expect(t.vertices).toBe(4);
    expect(t.edges).toBe(6);
    expect(t.maxwellRatio).toBe(1);
    expect(t.isRigid).toBe(true);
  });

  it("octahedron has V=6 E=12 coherence 1", () => {
    const o = PRIMITIVES.octahedron;
    expect(o.vertices).toBe(6);
    expect(o.edges).toBe(12);
    expect(o.isRigid).toBe(true);
  });

  it("icosahedron has V=12 E=30", () => {
    const i = PRIMITIVES.icosahedron;
    expect(i.vertices).toBe(12);
    expect(i.edges).toBe(30);
    expect(i.isRigid).toBe(true);
  });

  it("strut and hub are not rigid", () => {
    expect(PRIMITIVES.strut.isRigid).toBe(false);
    expect(PRIMITIVES.hub.isRigid).toBe(false);
  });
});

describe("maxwellAnalysis", () => {
  it("empty/degenerate returns not rigid", () => {
    expect(maxwellAnalysis(0, 0).isRigid).toBe(false);
    expect(maxwellAnalysis(1, 0).isRigid).toBe(false);
  });

  it("tetrahedron V=4 E=6 is rigid", () => {
    const r = maxwellAnalysis(4, 6);
    expect(r.maxwellThreshold).toBe(6);
    expect(r.coherence).toBe(1);
    expect(r.isRigid).toBe(true);
    expect(r.isOverConstrained).toBe(false);
  });

  it("two disconnected tetrahedra V=8 E=12 is not rigid", () => {
    const r = maxwellAnalysis(8, 12);
    expect(r.maxwellThreshold).toBe(18);
    expect(r.coherence).toBeCloseTo(12 / 18);
    expect(r.isRigid).toBe(false);
  });

  it("over-constrained structure", () => {
    const r = maxwellAnalysis(4, 8);
    expect(r.isRigid).toBe(true);
    expect(r.isOverConstrained).toBe(true);
  });
});

describe("analyzeStructure", () => {
  it("empty pieces returns zero analysis", () => {
    const r = analyzeStructure([]);
    expect(r.vertices).toBe(0);
    expect(r.edges).toBe(0);
    expect(r.isRigid).toBe(false);
  });

  it("single tetrahedron is rigid", () => {
    const piece: PlacedPiece = {
      id: "p1",
      type: "tetrahedron",
      position: vec3(0, 0, 0),
      rotation: vec3(0, 0, 0),
      scale: 1,
      connectedTo: [],
      color: "#fff",
      placedAt: new Date().toISOString(),
    };
    const r = analyzeStructure([piece]);
    expect(r.vertices).toBe(4);
    expect(r.edges).toBe(6);
    expect(r.isRigid).toBe(true);
  });

  it("two connected tetrahedra merge shared vertex", () => {
    const p1: PlacedPiece = {
      id: "p1",
      type: "tetrahedron",
      position: vec3(0, 0, 0),
      rotation: vec3(0, 0, 0),
      scale: 1,
      connectedTo: ["p2"],
      color: "#fff",
      placedAt: new Date().toISOString(),
    };
    const p2: PlacedPiece = {
      id: "p2",
      type: "tetrahedron",
      position: vec3(0, 0, 0),
      rotation: vec3(0, 0, 0),
      scale: 1,
      connectedTo: ["p1"],
      color: "#fff",
      placedAt: new Date().toISOString(),
    };
    const r = analyzeStructure([p1, p2]);
    expect(r.vertices).toBe(7); // 4+4-1 merged
    expect(r.edges).toBe(13);  // 6+6+1 connecting
    expect(r.maxwellThreshold).toBe(15); // 3*7-6
    expect(r.isRigid).toBe(false); // 13 < 15
  });
});

describe("canSnap", () => {
  it("same position snaps within tolerance", () => {
    const p: PlacedPiece = {
      id: "a",
      type: "tetrahedron",
      position: vec3(0, 0, 0),
      rotation: vec3(0, 0, 0),
      scale: 1,
      connectedTo: [],
      color: "#fff",
      placedAt: new Date().toISOString(),
    };
    expect(canSnap(p, vec3(0, 0, 0), p, vec3(0, 0, 0), 0.5)).toBe(true);
  });

  it("far apart does not snap", () => {
    const a: PlacedPiece = {
      id: "a",
      type: "tetrahedron",
      position: vec3(0, 0, 0),
      rotation: vec3(0, 0, 0),
      scale: 1,
      connectedTo: [],
      color: "#fff",
      placedAt: new Date().toISOString(),
    };
    const b: PlacedPiece = {
      id: "b",
      type: "tetrahedron",
      position: vec3(10, 10, 10),
      rotation: vec3(0, 0, 0),
      scale: 1,
      connectedTo: [],
      color: "#fff",
      placedAt: new Date().toISOString(),
    };
    expect(canSnap(a, vec3(0, 0, 0), b, vec3(0, 0, 0), 0.1)).toBe(false);
  });
});

describe("findSnaps", () => {
  it("returns empty for single piece", () => {
    const p: PlacedPiece = {
      id: "p1",
      type: "tetrahedron",
      position: vec3(0, 0, 0),
      rotation: vec3(0, 0, 0),
      scale: 1,
      connectedTo: [],
      color: "#fff",
      placedAt: new Date().toISOString(),
    };
    expect(findSnaps(p, [])).toEqual([]);
  });

  it("skips same piece id", () => {
    const p: PlacedPiece = {
      id: "p1",
      type: "tetrahedron",
      position: vec3(0, 0, 0),
      rotation: vec3(0, 0, 0),
      scale: 1,
      connectedTo: [],
      color: "#fff",
      placedAt: new Date().toISOString(),
    };
    expect(findSnaps(p, [p])).toEqual([]);
  });
});
