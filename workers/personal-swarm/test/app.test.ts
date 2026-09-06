import { describe, it, expect, beforeAll } from "vitest";
import { MemoryFractalDB } from "../src/store";
import { createApp } from "../src/index";
import type { SwarmDispatcher } from "../src/types";

describe("CWP-040 integration: Hono swarm API", () => {
  let app: ReturnType<typeof createApp>;
  const store = new MemoryFractalDB();
  const fired: string[] = [];

  beforeAll(async () => {
    await store.init();
    const dispatcher: SwarmDispatcher = {
      async dispatch(agent) {
        fired.push(agent);
      },
    };
    app = createApp({ getDB: async () => store, dispatcher });
  });

  it("creates a Family node, records a causal chain and consolidates", async () => {
    const create = await app.request("/api/node", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scale: "family", label: "Household" }),
    });
    expect(create.status).toBe(201);
    const node = await create.json();
    expect(node.id).toBeTruthy();

    const causal = await app.request(`/api/node/${node.id}/causal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trigger: "bill due", goal: "pay on time", approach: "auto-pay",
        outcome: "paid", lesson: "auto-pay removes friction", confidence: 0.9,
      }),
    });
    expect(causal.status).toBe(201);
    const body = await causal.json();
    expect(body.chain.id).toBeTruthy();
    expect(body.consolidation.agentsFired.length).toBeGreaterThan(0);
    expect(fired.length).toBeGreaterThan(0);

    const list = await app.request(`/api/node/${node.id}/causal`);
    const chains = await list.json();
    expect(chains).toHaveLength(1);
  });

  it("rejects nodes missing required fields", async () => {
    const res = await app.request("/api/node", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scale: "family" }),
    });
    expect(res.status).toBe(400);
  });
});
