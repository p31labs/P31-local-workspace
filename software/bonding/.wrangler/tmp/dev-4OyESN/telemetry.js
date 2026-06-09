var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-ZigYGO/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// worker/telemetry.ts
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
function corsResponse(body, status = 200, extra) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...extra }
  });
}
__name(corsResponse, "corsResponse");
function optionsResponse() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
__name(optionsResponse, "optionsResponse");
async function sha256(data) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256, "sha256");
async function recomputeChainHash(events) {
  let hash = "";
  for (const ev of events) {
    const canonical = JSON.stringify({ seq: ev.seq, type: ev.type, payload: ev.payload, ts: ev.ts });
    hash = await sha256(hash + canonical);
  }
  return hash;
}
__name(recomputeChainHash, "recomputeChainHash");
function sessionDataKey(sessionId) {
  return `session_data:${sessionId}`;
}
__name(sessionDataKey, "sessionDataKey");
function sessionRoomKey(roomCode, sessionId) {
  return `session:${roomCode}:${sessionId}`;
}
__name(sessionRoomKey, "sessionRoomKey");
function sealKey(sessionId) {
  return `seal:${sessionId}`;
}
__name(sealKey, "sealKey");
async function handleTelemetryFlush(req, env) {
  let body;
  try {
    body = await req.json();
  } catch {
    return corsResponse(JSON.stringify({ error: "Invalid JSON" }), 400);
  }
  const { sessionId, playerId, roomCode, events } = body;
  if (!sessionId || !playerId || !Array.isArray(events)) {
    return corsResponse(JSON.stringify({ error: "Missing fields" }), 400);
  }
  const existing = await env.TELEMETRY_KV.get(sessionDataKey(sessionId), "json") ?? [];
  const merged = mergeEvents(existing, events);
  await env.TELEMETRY_KV.put(sessionDataKey(sessionId), JSON.stringify(merged), { expirationTtl: 7 * 86400 });
  if (roomCode) {
    await env.TELEMETRY_KV.put(sessionRoomKey(roomCode, sessionId), sessionId, { expirationTtl: 7 * 86400 });
  }
  return corsResponse(JSON.stringify({ ok: true, received: events.length }));
}
__name(handleTelemetryFlush, "handleTelemetryFlush");
async function handleTelemetrySeal(req, env, reqObj) {
  let body;
  try {
    body = await req.json();
  } catch {
    return corsResponse(JSON.stringify({ error: "Invalid JSON" }), 400);
  }
  const { sessionId, playerId, roomCode, entries, clientHash } = body;
  if (!sessionId || !playerId || !Array.isArray(entries)) {
    return corsResponse(JSON.stringify({ error: "Missing fields" }), 400);
  }
  const serverHash = await recomputeChainHash(entries);
  const serverVerified = serverHash === clientHash;
  const seal = {
    sessionId,
    playerId,
    roomCode: roomCode ?? null,
    clientHash,
    serverHash,
    serverVerified,
    eventCount: entries.length,
    sealedAt: Date.now(),
    forensicMetadata: {
      userAgent: reqObj.headers.get("user-agent") ?? void 0,
      ip: reqObj.headers.get("cf-connecting-ip") ?? void 0,
      isOrphan: false
    }
  };
  await env.TELEMETRY_KV.put(sealKey(sessionId), JSON.stringify(seal), { expirationTtl: 365 * 86400 });
  await env.TELEMETRY_KV.put(sessionDataKey(sessionId), JSON.stringify(entries), { expirationTtl: 365 * 86400 });
  if (roomCode) {
    await env.TELEMETRY_KV.put(sessionRoomKey(roomCode, sessionId), sessionId, { expirationTtl: 365 * 86400 });
  }
  return corsResponse(JSON.stringify({ ok: true, serverVerified, serverHash }));
}
__name(handleTelemetrySeal, "handleTelemetrySeal");
async function handleOrphanRecovery(req, env, reqObj) {
  let body;
  try {
    body = await req.json();
  } catch {
    return corsResponse(JSON.stringify({ error: "Invalid JSON" }), 400);
  }
  const { orphanSessionId, playerId, roomCode, events, clientHash } = body;
  if (!orphanSessionId || !playerId || !Array.isArray(events)) {
    return corsResponse(JSON.stringify({ error: "Missing fields" }), 400);
  }
  const serverHash = await recomputeChainHash(events);
  const serverVerified = serverHash === clientHash;
  const seal = {
    sessionId: orphanSessionId,
    playerId,
    roomCode: roomCode ?? null,
    clientHash,
    serverHash,
    serverVerified,
    eventCount: events.length,
    sealedAt: Date.now(),
    forensicMetadata: {
      userAgent: reqObj.headers.get("user-agent") ?? void 0,
      ip: reqObj.headers.get("cf-connecting-ip") ?? void 0,
      isOrphan: true
    }
  };
  await env.TELEMETRY_KV.put(sealKey(orphanSessionId), JSON.stringify(seal), { expirationTtl: 365 * 86400 });
  await env.TELEMETRY_KV.put(sessionDataKey(orphanSessionId), JSON.stringify(events), { expirationTtl: 365 * 86400 });
  if (roomCode) {
    await env.TELEMETRY_KV.put(sessionRoomKey(roomCode, orphanSessionId), orphanSessionId, { expirationTtl: 365 * 86400 });
  }
  return corsResponse(JSON.stringify({ ok: true, recovered: events.length, serverVerified }));
}
__name(handleOrphanRecovery, "handleOrphanRecovery");
async function handleSessionList(roomCode, env) {
  if (!roomCode) {
    return corsResponse(JSON.stringify({ error: "Missing roomCode" }), 400);
  }
  const prefix = `session:${roomCode}:`;
  const listed = await env.TELEMETRY_KV.list({ prefix });
  const sessionIds = listed.keys.map((k) => k.name.slice(prefix.length));
  return corsResponse(JSON.stringify({ roomCode, sessionIds }));
}
__name(handleSessionList, "handleSessionList");
async function handleGetSeal(sessionId, env) {
  const seal = await env.TELEMETRY_KV.get(sealKey(sessionId), "json");
  if (!seal) {
    return corsResponse(JSON.stringify({ error: "Not found" }), 404);
  }
  return corsResponse(JSON.stringify(seal));
}
__name(handleGetSeal, "handleGetSeal");
async function handleGetEntries(sessionId, env) {
  const entries = await env.TELEMETRY_KV.get(sessionDataKey(sessionId), "json");
  if (!entries) {
    return corsResponse(JSON.stringify({ error: "Not found" }), 404);
  }
  return corsResponse(JSON.stringify({ sessionId, entries, count: entries.length }));
}
__name(handleGetEntries, "handleGetEntries");
function mergeEvents(existing, incoming) {
  const seen = new Set(existing.map((e) => e.seq));
  const merged = [...existing];
  for (const ev of incoming) {
    if (!seen.has(ev.seq)) {
      merged.push(ev);
      seen.add(ev.seq);
    }
  }
  return merged.sort((a, b) => a.seq - b.seq);
}
__name(mergeEvents, "mergeEvents");
var telemetry_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const path = url.pathname;
    if (method === "OPTIONS") {
      return optionsResponse();
    }
    if (method === "POST" && path === "/telemetry") {
      return handleTelemetryFlush(request, env);
    }
    if (method === "POST" && path === "/telemetry/seal") {
      return handleTelemetrySeal(request, env, request);
    }
    if (method === "POST" && path === "/telemetry/orphan") {
      return handleOrphanRecovery(request, env, request);
    }
    const sessionsMatch = path.match(/^\/telemetry\/sessions\/([A-Z0-9]{4,8})$/i);
    if (method === "GET" && sessionsMatch) {
      return handleSessionList(sessionsMatch[1], env);
    }
    const sealMatch = path.match(/^\/telemetry\/seal\/(.+)$/);
    if (method === "GET" && sealMatch) {
      return handleGetSeal(sealMatch[1], env);
    }
    const entriesMatch = path.match(/^\/telemetry\/entries\/(.+)$/);
    if (method === "GET" && entriesMatch) {
      return handleGetEntries(entriesMatch[1], env);
    }
    return corsResponse(JSON.stringify({ error: "Not found" }), 404);
  }
};

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-ZigYGO/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = telemetry_default;

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-ZigYGO/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=telemetry.js.map
