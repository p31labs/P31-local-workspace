interface Env {
  P31_SIGNALING_KV: KVNamespace;
}

interface PeerRecord {
  node_id: string;
  ip: string;
  port: number;
  last_seen: number;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (method === "POST" && url.pathname === "/register") {
      let body: Record<string, unknown>;
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return jsonResponse({ error: "Invalid JSON body" }, 400);
      }

      const node_id = body.node_id as string | undefined;
      if (!node_id) {
        return jsonResponse({ error: "Missing node_id" }, 400);
      }

      const ip = (body.ip as string | undefined) ?? request.headers.get("CF-Connecting-IP") ?? "";
      const port = typeof body.port === "number" ? body.port : 0;

      const record: PeerRecord = {
        node_id,
        ip,
        port,
        last_seen: Date.now(),
      };

      await env.P31_SIGNALING_KV.put(
        node_id,
        JSON.stringify(record),
        { expirationTtl: 60 }
      );

      return jsonResponse({ ok: true });
    }

    if (method === "GET" && url.pathname === "/peers") {
      const keys = await env.P31_SIGNALING_KV.list();
      const peers: PeerRecord[] = [];

      for (const key of keys.keys) {
        const raw = await env.P31_SIGNALING_KV.get(key.name);
        if (raw) {
          try {
            peers.push(JSON.parse(raw) as PeerRecord);
          } catch {
            continue;
          }
        }
      }

      peers.sort((a, b) => b.last_seen - a.last_seen);

      return jsonResponse({ peers });
    }

    const deleteMatch = url.pathname.match(/^\/peers\/([^/]+)$/);
    if (method === "DELETE" && deleteMatch) {
      const node_id = deleteMatch[1];
      await env.P31_SIGNALING_KV.delete(node_id);
      return jsonResponse({ ok: true });
    }

    return new Response("Not Found", { status: 404 });
  },
};
