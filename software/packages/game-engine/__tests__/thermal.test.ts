import { describe, it, expect } from "vitest";
import { thermalExpand } from "../src/thermal.js";
import type { StructuralNode, BeamElement } from "../src/types.js";

function n(id: string, x: number, y: number, z: number): StructuralNode {
  return { id, position: { x, y, z } };
}

function b(id: string, start: string, end: string, cs = 0.01): BeamElement {
  return { id, startNodeId: start, endNodeId: end, crossSection: cs, material: "steel" };
}

describe("thermalExpand", () => {
  it("displaces nodes outward for positive delta temp", () => {
    const nodes = [n("a", 0, 0, 0), n("b", 1, 0, 0)];
    const beams = [b("b1", "a", "b")];
    const result = thermalExpand(nodes, beams, 100);
    // Steel alpha = 1.2e-5, deltaL = 1.2e-5 * 100 * 1 = 0.0012
    // Each node moves half: 0.0006
    const dx = result.displacedNodes[1].position.x - nodes[1].position.x;
    expect(dx).toBeCloseTo(0.0006, 6);
  });

  it("contracts for negative delta temp", () => {
    const nodes = [n("a", 0, 0, 0), n("b", 1, 0, 0)];
    const beams = [b("b1", "a", "b")];
    const result = thermalExpand(nodes, beams, -100);
    const dx = result.displacedNodes[1].position.x - nodes[1].position.x;
    expect(dx).toBeCloseTo(-0.0006, 6);
  });

  it("returns max displacement", () => {
    const nodes = [n("a", 0, 0, 0), n("b", 2, 0, 0)];
    const beams = [b("b1", "a", "b")];
    const result = thermalExpand(nodes, beams, 50);
    expect(result.maxDisplacement).toBeGreaterThan(0);
  });

  it("handles empty input", () => {
    const result = thermalExpand([], [], 100);
    expect(result.displacedNodes).toHaveLength(0);
    expect(result.maxDisplacement).toBe(0);
  });
});
