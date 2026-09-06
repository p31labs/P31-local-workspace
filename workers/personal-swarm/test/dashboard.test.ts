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

  it("/spatial sends Cache-Control + ETag and honours If-None-Match (304)", async () => {
    const body = new ReadableStream();
    const headers = new Headers();
    const assets = {
      async get() {
        return {
          body,
          httpEtag: '"abc123"',
          writeHttpMetadata: (h: Headers) => h.set("Content-Type", "text/html"),
        };
      },
    };
    const app = createApp({ getDB: async () => db, dispatcher, assets: assets as any });

    const first = await app.request("/spatial");
    expect(first.status).toBe(200);
    expect(first.headers.get("ETag")).toBe('"abc123"');
    expect(first.headers.get("Cache-Control")).toContain("max-age=86400");

    const second = await app.request("/spatial", { headers: { "If-None-Match": '"abc123"' } });
    expect(second.status).toBe(304);
  });

  it("GET /api/fractal is edge-cached (MISS then HIT)", async () => {
    class FakeCache {
      store = new Map<string, Response>();
      async match(req: Request) { return this.store.get(req.url); }
      async put(req: Request, res: Response) { this.store.set(req.url, res); }
    }
    Object.defineProperty(globalThis, "caches", {
      value: { default: new FakeCache() },
      configurable: true,
    });

    const app = createApp({ getDB: async () => db, dispatcher });
    const a = await app.request("/api/fractal");
    expect(a.headers.get("X-Cache")).toBe("MISS");
    const b = await app.request("/api/fractal");
    expect(b.headers.get("X-Cache")).toBe("HIT");
    const ab = await a.json() as { nodes: unknown[] };
    const bb = await b.json() as { nodes: unknown[] };
    expect(ab.nodes.length).toBe(bb.nodes.length);

    delete (globalThis as any).caches;
  });
});
