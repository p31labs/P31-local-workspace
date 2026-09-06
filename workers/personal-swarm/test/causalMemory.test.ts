import { describe, it, expect, beforeEach } from "vitest";
import { MemoryFractalDB } from "../src/store";
import { createNode } from "../src/fractal";
import { recordCausalChain, listCausalChains, lessonsForNode } from "../src/causalMemory";

describe("CWP-040A: causal memory", () => {
  let store = new MemoryFractalDB();
  let nodeId = "";
  beforeEach(async () => {
    store = new MemoryFractalDB();
    await store.init();
    const node = await createNode(store, { scale: "self", label: "Me" });
    nodeId = node.id;
  });

  it("records a full causal chain", async () => {
    const chain = await recordCausalChain(store, {
      nodeId,
      trigger: "overwhelmed",
      goal: "finish grant",
      approach: "split into 25-min blocks",
      outcome: "completed ahead of time",
      lesson: "time-boxing works under spoons pressure",
      confidence: 0.9,
    });
    expect(chain.id).toBeTruthy();
    expect(chain.confidence).toBe(0.9);
  });

  it("lists chains most-recent first and filters by confidence", async () => {
    await recordCausalChain(store, { nodeId, trigger: "t", goal: "g", approach: "a", outcome: "o", lesson: "weak lesson", confidence: 0.2 });
    await recordCausalChain(store, { nodeId, trigger: "t", goal: "g", approach: "a", outcome: "o", lesson: "strong lesson", confidence: 0.9 });
    const all = await listCausalChains(store, nodeId);
    expect(all).toHaveLength(2);
    const lessons = await lessonsForNode(store, nodeId, 0.6);
    expect(lessons).toEqual(["strong lesson"]);
  });
});
