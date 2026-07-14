import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryFractalDB } from "../src/store";
import { createNode } from "../src/fractal";
import { recordCausalChain } from "../src/causalMemory";
import { consolidate } from "../src/consolidation";
import { AGENTS_BY_SCALE } from "../src/swarm";
import type { SwarmDispatcher, FractalNode, CausalChain } from "../src/types";

function stubDispatcher() {
  const fired: string[] = [];
  const dispatcher: SwarmDispatcher = {
    async dispatch(agent) {
      fired.push(agent);
    },
  };
  return { dispatcher, fired };
}

describe("CWP-040C/040D: swarm orchestration + event-driven consolidation", () => {
  let store = new MemoryFractalDB();
  let node: FractalNode;
  beforeEach(async () => {
    store = new MemoryFractalDB();
    await store.init();
    node = await createNode(store, { scale: "career", label: "Lab" });
  });

  it("maps each scale to the right agent subset", () => {
    expect(AGENTS_BY_SCALE.family).toEqual(["benefits", "legal"]);
    expect(AGENTS_BY_SCALE.career).toEqual(["grant", "finance", "content"]);
  });

  it("fires agents on record and escalates on failure", async () => {
    const { dispatcher, fired } = stubDispatcher();
    const chain = await recordCausalChain(store, {
      nodeId: node.id, trigger: "t", goal: "g", approach: "a", outcome: "o",
      lesson: "l", confidence: 0.1,
    });
    const res = await consolidate(store, dispatcher, node, chain);
    expect(res.agentsFired).toContain("grant");
    // failure escalates to a stabilising agent
    expect(res.agentsFired).toContain("benefits");
    expect(fired.length).toBeGreaterThan(0);
  });

  it("updates behavioural DNA after consolidation", async () => {
    const { dispatcher } = stubDispatcher();
    const chain = await recordCausalChain(store, {
      nodeId: node.id, trigger: "t", goal: "g", approach: "a", outcome: "o",
      lesson: "l", confidence: 0.95,
    });
    const res = await consolidate(store, dispatcher, node, chain);
    expect(res.genomeUpdated).toBe(true);
  });
});
