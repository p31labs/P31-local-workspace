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
import { D1FractalDB } from "./store";

export interface SwarmEnv {
  DB: any;
  CORTEX_URL?: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
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
}) {
  const app = new Hono();

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
    const app = createApp({ getDB, dispatcher });
    return app.fetch(request);
  },
};
