import { describe, it, expect } from "vitest";
import { seededIndex } from "../lib/amusement-seed";
import { EDGE_VOICES, VERTEX_LABELS } from "../lib/tetra-seal-data";

describe("K₄ tetra seal", () => {
  it("has four vertex labels", () => {
    expect(VERTEX_LABELS).toHaveLength(4);
  });

  it("has six conceptual edges (hand-enumerated count)", () => {
    const pairs = new Set<string>();
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        pairs.add(`${i}-${j}`);
      }
    }
    expect(pairs.size).toBe(6);
  });

  it("edge voice pick is stable for same inputs", () => {
    const a = seededIndex(EDGE_VOICES.length, "tetra:0:foo:bar");
    const b = seededIndex(EDGE_VOICES.length, "tetra:0:foo:bar");
    expect(a).toBe(b);
  });
});
