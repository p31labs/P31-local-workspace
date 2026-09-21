/**
 * mcp-registry — P31 MCP Server Registry
 *
 * Central discovery point for all P31 MCP servers. Proxies tools/list and
 * tools/call to individual servers. KV-cached tool lists with 5-min TTL.
 *
 * Endpoints:
 *   GET  /                   HTML listing page
 *   GET  /health             Health check
 *   GET  /servers            JSON list of all servers
 *   GET  /servers/:name      Server details + live tool list
 *   POST /servers/:name/call Proxy tools/call to the server
 */

interface Env {
  REGISTRY_KV: KVNamespace;
  /** Service binding to music-maker-mcp — internal probe/call path. */
  MUSIC_MAKER_MCP?: Fetcher;
}

interface McpServerEntry {
  name: string;
  url: string;
  category: "remote" | "local";
  description: string;
  /** Optional service binding name — when set, calls go through the binding
   *  (internal) instead of a public workers.dev fetch (which fails DNS 1042). */
  binding?: keyof Env;
  tools?: string[];
}

const SERVERS: McpServerEntry[] = [
  {
    name: "p31-mcp-server",
    url: "https://p31-mcp-server.trimtab-signal.workers.dev/mcp",
    category: "remote",
    description: "P31 native MCP front door — 9 core tools (oasis, phos, jitterbug, healer, bus)",
  },
  {
    name: "p31-crypto-mcp",
    url: "https://p31-crypto-mcp.trimtab-signal.workers.dev/mcp",
    category: "remote",
    description: "Post-quantum crypto — ML-DSA-65, ML-KEM-768, SD-JWT, Taler, x402 (12 tools)",
  },
  {
    name: "design-mcp",
    url: "https://p31-design-mcp.trimtab-signal.workers.dev/",
    category: "remote",
    description: "P31 Design System — tokens, components, icons, validation (18 tools)",
  },
  {
    name: "phenix-wallet-mcp",
    url: "https://phenix-wallet-mcp.trimtab-signal.workers.dev/mcp",
    category: "remote",
    description: "Phenix Donation Wallet — credentials, ZK proofs, ledger (9 tools)",
  },
  {
    name: "marketplace-mcp",
    url: "https://marketplace-mcp.trimtab-signal.workers.dev/mcp",
    category: "remote",
    description: "Sovereign Marketplace — listings, offers, trades, escrow (10 tools)",
  },
  {
    name: "p31-shell",
    url: "https://p31-shell.trimtab-signal.workers.dev/mcp",
    category: "remote",
    description: "P31 Shell — interactive shell access (remote)",
  },
  {
    name: "music-maker-mcp",
    url: "https://music-maker-mcp.trimtab-signal.workers.dev/mcp",
    category: "remote",
    description: "Spatial music maker — observe/place/clear/name/trigger the family's composition (5 tools)",
    binding: "MUSIC_MAKER_MCP",
  },
  {
    name: "p31-cli",
    url: "http://localhost:8788/mcp",
    category: "local",
    description: "P31 CLI — local-only MCP server (requires `p31 serve` running locally)",
  },
];

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: corsHeaders() });
}

const KV_TTL = 300; // 5 minutes

async function fetchTools(env: Env, server: McpServerEntry, timeoutMs = 5000): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const body = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: {},
    });
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    };

    // Prefer a service binding (internal, no DNS 1042). Otherwise public URL.
    let res: Response;
    const binding = server.binding ? (env[server.binding] as Fetcher | undefined) : undefined;
    if (binding) {
      const target = new URL(server.url);
      res = await binding.fetch(new Request(target.toString(), {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      }));
    } else {
      res = await fetch(server.url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });
    }
    clearTimeout(timer);

    if (!res.ok) return [];
    // MCP Streamable HTTP may return plain JSON OR an SSE-framed payload
    // (`data: {...}\n\n`). Parse both.
    let text = "";
    try { text = await res.text(); } catch { return []; }
    let parsed: any = null;
    try {
      parsed = JSON.parse(text.replace(/^data:\s*/gm, "").trim());
    } catch {
      // If the body was SSE with multiple events, take the last JSON object.
      const frames = text.split("\n\n").map((f) => f.replace(/^data:\s*/, "").trim()).filter(Boolean);
      for (let i = frames.length - 1; i >= 0; i--) {
        try { parsed = JSON.parse(frames[i]); break; } catch { /* skip */ }
      }
    }
    const tools = parsed?.result?.tools;
    if (!Array.isArray(tools)) return [];
    return tools.map((t: any) => t.name).filter(Boolean);
  } catch {
    return [];
  }
}

async function getServerTools(
  env: Env,
  server: McpServerEntry,
): Promise<string[]> {
  if (server.category === "local") {
    // Local servers aren't reachable from the edge; return static list.
    return server.tools ?? [];
  }

  const cacheKey = `tools:${server.name}`;
  const cached = await env.REGISTRY_KV.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const tools = await fetchTools(env, server);
  if (tools.length > 0) {
    await env.REGISTRY_KV.put(cacheKey, JSON.stringify(tools), { expirationTtl: KV_TTL });
  }
  return tools;
}

