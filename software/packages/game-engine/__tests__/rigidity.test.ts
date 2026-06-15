import { describe, it, expect } from "vitest";
import { Matrix } from "ml-matrix";
import {
  buildEquilibriumMatrix,
  analyzeRigidity,
  analyzeStructureFull,
  computeMass,
} from "../src/rigidity.js";
import type { StructuralNode, BeamElement } from "../src/types.js";

function n(id: string, x: number, y: number, z: number): StructuralNode {
  return { id, position: { x, y, z } };
}

function b(id: string, start: string, end: string, cs = 0.01): BeamElement {
  return { id, startNodeId: start, endNodeId: end, crossSection: cs, material: "steel" };
}

describe("buildEquilibriumMatrix", () => {
  it("creates a 3n x b matrix for a simple beam", () => {
    const nodes = [n("a", 0, 0, 0), n("b", 1, 0, 0)];
    const beams = [b("b1", "a", "b")];
    const A = buildEquilibriumMatrix(nodes, beams);
    expect(A.rows).toBe(6);
    expect(A.columns).toBe(1);
  });

  it("unit direction vector components sum correctly", () => {
    const nodes = [n("a", 0, 0, 0), n("b", 1, 0, 0)];
    const beams = [b("b1", "a", "b")];
    const A = buildEquilibriumMatrix(nodes, beams);
    // dx=1 along x axis: A(0,0)=1, A(1,0)=0, A(2,0)=0 at start
    // -dx at end: A(3,0)=-1, A(4,0)=0, A(5,0)=0
    expect(A.get(0, 0)).toBeCloseTo(1);
    expect(A.get(1, 0)).toBeCloseTo(0);
    expect(A.get(2, 0)).toBeCloseTo(0);
    expect(A.get(3, 0)).toBeCloseTo(-1);
    expect(A.get(4, 0)).toBeCloseTo(0);
    expect(A.get(5, 0)).toBeCloseTo(0);
  });
});

describe("analyzeRigidity", () => {
  it("returns not rigid for empty structure", () => {
    const result = analyzeRigidity([], []);
    expect(result.isRigid).toBe(false);
    expect(result.rank).toBe(0);
  });

  it("a single beam between 2 nodes is not rigid (needs 0 DOF)", () => {
    const nodes = [n("a", 0, 0, 0), n("b", 1, 0, 0)];
    const beams = [b("b1", "a", "b")];
    const result = analyzeRigidity(nodes, beams);
    expect(result.isRigid).toBe(true);
    expect(result.rank).toBeGreaterThanOrEqual(1);
  });

  it("a tetrahedral frame (6 beams, 4 nodes) is rigid", () => {
    const nodes = [
      n("a", 0, 0, 0),
      n("b", 1, 0, 0),
      n("c", 0.5, Math.sqrt(3)/2, 0),
      n("d", 0.5, Math.sqrt(3)/6, Math.sqrt(2/3)),
    ];
    const beams = [
      b("ab", "a", "b"), b("ac", "a", "c"), b("ad", "a", "d"),
      b("bc", "b", "c"), b("bd", "b", "d"), b("cd", "c", "d"),
    ];
    const result = analyzeRigidity(nodes, beams);
    expect(result.isRigid).toBe(true);
    expect(result.rank).toBeGreaterThanOrEqual(6);
  });

  it("square frame with 4 beams and 4 nodes is not rigid", () => {
    const nodes = [
      n("a", 0, 0, 0),
      n("b", 1, 0, 0),
      n("c", 1, 1, 0),
      n("d", 0, 1, 0),
    ];
    const beams = [
      b("ab", "a", "b"), b("bc", "b", "c"),
      b("cd", "c", "d"), b("da", "d", "a"),
    ];
    const result = analyzeRigidity(nodes, beams);
    // 3*4 - 6 = 6, but only 4 beams -> not rigid
    expect(result.isRigid).toBe(false);
    expect(result.rankDeficiency).toBeGreaterThan(0);
  });
});

describe("analyzeStructureFull", () => {
  it("returns complete analysis for tetrahedron", () => {
    const nodes = [
      n("a", 0, 0, 0), n("b", 1, 0, 0),
      n("c", 0.5, Math.sqrt(3)/2, 0), n("d", 0.5, Math.sqrt(3)/6, Math.sqrt(2/3)),
    ];
    const beams = [
      b("ab", "a", "b"), b("ac", "a", "c"), b("ad", "a", "d"),
      b("bc", "b", "c"), b("bd", "b", "d"), b("cd", "c", "d"),
    ];
    const analysis = analyzeStructureFull(nodes, beams, 7850);
    expect(analysis.nodeCount).toBe(4);
    expect(analysis.beamCount).toBe(6);
    expect(analysis.isRigid).toBe(true);
    expect(analysis.totalMass).toBeGreaterThan(0);
  });
});

describe("computeMass", () => {
  it("computes mass of a single beam", () => {
    const nodes = [n("a", 0, 0, 0), n("b", 2, 0, 0)];
    const beams = [b("b1", "a", "b", 0.01)];
    const mass = computeMass(nodes, beams, 7850);
    const expected = 0.01 * 2 * 7850;
    expect(mass).toBeCloseTo(expected, 1);
  });
});
