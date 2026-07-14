import { Hono } from "hono";
import type { FractalDB, FractalNode, CausalChain, SwarmDispatcher, Scale } from "./types";
import {
  createNode,
  getNode,
  listNodes,
  linkNodes,
  listLinks,
} from "./fractal";
import { recordCausalChain, listCausalChains } from "./causalMemory";
import { getDNA } from "./behaviouralDna";
import { consolidate } from "./consolidation";
import { getUnifiedView } from "./dashboard";
import { D1FractalDB } from "./store";

export interface SwarmEnv {
  DB: any;
  CORTEX_URL?: string;
  // CWP-2026-040H — R2 binding holding the spatial dashboard asset.
  // (BUG-05 fix: serve the dashboard from this binding, not a mis-wired
  // ASSETS module, so /spatial returns 200 instead of 404.)
  PHOS_ASSETS?: {
    get(key: string): Promise<{
      body: ReadableStream;
      contentType?: string;
      httpEtag?: string;
      etag?: string;
      writeHttpMetadata(headers: Headers): void;
    } | null>;
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

// CWP-2026-041 §1/§2 — edge read-cache for hot D1 GETs. Keeps D1
// round-trips + CPU down for the dashboard's polling reads. Short TTL with
// stale-while-revalidate: writes stay visible within seconds, reads are cheap.
// Cache is read lazily so unit tests can inject a `caches` stub.
async function cachedJson(c: any, producer: () => Promise<unknown>): Promise<Response> {
  const cache = (globalThis as any).caches?.default;
  const key = new Request(c.req.url);
  if (cache) {
    const hit = await cache.match(key);
    if (hit) {
      const h = new Headers(hit.headers);
      h.set("X-Cache", "HIT");
      return new Response(hit.body, { status: hit.status, headers: h });
    }
  }
  const data = await producer();
  const res = json(data);
  res.headers.set("Cache-Control", "public, max-age=30, stale-while-revalidate=300");
  res.headers.set("X-Cache", "MISS");
  if (cache) {
    // Await so the write completes within the request lifetime (deferring via
    // waitUntil is unreliable when the isolate recycles between requests).
    try {
      await cache.put(key, res.clone());
    } catch {
      /* cache write is best-effort */
    }
  }
  return res;
}

// Real dispatcher: routes to p31-cortex agent DO endpoints.
function cortexDispatcher(cortexUrl: string): SwarmDispatcher {
  return {
    async dispatch(agent, node, payload) {
      const url = `${cortexUrl}/api/${agent}/run`;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId: node.id, scale: node.scale, payload }),
      }).catch(() => {});
    },
  };
}

// Factory so the same logic is testable with a MemoryFractalDB + stub dispatcher.
export function createApp(deps: {
  getDB: () => Promise<FractalDB>;
  dispatcher: SwarmDispatcher;
  assets?: SwarmEnv["PHOS_ASSETS"];
}) {
  const app = new Hono();

  // Surface real errors as JSON instead of Hono's default "Internal Server
  // Error" text (which otherwise swallows the underlying cause).
  app.onError((err, c) => {
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return c.json({ error: "handler_exception", detail: message }, 500);
  });

  app.options("/*", () => new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } }));

  app.post("/api/node", async (c) => {
    const body = await c.req.json<{ scale: Scale; label: string; didKey?: string; parentId?: string }>();
    if (!body.scale || !body.label) return json({ error: "scale and label required" }, 400);
    const db = await deps.getDB();
    const node = await createNode(db, body);
    return json(node, 201);
  });

  app.get("/api/node/:id", async (c) => {
    const db = await deps.getDB();
    const node = await getNode(db, c.req.param("id"));
    if (!node) return json({ error: "not_found" }, 404);
    const dna = await getDNA(db, node.id);
    const links = await listLinks(db, node.id);
    return json({ ...node, dna: dna.genome, links });
  });

  app.get("/api/nodes", async (c) => {
    const db = await deps.getDB();
    const scale = c.req.query("scale") as Scale | undefined;
    return json(await listNodes(db, scale));
  });

  app.post("/api/node/:id/causal", async (c) => {
    const db = await deps.getDB();
    const node = await getNode(db, c.req.param("id"));
    if (!node) return json({ error: "not_found" }, 404);
    const body = await c.req.json();
    const chain: CausalChain = await recordCausalChain(db, { nodeId: node.id, ...body });
    // Event-driven consolidation (no new cron).
    const result = await consolidate(db, deps.dispatcher, node, chain);
    return json({ chain, consolidation: result }, 201);
  });

  app.get("/api/node/:id/causal", async (c) => {
    const db = await deps.getDB();
    return json(await listCausalChains(db, c.req.param("id")));
  });

  app.post("/api/link", async (c) => {
    const body = await c.req.json<{ fromNode: string; toNode: string; relType: "supports" | "contains" | "mirrors" | "guards" }>();
    const db = await deps.getDB();
    return json(await linkNodes(db, body.fromNode, body.toNode, body.relType), 201);
  });

  app.get("/api/node/:id/links", async (c) => {
    const db = await deps.getDB();
    return json(await listLinks(db, c.req.param("id")));
  });

  // CWP-2026-040H — unified view for the spatial dashboard.
  // CWP-2026-041 §1 — edge-cached (hot polling read).
  app.get("/api/fractal", async (c) => {
    const db = await deps.getDB();
    const scale = c.req.query("scale") as Scale | undefined;
    return cachedJson(c, () => getUnifiedView(db, { filterScale: scale }));
  });

  app.get("/api/swarm-events", async (c) => {
    const db = await deps.getDB();
    const nodeId = c.req.query("nodeId");
    const limit = Number(c.req.query("limit") || "100");
    return cachedJson(c, () => db.listSwarmEvents(nodeId ?? undefined, limit));
  });

  // CWP-2026-040H — serve the spatial dashboard HTML from the R2 binding.
  // CWP-2026-041 §2 — zero-egress CDN: long Cache-Control + ETag
  // conditional (304 when unchanged -> ~100B vs ~14KB per request).
  app.get("/spatial", async (c) => {
    const assets = deps.assets;
    if (!assets) return json({ error: "assets_binding_unavailable" }, 501);
    const obj = await assets.get("spatial-dashboard.html");
    if (!obj) return json({ error: "asset_not_found" }, 404);
    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    const etag = (obj as any).httpEtag || (obj as any).etag;
    if (etag) {
      headers.set("ETag", etag);
      const inm = c.req.header("if-none-match");
      if (inm && inm === etag) {
        return new Response(null, { status: 304, headers });
      }
    }
    headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=86400");
    headers.set("Access-Control-Allow-Origin", "*");
    return new Response(obj.body, { status: 200, headers });
  });

  return app;
}

export default {
  async fetch(request: Request, env: SwarmEnv): Promise<Response> {
    const getDB = async (): Promise<FractalDB> => {
      const db = new D1FractalDB(env.DB);
      await db.init();
      return db;
    };
    const dispatcher = cortexDispatcher(env.CORTEX_URL || "http://localhost:8787");
    const app = createApp({ getDB, dispatcher, assets: env.PHOS_ASSETS });
    return app.fetch(request);
  },
};