function htmlPage(servers: Array<McpServerEntry & { liveTools: string[] }>): string {
  const rows = servers
    .map(
      (s) => `
      <tr>
        <td><code>${s.name}</code></td>
        <td><span class="badge badge-${s.category}">${s.category}</span></td>
        <td>${s.description}</td>
        <td>${s.liveTools.length > 0 ? s.liveTools.length : '<span class="muted">unreachable</span>'}</td>
        <td><a href="/servers/${s.name}">details</a></td>
      </tr>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>P31 MCP Registry</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0a0e17; color: #e0e6ed; padding: 2rem; }
    h1 { color: #00e5ff; margin-bottom: .25rem; }
    .subtitle { color: #7a8ba8; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: .6rem .8rem; border-bottom: 1px solid #1a2236; }
    th { color: #7a8ba8; font-weight: 600; }
    a { color: #00e5ff; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code { background: #141c2e; padding: 2px 6px; border-radius: 4px; font-size: .9em; }
    .badge { padding: 2px 8px; border-radius: 4px; font-size: .8em; font-weight: 600; }
    .badge-remote { background: #0d2b3e; color: #00e5ff; }
    .badge-local { background: #2b1d0d; color: #ffb74d; }
    .muted { color: #556; }
    .footer { margin-top: 2rem; color: #556; font-size: .85em; }
  </style>
</head>
<body>
  <h1>P31 MCP Registry</h1>
  <p class="subtitle">Central discovery for ${servers.length} MCP servers</p>
  <table>
    <thead><tr><th>Server</th><th>Category</th><th>Description</th><th>Tools</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="footer">
    <a href="/servers">JSON API</a> &middot;
    <a href="/health">Health</a> &middot;
    Powered by KV cache (${KV_TTL}s TTL)
  </p>
</body>
</html>`;
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // GET /health
  if (url.pathname === "/health") {
    return json({
      status: "ok",
      service: "mcp-registry",
      servers: SERVERS.length,
      categories: { remote: SERVERS.filter((s) => s.category === "remote").length, local: SERVERS.filter((s) => s.category === "local").length },
    });
  }

  // GET /servers — JSON list
  if (url.pathname === "/servers" && request.method === "GET") {
    const results = await Promise.all(
      SERVERS.map(async (s) => ({
        name: s.name,
        category: s.category,
        description: s.description,
        tools: await getServerTools(env, s),
      })),
    );
    return json(results);
  }

  // GET / — HTML listing
  if (url.pathname === "/" && request.method === "GET") {
    const results = await Promise.all(
      SERVERS.map(async (s) => ({
        ...s,
        liveTools: await getServerTools(env, s),
      })),
    );
    return new Response(htmlPage(results), {
      headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders() },
    });
  }

  // /servers/:name — details
  const serverMatch = url.pathname.match(/^\/servers\/([^/]+)$/);
  if (serverMatch && request.method === "GET") {
    const name = decodeURIComponent(serverMatch[1]);
    const server = SERVERS.find((s) => s.name === name);
    if (!server) return json({ error: "server not found" }, 404);
    const tools = await getServerTools(env, server);
    return json({ ...server, tools });
  }

  // POST /servers/:name/call — proxy tools/call
  const callMatch = url.pathname.match(/^\/servers\/([^/]+)\/call$/);
  if (callMatch && request.method === "POST") {
    const name = decodeURIComponent(callMatch[1]);
    const server = SERVERS.find((s) => s.name === name);
    if (!server) return json({ error: "server not found" }, 404);
    if (server.category === "local") return json({ error: "local server not reachable from edge" }, 503);

    const body = await request.json().catch(() => null);
    if (!body) return json({ error: "invalid JSON body" }, 400);

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const headers = { "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
      const binding = server.binding ? (env[server.binding] as Fetcher | undefined) : undefined;
      let res: Response;
      if (binding) {
        const target = new URL(server.url);
        res = await binding.fetch(new Request(target.toString(), {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        }));
      } else {
        res = await fetch(server.url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      }
      clearTimeout(timer);
      // MCP Streamable HTTP may return SSE-framed JSON (`data: {...}`) — unwrap
      // it so callers get plain JSON (the same response shape as the target's
      // result field).
      let text = "";
      try { text = await res.text(); } catch { text = ""; }
      let data: unknown = null;
      try { data = JSON.parse(text.replace(/^data:\s*/gm, "").trim()); } catch { data = null; }
      return json(data, res.status);
    } catch (e: any) {
      return json({ error: `upstream error: ${String(e?.message ?? e)}` }, 502);
    }
  }

  return json({ error: "not found" }, 404);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handleRequest(request, env);
  },
};
