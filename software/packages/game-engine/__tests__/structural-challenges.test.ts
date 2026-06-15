import { describe, it, expect } from "vitest";
import {
  STRUCTURAL_CHALLENGES,
  evaluateStructuralChallenge,
  getStructuralChallenge,
} from "../src/structural-challenges.js";
import type { StructuralNode, BeamElement } from "../src/types.js";

function n(id: string, x: number, y: number, z: number): StructuralNode {
  return { id, position: { x, y, z } };
}

function b(id: string, start: string, end: string, cs = 0.01): BeamElement {
  return { id, startNodeId: start, endNodeId: end, crossSection: cs, material: "steel" };
}

describe("STRUCTURAL_CHALLENGES", () => {
  it("has 7 structural challenges", () => {
    expect(STRUCTURAL_CHALLENGES).toHaveLength(7);
  });

  it("each has an id, name, and difficulty", () => {
    for (const c of STRUCTURAL_CHALLENGES) {
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.difficulty).toBeGreaterThanOrEqual(1);
      expect(c.difficulty).toBeLessThanOrEqual(5);
    }
  });
});

describe("Helix challenge", () => {
  it("fails with insufficient nodes", () => {
    const nodes = [n("a", 0, 0, 0), n("b", 0.3, 0, 0)];
    const beams: BeamElement[] = [];
    const result = evaluateStructuralChallenge("helix", nodes, beams);
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.includes("≥8 nodes"))).toBe(true);
  });
});

describe("Geodesic Dome challenge", () => {
  it("fails with insufficient nodes", () => {
    const nodes = [n("a", 0, 0, 0), n("b", 1, 0, 0)];
    const beams = [b("ab", "a", "b")];
    const result = evaluateStructuralChallenge("structural_geodesic", nodes, beams);
    expect(result.passed).toBe(false);
  });
});

describe("Tensegrity challenge", () => {
  it("detects beams sharing nodes", () => {
    const nodes = [
      n("a", 0, 0, 0), n("b", 1, 0, 0),
      n("c", 0, 1, 0), n("d", 1, 1, 0),
      n("e", 0, 0, 1), n("f", 1, 0, 1),
    ];
    const beams = [
      b("ab", "a", "b"), b("ac", "a", "c"), b("ae", "a", "e"),
    ];
    const result = evaluateStructuralChallenge("tensegrity", nodes, beams);
    // Beams ab and ac share node "a"
    expect(result.errors.some(e => e.includes("share"))).toBe(true);
  });
});

describe("Truss Bridge challenge", () => {
  it("fails with short span", () => {
    const nodes = [n("a", 0, 0, 0), n("b", 1, 0, 0)];
    const beams = [b("ab", "a", "b")];
    const result = evaluateStructuralChallenge("truss_bridge", nodes, beams);
    expect(result.passed).toBe(false);
  });
});

describe("Tall Tower challenge", () => {
  it("fails with insufficient height", () => {
    const nodes = Array.from({ length: 15 }, (_, i) => n(`${i}`, i % 5, Math.floor(i / 5), 0));
    const beams: BeamElement[] = [];
    const result = evaluateStructuralChallenge("tall_tower", nodes, beams);
    expect(result.passed).toBe(false);
  });
});

describe("all challenges accessible by ID", () => {
  for (const c of STRUCTURAL_CHALLENGES) {
    it(`${c.id} is retrievable`, () => {
      expect(getStructuralChallenge(c.id)).toBeDefined();
    });
  }
});

describe("unknown challenge", () => {
  it("returns error for unknown ID", () => {
    const result = evaluateStructuralChallenge("nonexistent", [], []);
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toContain("Unknown");
  });
});
