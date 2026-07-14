import { describe, it, expect, beforeEach } from "vitest";
import { MemoryFractalDB } from "../src/store";
import { createNode } from "../src/fractal";
import { getDNA, saveDNA, initGenome, evolve } from "../src/behaviouralDna";

describe("CWP-040B: behavioural DNA", () => {
  let store = new MemoryFractalDB();
  let nodeId = "";
  beforeEach(async () => {
    store = new MemoryFractalDB();
    await store.init();
    const node = await createNode(store, { scale: "self", label: "Me" });
    nodeId = node.id;
  });

  it("initialises a 13-trait genome at 0.5", async () => {
    const dna = await getDNA(store, nodeId);
    const values = Object.values(dna.genome);
    expect(values).toHaveLength(13);
    expect(values.every((v) => v === 0.5)).toBe(true);
  });

  it("persists an evolved genome", async () => {
    const dna = await getDNA(store, nodeId);
    dna.genome.resilience = 0.8;
    await saveDNA(store, dna);
    const reloaded = await getDNA(store, nodeId);
    expect(reloaded.genome.resilience).toBe(0.8);
  });

  it("evolves upward on success and clamps to [0,1]", async () => {
    const g = initGenome();
    const next = evolve(g, { outcome: "won", confidence: 0.95 });
    expect(next.conscientiousness).toBeGreaterThan(0.5);
    expect(next.resilience).toBeGreaterThan(0.5);
    const clamped = evolve({ ...next, resilience: 0.999 }, { outcome: "won", confidence: 0.95 });
    expect(clamped.resilience).toBeLessThanOrEqual(1);
  });

  it("shifts traits differently on failure", async () => {
    const g = initGenome();
    const fail = evolve(g, { outcome: "lost", confidence: 0.1 });
    expect(fail.adaptability).toBeGreaterThan(0.5);
    expect(fail.neuroticism).toBeGreaterThan(0.5);
  });
});
