/**
 * P31 Agent Hub — Workers AI + K₄ service bindings (k4-cage, k4-personal, k4-hubs).
 * Internal write tools enabled when RELEASE_CHANNEL != "public" and HUBS_WRITE_TOKEN set.
 */
import { DurableObject } from "cloudflare:workers";

var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-P31-Trace, X-P31-Session",
  "Access-Control-Max-Age": "86400"
};

var READ_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_family_mesh",
      description: "Read the family K₄ cage mesh (vertices will/sj/wj/christyn, edges, love totals). Source of truth: k4-cage KV.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_personal_mesh",
      description: "Read the personal K₄ mesh (pillars a‑d). Isolated KV. Same JSON shape as cage personal scope.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "list_hubs",
      description: "List life-context K₄ hubs (docks, bind modes). Read-only GET /api/hubs.",
      parameters: { type: "object", properties: {} }
    }
  }
];

var WRITE_TOOLS = [
  {
    type: "function",
    function: {
      name: "hubs_create",
      description: "Create a new life-context K₄ hub (UUID manifest, default dock labels). Uses POST /api/hubs on k4-hubs with write token.",
      parameters: {
        type: "object",
        properties: {
          kind: { type: "string", description: "Hub kind (default general)" },
          title: { type: "string", description: "Title (optional)" },
          dockLabels: {
            type: "object",
            description: "Optional { a, b, c, d } string labels"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "hub_dock_bind",
      description: "Bind a hub dock (a‑d) to a personal mesh ref with mode mirror, live, or vault. POST /api/hubs/{hubId}/dock/{dock}/bind",
      parameters: {
        type: "object",
        properties: {
          hubId: { type: "string", description: "Hub UUID" },
          dockId: { type: "string", description: "Dock letter a, b, c, or d" },
          personalRef: { type: "string", description: "Default personal:default" },
          mode: { type: "string", description: "mirror | live | vault" }
        },
        required: ["hubId", "dockId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "hub_dock_unbind",
      description: "Remove binding from a hub dock. POST /api/hubs/{hubId}/dock/{dock}/unbind",
      parameters: {
        type: "object",
        properties: {
          hubId: { type: "string" },
          dockId: { type: "string" }
        },
        required: ["hubId", "dockId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "hub_presence",
      description: "Update presence on a hub dock vertex. POST /api/hubs/{hubId}/presence/{dock}",
      parameters: {
        type: "object",
        properties: {
          hubId: { type: "string" },
          dockId: { type: "string" },
          status: { type: "string", description: "e.g. online, offline" },
          metadata: { type: "object", description: "Optional small JSON object" }
        },
        required: ["hubId", "dockId", "status"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "hub_ping",
      description: "Send a ping (emoji) along a valid hub edge between docks. POST /api/hubs/{hubId}/ping/{from}/{to}",
      parameters: {
        type: "object",
        properties: {
          hubId: { type: "string" },
          from: { type: "string", description: "Dock a‑d" },
          to: { type: "string", description: "Dock a‑d" },
          emoji: { type: "string" }
        },
        required: ["hubId", "from", "to", "emoji"]
      }
    }
  }
];

function isInternalWrites(env) {
  const ch = String(env.RELEASE_CHANNEL || "public").toLowerCase();
  if (ch === "public") return false;
  const tok = env.HUBS_WRITE_TOKEN;
  return tok != null && String(tok).length > 0;
}

function toolsForEnv(env) {
  if (!isInternalWrites(env)) return READ_TOOLS;
  return [...READ_TOOLS, ...WRITE_TOOLS];
}

function hubsWriteHeaders(env) {
  const h = {};
  const tok = env.HUBS_WRITE_TOKEN;
  if (tok != null && String(tok) !== "") {
    h.Authorization = `Bearer ${String(tok)}`;
  }
  return h;
}

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS, ...extra }
  });
}

function scrubForLlm(text) {
  let s = String(text);
  s = s.replace(/Bearer\s+[A-Za-z0-9._\-+/=]{8,}/gi, "Bearer [redacted]");
  s = s.replace(/p31-dad-[\w-]+/gi, "[redacted-admin]");
  s = s.replace(/p31-delta-[A-Za-z0-9]+/gi, "[redacted-token]");
  return s;
}

function truncate(s, max) {
  const t = String(s);
  if (t.length <= max) return t;
  return `${t.slice(0, max)}\u2026[truncated ${t.length - max} chars]`;
}

function authError(request, env) {
  const need = env.AGENT_HUB_SECRET;
  if (!need) return null;
  const h = request.headers.get("Authorization") || "";
  if (h !== `Bearer ${need}`) {
    return json({ error: "unauthorized", hint: "Send Authorization: Bearer <AGENT_HUB_SECRET>" }, 401);
  }
  return null;
}

var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertHubId(id) {
  const s = String(id || "").trim();
  if (!UUID_RE.test(s)) return { error: "invalid_hub_id", hint: "Expected UUID" };
  return s;
}

function assertDock(d) {
  const x = String(d || "").trim().toLowerCase();
  if (!"abcd".includes(x)) return { error: "invalid_dock", hint: "Use a, b, c, or d" };
  return x;
}

async function k4BindingJson(service, path, init, trace) {
  if (!service) {
    return { error: "service_binding_missing", path };
  }
  const method = init.method || "GET";
  const headers = {
    Accept: "application/json",
    ...trace ? { "X-P31-Trace": trace } : {},
    ...init.headers || {}
  };
  let bodyStr;
  if (init.body !== void 0 && init.body !== null) {
    bodyStr = typeof init.body === "string" ? init.body : JSON.stringify(init.body);
    if (!headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = "application/json";
    }
  }
  const req = new Request(`https://k4-bind${path}`, {
    method,
    headers,
    body: bodyStr
  });
  const res = await service.fetch(req);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { _raw: truncate(text, 2e3), status: res.status };
  }
  if (!res.ok) {
    return { error: "upstream_http", status: res.status, body };
  }
  return body;
}

async function k4Fetch(service, path, trace) {
  return await k4BindingJson(service, path, { method: "GET" }, trace);
}

async function executeTool(name, argsJson, env, trace) {
  const args = argsJson || {};
  switch (name) {
    case "get_family_mesh":
      return await k4Fetch(env.K4_CAGE, "/api/mesh", trace);
    case "get_personal_mesh":
      return await k4Fetch(env.K4_PERSONAL, "/api/mesh", trace);
    case "list_hubs":
      return await k4Fetch(env.K4_HUBS, "/api/hubs", trace);
    case "hubs_create": {
      if (!isInternalWrites(env)) return { error: "writes_disabled" };
      const payload = {};
      if (typeof args.kind === "string" && args.kind.trim()) payload.kind = args.kind.trim().slice(0, 64);
      if (typeof args.title === "string") payload.title = args.title.trim().slice(0, 200);
      if (args.dockLabels && typeof args.dockLabels === "object" && !Array.isArray(args.dockLabels)) {
        payload.dockLabels = args.dockLabels;
      }
      return await k4BindingJson(env.K4_HUBS, "/api/hubs", { method: "POST", body: payload, headers: hubsWriteHeaders(env) }, trace);
    }
    case "hub_dock_bind": {
      if (!isInternalWrites(env)) return { error: "writes_disabled" };
      const hid = assertHubId(args.hubId);
      if (typeof hid === "object") return hid;
      const dock = assertDock(args.dockId);
      if (typeof dock === "object") return dock;
      const body = {
        personalRef: typeof args.personalRef === "string" && args.personalRef.trim() ? args.personalRef.trim().slice(0, 512) : "personal:default",
        mode: typeof args.mode === "string" ? args.mode.trim().toLowerCase() : "mirror"
      };
      return await k4BindingJson(
        env.K4_HUBS,
        `/api/hubs/${hid}/dock/${dock}/bind`,
        { method: "POST", body, headers: hubsWriteHeaders(env) },
        trace
      );
    }
    case "hub_dock_unbind": {
      if (!isInternalWrites(env)) return { error: "writes_disabled" };
      const hid = assertHubId(args.hubId);
      if (typeof hid === "object") return hid;
      const dock = assertDock(args.dockId);
      if (typeof dock === "object") return dock;
      return await k4BindingJson(
        env.K4_HUBS,
        `/api/hubs/${hid}/dock/${dock}/unbind`,
        { method: "POST", body: {}, headers: hubsWriteHeaders(env) },
        trace
      );
    }
    case "hub_presence": {
      if (!isInternalWrites(env)) return { error: "writes_disabled" };
      const hid = assertHubId(args.hubId);
      if (typeof hid === "object") return hid;
      const dock = assertDock(args.dockId);
      if (typeof dock === "object") return dock;
      const body = { status: String(args.status || "").slice(0, 64) };
      if (args.metadata && typeof args.metadata === "object" && !Array.isArray(args.metadata)) {
        body.metadata = args.metadata;
      }
      return await k4BindingJson(
        env.K4_HUBS,
        `/api/hubs/${hid}/presence/${dock}`,
        { method: "POST", body, headers: hubsWriteHeaders(env) },
        trace
      );
    }
    case "hub_ping": {
      if (!isInternalWrites(env)) return { error: "writes_disabled" };
      const hid = assertHubId(args.hubId);
      if (typeof hid === "object") return hid;
      const from = assertDock(args.from);
      if (typeof from === "object") return from;
      const to = assertDock(args.to);
      if (typeof to === "object") return to;
      const body = { emoji: typeof args.emoji === "string" ? args.emoji : "\u{1F49A}" };
      return await k4BindingJson(
        env.K4_HUBS,
        `/api/hubs/${hid}/ping/${from}/${to}`,
        { method: "POST", body, headers: hubsWriteHeaders(env) },
        trace
      );
    }
    default:
      return { error: "unknown_tool", name };
  }
}

async function handleToolCalls(out, env, trace, messages, model) {
  const toolCalls = out?.tool_calls || out?.response?.tool_calls;
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) return null;
  const assistantMsg = {
    role: "assistant",
    content: typeof out?.response === "string" ? out.response : typeof out?.content === "string" ? out.content : "",
    tool_calls: toolCalls.map((tc) => ({
      id: tc.id,
      type: "function",
      function: {
        name: tc.function?.name ?? tc.name,
        arguments: tc.function?.arguments ?? tc.arguments ?? "{}"
      }
    }))
  };
  messages.push(assistantMsg);
  for (const tc of toolCalls) {
    const fn = tc.function || tc;
    const name = fn.name || tc.name;
    let argStr = fn.arguments || tc.arguments || "{}";
    if (typeof argStr !== "string") argStr = JSON.stringify(argStr);
    let parsed = {};
    try {
      parsed = JSON.parse(argStr);
    } catch {
      parsed = {};
    }
    const result = await executeTool(name, parsed, env, trace);
    const content = scrubForLlm(JSON.stringify(result));
    messages.push({
      role: "tool",
      tool_call_id: tc.id,
      content: truncate(content, 12e3)
    });
  }
  return await env.AI.run(model, { messages, tools: toolsForEnv(env) });
}

async function meshPack(env, trace) {
  const [family, personal, hubs] = await Promise.all([
    k4Fetch(env.K4_CAGE, "/api/mesh", trace),
    k4Fetch(env.K4_PERSONAL, "/api/mesh", trace),
    k4Fetch(env.K4_HUBS, "/api/hubs", trace)
  ]);
  return { family, personal, hubs };
}

async function runAgent(messages, model, env, trace) {
  let out;
  try {
    out = await env.AI.run(model, { messages, tools: toolsForEnv(env) });
  } catch {
    let pack;
    try {
      pack = await meshPack(env, trace);
    } catch {
      pack = { error: "mesh_pack_failed" };
    }
    const packStr = scrubForLlm(truncate(JSON.stringify(pack), 1e4));
    const sys = messages[0];
    const rest = messages.slice(1);
    const boosted = [
      {
        role: "system",
        content: `${sys.content}

[Mesh snapshot \u2014 use as facts; do not invent beyond this JSON]
${packStr}`
      },
      ...rest
    ];
    out = await env.AI.run(model, { messages: boosted });
  }
  for (let i = 0; i < 5; i++) {
    const next = await handleToolCalls(out, env, trace, messages, model);
    if (!next) break;
    out = next;
  }
  if (typeof out === "string") return { text: out, raw: null };
  const text = out?.response ?? out?.result?.response ?? (typeof out?.content === "string" ? out.content : JSON.stringify(out));
  return { text: scrubForLlm(String(text)), raw: out };
}

var AgentSession = class extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
  }
  async fetch(request) {
    const url = new URL(request.url);
    const storage = this.ctx.storage;
    if (request.method === "GET" && url.pathname === "/messages") {
      const raw = await storage.get("messages");
      return json(JSON.parse(raw || "[]"));
    }
    if (request.method === "POST" && url.pathname === "/messages") {
      const body = await request.json();
      const list = JSON.parse(await storage.get("messages") || "[]");
      const add = body.add || [];
      for (const m of add) {
        if (m && typeof m.content === "string" && m.content.length < 32e3) {
          list.push({ role: m.role || "user", content: m.content });
        }
      }
      while (list.length > 40) list.shift();
      await storage.put("messages", JSON.stringify(list));
      return json({ ok: true, count: list.length });
    }
    if (request.method === "POST" && url.pathname === "/reset") {
      await storage.delete("messages");
      return json({ ok: true });
    }
    return new Response("not found", { status: 404 });
  }
};

async function loadMessages(env, sessionKey) {
  const id = env.AGENT_SESSION.idFromName(sessionKey);
  const stub = env.AGENT_SESSION.get(id);
  const r = await stub.fetch(new Request("https://do/messages", { method: "GET" }));
  return await r.json();
}

async function appendMessages(env, sessionKey, add) {
  const id = env.AGENT_SESSION.idFromName(sessionKey);
  const stub = env.AGENT_SESSION.get(id);
  await stub.fetch(
    new Request("https://do/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ add })
    })
  );
}

