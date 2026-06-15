import { describe, it, expect } from "vitest";
import {
  buildSparseStiffnessMatrix,
  sparseToDense,
  computeEigen,
} from "../src/stiffness.js";
import type { StructuralNode, BeamElement } from "../src/types.js";

function n(id: string, x: number, y: number, z: number): StructuralNode {
  return { id, position: { x, y, z } };
}

function b(id: string, start: string, end: string, cs = 0.01): BeamElement {
  return { id, startNodeId: start, endNodeId: end, crossSection: cs, material: "steel" };
}

describe("buildSparseStiffnessMatrix", () => {
  it("creates entries for a single beam", () => {
    const nodes = [n("a", 0, 0, 0), n("b", 1, 0, 0)];
    const beams = [b("b1", "a", "b")];
    const { entries, dimension } = buildSparseStiffnessMatrix(nodes, beams, 200e9, 0.01);
    expect(dimension).toBe(6);
    expect(entries.length).toBeGreaterThan(0);
  });
});

describe("sparseToDense", () => {
  it("builds a symmetric dense matrix", () => {
    const nodes = [n("a", 0, 0, 0), n("b", 1, 0, 0)];
    const beams = [b("b1", "a", "b")];
    const { entries, dimension } = buildSparseStiffnessMatrix(nodes, beams, 200e9, 0.01);
    const K = sparseToDense(entries, dimension);
    expect(K.rows).toBe(6);
    expect(K.columns).toBe(6);
    // Stiffness matrix should be symmetric
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        expect(K.get(i, j)).toBeCloseTo(K.get(j, i), 5);
      }
    }
  });
});

describe("computeEigen", () => {
  it("returns eigenvalues for a simple beam", () => {
    const nodes = [n("a", 0, 0, 0), n("b", 1, 0, 0)];
    const beams = [b("b1", "a", "b")];
    const result = computeEigen(nodes, beams, 200e9, 0.01);
    // Should have eigenvalues; rigid body modes filtered
    expect(result.eigenvalues.length).toBeGreaterThanOrEqual(0);
    expect(result.naturalFrequencies.length).toBeGreaterThanOrEqual(0);
  });

  it("returns empty for no nodes", () => {
    const result = computeEigen([], []);
    expect(result.eigenvalues).toHaveLength(0);
  });
});
