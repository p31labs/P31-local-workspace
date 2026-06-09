/**
 * k4-hubs HTTP router: legacy /route + /mesh-state + HubFusion DO /hub/:id/*
 */

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allowed = new Set([
    "https://p31ca.org",
    "https://www.p31ca.org",
    "https://bonding.p31ca.org",
    "https://phosphorus31.org",
    "https://www.phosphorus31.org",
    "http://127.0.0.1:8080",
    "http://localhost:8080",
    "http://localhost:4321",
    "http://127.0.0.1:4321",
  ]);
  if (origin.endsWith(".pages.dev")) allowed.add(origin);
  const allow = allowed.has(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-P31-Hub-Token",
    "Access-Control-Max-Age": "86400",
  };
}

function withCors(response, request) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders(request))) {
    headers.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * @param {Request} request
 * @param {{ K4_CAGE: Fetcher; K4_PERSONAL: Fetcher; HUB_FUSION: DurableObjectNamespace }} env
 */
export async function handleRequest(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  const url = new URL(request.url);

  const hubMatch = url.pathname.match(/^\/hub\/([^/]+)(\/.*)?$/);
  if (hubMatch && env.HUB_FUSION) {
    const hubId = hubMatch[1];
    const subPath = hubMatch[2] || "/health";
    const id = env.HUB_FUSION.idFromName(hubId);
    const stub = env.HUB_FUSION.get(id);
    const inner = await stub.fetch(
      new Request(new URL(subPath, request.url), {
        method: request.method,
        headers: request.headers,
        body: request.body,
      })
    );
    return withCors(inner, request);
  }

  if (url.pathname === "/route" && request.method === "POST") {
    const { from, to, action, payload, scope } = await request.json();
    if (!from || !scope) {
      return withCors(Response.json({ error: "Missing from or scope" }, { status: 400 }), request);
    }

    switch (action) {
      case "send_to_mesh": {
        const target = to || scope;
        if (!target || target === from) {
          return withCors(Response.json({ error: "Missing or self target" }, { status: 400 }), request);
        }
        const r = await env.K4_CAGE.fetch(
          new Request(`https://k4-cage.internal/api/ping/${encodeURIComponent(from)}/${encodeURIComponent(target)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload || {}),
          })
        );
        return withCors(r, request);
      }

      case "query_agent": {
        if (!to) return withCors(Response.json({ error: "Missing target" }, { status: 400 }), request);
        const energyRes = await env.K4_PERSONAL.fetch(
          new Request(`https://k4-personal.internal/agent/${encodeURIComponent(to)}/energy`)
        );
        const energy = await energyRes.json();
        return withCors(
          Response.json({
            available: (energy.spoons ?? 10) > 2,
            energy: { spoons: energy.spoons ?? 10, max: energy.max ?? 12 },
          }),
          request
        );
      }

      case "broadcast": {
        const members = payload?.members || [];
        const results = await Promise.all(
          members.filter((m) => m !== from).map(async (memberId) => {
            try {
              await env.K4_PERSONAL.fetch(
                new Request(`https://k4-personal.internal/agent/${encodeURIComponent(memberId)}/chat`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ message: `[System] ${payload.message}`, scope }),
                })
              );
              return { member: memberId, status: "ok" };
            } catch (e) {
              return { member: memberId, status: "error", error: e.message };
            }
          })
        );
        return withCors(Response.json({ ok: true, results }), request);
      }

      default:
        return withCors(Response.json({ error: "Unknown action" }, { status: 400 }), request);
    }
  }

  const meshMatch = url.pathname.match(/^\/mesh-state\/(.+)$/);
  if (meshMatch) {
    const scope = meshMatch[1];
    try {
      const statsRes = await env.K4_CAGE.fetch(
        new Request(`https://k4-cage.internal/room-stats/${encodeURIComponent(scope)}`)
      );
      const stats = await statsRes.json();
      return withCors(Response.json({ scope, ...stats }), request);
    } catch {
      return withCors(Response.json({ scope, connections: 0, error: "Room not found" }), request);
    }
  }

  if (url.pathname === "/health") {
    return withCors(
      Response.json({ status: "ok", service: "k4-hubs", hubFusion: Boolean(env.HUB_FUSION) }),
      request
    );
  }

  return withCors(new Response("k4-hubs alive", { status: 200 }), request);
}