var index_default = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    const trace = request.headers.get("X-P31-Trace") || crypto.randomUUID();
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";
    if ((path === "/health" || path === "/api/health") && request.method === "GET") {
      return json({
        ok: true,
        service: "p31-agent-hub",
        ts: new Date().toISOString(),
        release: env.RELEASE_CHANNEL || "public",
        model: env.WORKERS_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct",
        bindings: {
          k4_cage: Boolean(env.K4_CAGE),
          k4_personal: Boolean(env.K4_PERSONAL),
          k4_hubs: Boolean(env.K4_HUBS),
          ai: Boolean(env.AI)
        },
        writes_enabled: isInternalWrites(env)
      });
    }
    if (path === "/api/tools" && request.method === "GET") {
      const err = authError(request, env);
      if (err) return err;
      return json({
        release: env.RELEASE_CHANNEL || "public",
        writes_enabled: isInternalWrites(env),
        tools: toolsForEnv(env).map((t) => t.function.name)
      });
    }
    if (path === "/api/chat" && request.method === "POST") {
      const err = authError(request, env);
      if (err) return err;
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "invalid_json" }, 400);
      }
      const message = typeof body.message === "string" ? body.message.trim() : "";
      if (!message) return json({ error: "message_required" }, 400);
      const sessionKey = typeof body.session === "string" && body.session.length < 200 ? body.session : "anon";
      const model = env.WORKERS_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct";
      let history = [];
      try {
        history = await loadMessages(env, sessionKey);
      } catch {
        history = [];
      }
      const system = {
        role: "system",
        content: scrubForLlm(`You are the P31 edge agent for the K₄ mesh fleet.
Rules:
- Use tools to fetch live mesh data when answering factual questions about topology, hubs, or presence.
- Never invent vertex names beyond family cage (will, sj, wj, christyn) and personal pillars (a, b, c, d).
- Do not print long raw JSON unless the user asks; summarize clearly.
- Children's names: use initials S.J. and W.J. only if needed; do not use full names.
- Release channel: ${env.RELEASE_CHANNEL || "public"}.${isInternalWrites(env) ? " Write tools to k4-hubs (create hub, bind/unbind docks, presence, ping) are enabled; use only when the operator asked for a mutation." : " Read-only mesh/hubs tools only; do not claim you changed hub state."}`)
      };
      const userMsg = { role: "user", content: scrubForLlm(message) };
      const messages = [system, ...history.map((m) => ({ role: m.role, content: m.content })), userMsg];
      let result;
      try {
        result = await runAgent(messages, model, env, trace);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return json({ error: "ai_failed", message: msg, trace }, 502);
      }
      try {
        await appendMessages(env, sessionKey, [
          userMsg,
          { role: "assistant", content: result.text }
        ]);
      } catch {
      }
      return json({
        reply: result.text,
        trace,
        session: sessionKey,
        model
      });
    }
    return json(
      {
        service: "p31-agent-hub",
        routes: ["GET /api/health", "GET /api/tools", "POST /api/chat"],
        docs: "software/p31-agent-hub/README.md"
      },
      404
    );
  }
};

export { AgentSession, index_default as default };