import { describe, it, expect, beforeAll } from "vitest";
import { MemoryFractalDB } from "../src/store";
import { createApp } from "../src/index";
import { getUnifiedView } from "../src/dashboard";
import { consolidate } from "../src/consolidation";
import { createNode } from "../src/fractal";
import type { CausalChain, SwarmDispatcher } from "../src/types";

// CWP-2026-040H — spatial dashboard unified view + swarm-event persistence.
describe("CWP-040H: spatial dashboard unified view", () => {
  let db: MemoryFractalDB;
  let dispatcher: SwarmDispatcher;

  beforeAll(async () => {
    db = new MemoryFractalDB();
    await db.init();
    dispatcher = { async dispatch() {} };

    const family = await createNode(db, { scale: "family", label: "Household" });
    const career = await createNode(db, { scale: "career", label: "Job" });
    // child with a parent link (drives the unified view's edge derivation)
    await createNode(db, { scale: "family", label: "Child", parentId: family.id });

    const chain: CausalChain = {
      id: "c1", nodeId: family.id,
      trigger: "t", goal: "g", approach: "a", outcome: "o",
      lesson: "l", confidence: 0.9, createdAt: new Date().toISOString(),
    };
    await consolidate(db, dispatcher, family, chain);
    void career;
  });

  it("merges Family/Career nodes and derives parent->child links", async () => {
    const view = await getUnifiedView(db);
    expect(view.nodes.length).toBe(3);
    expect(view.links.length).toBe(1);
    expect(view.links[0].target).toBeTruthy();
  });

  it("filters by scale", async () => {
    const view = await getUnifiedView(db, { filterScale: "career" });
    expect(view.nodes.every((n) => n.scale === "career")).toBe(true);
  });

  it("records swarm events during consolidation", async () => {
    const events = await db.listSwarmEvents();
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].status).toBe("fired");
  });

  it("exposes the unified view over /api/fractal", async () => {
    const app = createApp({ getDB: async () => db, dispatcher });
    const res = await app.request("/api/fractal");
    expect(res.status).toBe(200);
    const body = await res.json() as { nodes: unknown[]; links: unknown[]; events: unknown[] };
    expect(body.nodes.length).toBe(3);
    expect(body.links.length).toBe(1);
    expect(body.events.length).toBeGreaterThan(0);
  });

  it("/spatial returns 501 when R2 asset binding is absent", async () => {
    const app = createApp({ getDB: async () => db, dispatcher });
    const res = await app.request("/spatial");
    expect(res.status).toBe(501);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("assets_binding_unavailable");
  });

  it("/spatial returns 404 when the dashboard asset is missing", async () => {
    const assets = {
      async get() {
        return null;
      },
    };
    const app = createApp({ getDB: async () => db, dispatcher, assets: assets as any });
    const res = await app.request("/spatial");
    expect(res.status).toBe(404);
  });
});
