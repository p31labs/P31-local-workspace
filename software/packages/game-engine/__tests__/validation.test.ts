import { describe, it, expect } from "vitest";
import { validateStructure } from "../src/validation.js";
import type { StructuralNode, BeamElement } from "../src/types.js";

function n(id: string, x: number, y: number, z: number): StructuralNode {
  return { id, position: { x, y, z } };
}

function b(id: string, start: string, end: string, cs = 0.01): BeamElement {
  return { id, startNodeId: start, endNodeId: end, crossSection: cs, material: "steel" };
}

describe("validateStructure", () => {
  it("accumulates errors instead of short-circuiting", () => {
    const nodes = [
      n("a", 0, 0, 0),
      n("b", 1, 0, 0),
      n("c", 20, 20, 20),
    ];
    const beams = [
      b("b1", "a", "a"),
      b("b2", "a", "b"),
      b("b3", "a", "b"),
    ];
    const errors = validateStructure(nodes, beams, { gridBounds: [5, 5, 5] });
    // Should have multiple errors: node out of bounds, beam self-reference, beam duplicate
    const codes = errors.map(e => e.code);
    expect(codes).toContain("NODE_OUT_OF_BOUNDS");
    expect(codes).toContain("BEAM_SELF_REFERENCE");
    expect(codes).toContain("BEAM_DUPLICATE");
  });

  it("returns INSUFFICIENT_NODES for empty input", () => {
    const errors = validateStructure([], []);
    expect(errors.some(e => e.code === "INSUFFICIENT_NODES")).toBe(true);
  });

  it("detects node out of bounds", () => {
    const nodes = [n("a", 0, 0, 0), n("b", 20, 0, 0)];
    const beams = [b("b1", "a", "b")];
    const errors = validateStructure(nodes, beams, { gridBounds: [10, 10, 10] });
    expect(errors.some(e => e.code === "NODE_OUT_OF_BOUNDS")).toBe(true);
  });

  it("detects beam self-reference", () => {
    const nodes = [n("a", 0, 0, 0)];
    const beams = [b("b1", "a", "a")];
    const errors = validateStructure(nodes, beams);
    expect(errors.some(e => e.code === "BEAM_SELF_REFERENCE")).toBe(true);
  });

  it("detects beam duplicate", () => {
    const nodes = [n("a", 0, 0, 0), n("b", 1, 0, 0)];
    const beams = [b("b1", "a", "b"), b("b2", "a", "b")];
    const errors = validateStructure(nodes, beams);
    expect(errors.some(e => e.code === "BEAM_DUPLICATE")).toBe(true);
  });

  it("detects NOT_RIGID for floppy structure", () => {
    const nodes = [n("a", 0, 0, 0), n("b", 1, 0, 0)];
    const beams = [b("b1", "a", "b")];
    const errors = validateStructure(nodes, beams);
    // A single beam between 2 nodes has 0 DOF which is actually rigid by Maxwell
    // Let's use 4 nodes in a square with 4 beams - that's not rigid
    const sqNodes = [
      n("a", 0, 0, 0), n("b", 1, 0, 0),
      n("c", 1, 1, 0), n("d", 0, 1, 0),
    ];
    const sqBeams = [
      b("ab", "a", "b"), b("bc", "b", "c"),
      b("cd", "c", "d"), b("da", "d", "a"),
    ];
    const sqErrors = validateStructure(sqNodes, sqBeams);
    expect(sqErrors.some(e => e.code === "NOT_RIGID")).toBe(true);
  });

  it("passes a valid rigid tetrahedron", () => {
    const nodes = [
      n("a", 0, 0, 0),
      n("b", 1, 0, 0),
      n("c", 0.5, 0.866, 0),
      n("d", 0.5, 0.289, 0.816),
    ];
    const beams = [
      b("ab", "a", "b"), b("ac", "a", "c"), b("ad", "a", "d"),
      b("bc", "b", "c"), b("bd", "b", "d"), b("cd", "c", "d"),
    ];
    const errors = validateStructure(nodes, beams);
    const critical = errors.filter(e =>
      e.code === "NOT_RIGID" || e.code === "INSUFFICIENT_NODES" ||
      e.code === "INSUFFICIENT_BEAMS" || e.code === "DISCONTINUITY"
    );
    expect(critical).toHaveLength(0);
  });

  it("detects discontinuity", () => {
    const nodes = [
      n("a", 0, 0, 0), n("b", 1, 0, 0),
      n("c", 5, 5, 5),
    ];
    const beams = [b("ab", "a", "b")];
    const errors = validateStructure(nodes, beams);
    expect(errors.some(e => e.code === "DISCONTINUITY")).toBe(true);
    const discErrors = errors.filter(e => e.code === "DISCONTINUITY");
    expect(discErrors.some(e => e.nodeIds?.includes("c"))).toBe(true);
  });

  it("detects overlapping beams", () => {
    const nodes = [
      n("a", 0, 0, 0), n("b", 1, 0, 0),
      n("c", 0.5, 0.5, 0), n("d", 0.5, -0.5, 0),
    ];
    const beams = [
      b("ab", "a", "b"), b("cd", "c", "d"),
    ];
    const errors = validateStructure(nodes, beams);
    // These beams cross in 3D space
    expect(errors.some(e => e.code === "NOT_RIGID")).toBe(true);
  });
});
