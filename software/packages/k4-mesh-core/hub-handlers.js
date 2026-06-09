/**
 * HTTP handlers for K₄ Hubs Worker.
 * Expects env.K4_HUBS; optional env.PERSONAL_MESH_URL for mirror fetch.
 */
import { json, err } from './http.js';
import { parseJsonObjectBody, sanitizeEmoji, sanitizeStatus, sanitizeMetadata } from './personal-body.js';
import { buildHubMeshPayload } from './hub-mesh.js';
import { dispatchHubPingRelay, validateRelayUrl } from './hub-live-relay.js';
import {
  HUB_REGISTRY_KEY,
  getManifest,
  putManifest,
  getVertexHub,
  setVertexHub,
  getEdgeHub,
  setEdgeHub,
  getBinding,
  putBinding,
  deleteBinding,
  listHubIds,
  isValidDockId,
  isValidHubEdge,
  upsertDockbackEntry,
  removeDockbackEntry,
  getDockbackList,
  deleteHubCompletely,
} from './hub-store.js';

const BIND_MODES = new Set(['mirror', 'live', 'vault']);

function reqHeaders(ctx) {
  return ctx?.requestId ? { 'X-Request-ID': ctx.requestId } : {};
}

/**
 * @param {Record<string, unknown>} env
 */
export function createPersonalMirrorFetcher(env) {
  const base = String(env.PERSONAL_MESH_URL || 'https://k4-personal.trimtab-signal.workers.dev').replace(
    /\/$/,
    '',
  );
  return async (/** @type {string} */ ref) => {
    const s = String(ref || '');
    if (s.startsWith('vault:')) return { mode: 'vault', opaque: true };
    if (!(s === 'personal:default' || s === 'personal' || s.startsWith('personal:'))) {
      return null;
    }
    try {
      const res = await fetch(`${base}/api/mesh`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return { upstreamStatus: res.status };
      return await res.json();
    } catch (e) {
      return { fetchError: e instanceof Error ? e.message : String(e) };
    }
  };
}

/**
 * @param {Record<string, unknown>} env
 * @param {string} requestUrl
 * @param {{ requestId?: string }} [ctx]
 */
export async function hubsListGet(env, requestUrl, ctx = {}) {
  const ids = await listHubIds(env);
  const o = new URL(requestUrl);
  const origin = o.origin;
  const hubs = [];
  for (const id of ids) {
    const m = await getManifest(env, id);
    if (m) {
      hubs.push({
        hubId: id,
        kind: m.kind,
        title: m.title,
        created: m.created,
      });
    }
  }
  return json({ service: 'k4-hubs', count: hubs.length, hubs, index: `${origin}/api/hubs` }, 200, reqHeaders(ctx));
}

/**
 * @param {Record<string, unknown>} env
 * @param {Request} request
 * @param {{ requestId?: string }} [ctx]
 */
export async function hubsCreatePost(env, request, ctx = {}) {
  const rid = ctx.requestId;
  const parsed = await parseJsonObjectBody(request);
  if (!parsed.ok) {
    return err(parsed.message, parsed.status, { code: 'INVALID_BODY', requestId: rid });
  }
  const body = parsed.value;
  const kind = typeof body.kind === 'string' && body.kind.trim() ? body.kind.trim().slice(0, 64) : 'general';
  const title =
    typeof body.title === 'string' ? body.title.trim().slice(0, 200) : '';
  const dl = body.dockLabels && typeof body.dockLabels === 'object' && !Array.isArray(body.dockLabels) ? body.dockLabels : {};
  const hubId = crypto.randomUUID();
  const manifest = {
    hubId,
    kind,
    title,
    created: new Date().toISOString(),
    dockLabels: {
      a: typeof dl.a === 'string' ? dl.a.slice(0, 64) : 'a',
      b: typeof dl.b === 'string' ? dl.b.slice(0, 64) : 'b',
      c: typeof dl.c === 'string' ? dl.c.slice(0, 64) : 'c',
      d: typeof dl.d === 'string' ? dl.d.slice(0, 64) : 'd',
    },
    policyVersion: 1,
  };
  await putManifest(env, hubId, manifest);
  return json({ hub: manifest, created: true }, 201, reqHeaders(ctx));
}

/**
 * @param {Record<string, unknown>} env
 * @param {string|null|undefined} personalRefQuery
 * @param {{ requestId?: string }} [ctx]
 */
/**
 * @param {Record<string, unknown>} env
 * @param {string} hubId
 * @param {{ requestId?: string }} [ctx]
 */
export async function hubDeleteDelete(env, hubId, ctx = {}) {
  const rid = ctx.requestId;
  const m = await getManifest(env, hubId);
  if (!m) return err('Hub not found', 404, { code: 'NOT_FOUND', requestId: rid });
  await deleteHubCompletely(env, hubId);
  return json({ hubId, deleted: true }, 200, reqHeaders(ctx));
}

export async function hubDockbackGet(env, personalRefQuery, ctx = {}) {
  const rid = ctx.requestId;
  const ref = String(personalRefQuery || '').trim().slice(0, 512);
  if (!ref) {
    return err('Query parameter ref is required', 400, { code: 'MISSING_REF', requestId: rid });
  }
  const dockbacks = await getDockbackList(env, ref);
  return json({ personalRef: ref, count: dockbacks.length, dockbacks }, 200, reqHeaders(ctx));
}

/**
 * @param {Record<string, unknown>} env
 * @param {string} hubId
 * @param {{ requestId?: string }} [ctx]
 */
export async function hubManifestGet(env, hubId, ctx = {}) {
  const rid = ctx.requestId;
  const m = await getManifest(env, hubId);
  if (!m) return err('Hub not found', 404, { code: 'NOT_FOUND', requestId: rid });

  const bindings = {};
  for (const dock of ['a', 'b', 'c', 'd']) {
    bindings[dock] = await getBinding(env, hubId, dock);
  }
  return json({ manifest: m, bindings }, 200, reqHeaders(ctx));
}

/**
 * @param {Record<string, unknown>} env
 * @param {string} hubId
 * @param {string} requestUrl
 * @param {{ requestId?: string }} [ctx]
 */
export async function hubMeshGet(env, hubId, requestUrl, ctx = {}) {
  const rid = ctx.requestId;
  const m = await getManifest(env, hubId);
  if (!m) return err('Hub not found', 404, { code: 'NOT_FOUND', requestId: rid });

  const fetchPersonalMirror = createPersonalMirrorFetcher(env);
  const payload = await buildHubMeshPayload(env, hubId, requestUrl, {
    fetchPersonalMirror,
  });
  payload.manifest = { kind: m.kind, title: m.title, dockLabels: m.dockLabels };
  return json(payload, 200, reqHeaders(ctx));
}

/**
 * @param {Record<string, unknown>} env
 * @param {Request} request
 * @param {string} hubId
 * @param {string} dockId
 * @param {{ requestId?: string }} [ctx]
 */
export async function hubDockBindPost(env, request, hubId, dockId, ctx = {}) {
  const rid = ctx.requestId;
  if (!(await getManifest(env, hubId))) {
    return err('Hub not found', 404, { code: 'NOT_FOUND', requestId: rid });
  }
  if (!isValidDockId(dockId)) {
    return err('Invalid dock (use a, b, c, d)', 400, { code: 'INVALID_DOCK', requestId: rid });
  }

  const parsed = await parseJsonObjectBody(request);
  if (!parsed.ok) {
    return err(parsed.message, parsed.status, { code: 'INVALID_BODY', requestId: rid });
  }
  const body = parsed.value;
  const personalRef =
    typeof body.personalRef === 'string' && body.personalRef.trim()
      ? body.personalRef.trim().slice(0, 512)
      : 'personal:default';
  const mode = typeof body.mode === 'string' ? body.mode.trim().toLowerCase() : 'mirror';
  if (!BIND_MODES.has(mode)) {
    return err('Invalid mode (mirror, live, vault)', 400, { code: 'INVALID_MODE', requestId: rid });
  }

  const binding = {
    personalRef,
    mode,
    boundAt: new Date().toISOString(),
  };
  await putBinding(env, hubId, dockId, binding);
  await upsertDockbackEntry(env, personalRef, {
    hubId,
    dockId,
    mode,
    boundAt: binding.boundAt,
  });
  return json({ hubId, dockId, binding }, 200, reqHeaders(ctx));
}

/**
 * @param {Record<string, unknown>} env
 * @param {string} hubId
 * @param {string} dockId
 * @param {{ requestId?: string }} [ctx]
 */
export async function hubDockUnbindPost(env, hubId, dockId, ctx = {}) {
  const rid = ctx.requestId;
  if (!(await getManifest(env, hubId))) {
    return err('Hub not found', 404, { code: 'NOT_FOUND', requestId: rid });
  }
  if (!isValidDockId(dockId)) {
    return err('Invalid dock (use a, b, c, d)', 400, { code: 'INVALID_DOCK', requestId: rid });
  }
  const prev = await getBinding(env, hubId, dockId);
  await deleteBinding(env, hubId, dockId);
  if (prev?.personalRef) {
    await removeDockbackEntry(env, prev.personalRef, hubId, dockId);
  }
  return json({ hubId, dockId, unbound: true }, 200, reqHeaders(ctx));
}

/**
 * @param {Record<string, unknown>} env
 * @param {Request} request
 * @param {string} hubId
 * @param {string} dockId
 * @param {{ requestId?: string }} [ctx]
 */
export async function hubPresencePost(env, request, hubId, dockId, ctx = {}) {
  const rid = ctx.requestId;
  if (!(await getManifest(env, hubId))) {
    return err('Hub not found', 404, { code: 'NOT_FOUND', requestId: rid });
  }
  if (!isValidDockId(dockId)) {
    return err('Invalid dock', 400, { code: 'INVALID_DOCK', requestId: rid });
  }

  const parsed = await parseJsonObjectBody(request);
  if (!parsed.ok) {
    return err(parsed.message, parsed.status, { code: 'INVALID_BODY', requestId: rid });
  }
  const body = parsed.value;
  const vertex = await getVertexHub(env, hubId, dockId);
  vertex.status = sanitizeStatus(body.status);
  vertex.lastSeen = new Date().toISOString();
  vertex.heartbeat = Date.now();
  const meta = sanitizeMetadata(body.metadata);
  if (meta) vertex.metadata = { ...(vertex.metadata || {}), ...meta };
  await setVertexHub(env, hubId, dockId, vertex);
  return json({ vertex, scope: 'hub', hubId, dockId }, 200, reqHeaders(ctx));
}

/**
 * @param {Record<string, unknown>} env
 * @param {Request} request
 * @param {string} hubId
 * @param {string} from
 * @param {string} to
 * @param {{ requestId?: string }} [ctx]
 */
/**
 * @param {{ waitUntil?: (p: Promise<unknown>) => void } | null} [executionCtx] Cloudflare execution context for async relay
 */
export async function hubPingPost(env, request, hubId, from, to, ctx = {}, executionCtx = null) {
  const rid = ctx.requestId;
  if (!(await getManifest(env, hubId))) {
    return err('Hub not found', 404, { code: 'NOT_FOUND', requestId: rid });
  }
  if (!isValidHubEdge(from, to)) {
    return err('Invalid hub edge', 400, { code: 'INVALID_EDGE', requestId: rid });
  }

  const parsed = await parseJsonObjectBody(request);
  if (!parsed.ok) {
    return err(parsed.message, parsed.status, { code: 'INVALID_BODY', requestId: rid });
  }
  const body = parsed.value;
  const emoji = sanitizeEmoji(body.emoji);

  const edge = await getEdgeHub(env, hubId, from, to);
  const fromVertex = await getVertexHub(env, hubId, from);
  const toVertex = await getVertexHub(env, hubId, to);

  const ping = {
    from,
    to,
    emoji,
    timestamp: new Date().toISOString(),
    id: crypto.randomUUID(),
  };

  edge.pings = [ping, ...(edge.pings || [])].slice(0, 50);
  edge.love = (edge.love || 0) + 1;
  edge.lastActivity = ping.timestamp;
  edge.messageCount = (edge.messageCount || 0) + 1;

  fromVertex.love = (fromVertex.love || 0) + 1;
  toVertex.love = (toVertex.love || 0) + 1;

  await setEdgeHub(env, hubId, from, to, edge);
  await setVertexHub(env, hubId, from, fromVertex);
  await setVertexHub(env, hubId, to, toVertex);

  /** @type {{ queued: boolean, target?: string, mode?: string } | null} */
  let relay = null;
  const relayUrl = env.HUB_LIVE_RELAY_URL;
  const relayValid = relayUrl ? validateRelayUrl(relayUrl) : { ok: false };
  if (relayValid.ok && executionCtx?.waitUntil) {
    const bf = await getBinding(env, hubId, from);
    const bt = await getBinding(env, hubId, to);
    if (bf?.mode === 'live' || bt?.mode === 'live') {
      const secret = env.HUB_LIVE_RELAY_SECRET;
      const payload = {
        event: 'hub_ping',
        hubId,
        ping,
        edge: { love: edge.love, lastActivity: edge.lastActivity },
      };
      relay = {
        queued: true,
        mode: 'async',
        target: new URL(relayValid.href).origin,
      };
      executionCtx.waitUntil(
        dispatchHubPingRelay(relayUrl, secret, payload, (level, code, detail) => {
          const line = `[hub-live-relay] ${code}`;
          if (level === 'error') console.error(line, detail ?? '');
          else console.warn(line, detail ?? '');
        }),
      );
    }
  }

  return json(
    {
      ping,
      edge: { love: edge.love, lastActivity: edge.lastActivity },
      hubId,
      scope: 'hub',
      ...(relay ? { relay } : {}),
    },
    200,
    reqHeaders(ctx),
  );
}

/**
 * @param {Record<string, unknown>} env
 * @param {{ requestId?: string }} [ctx]
 */
export async function hubHealthGet(env, ctx = {}) {
  let kv = 'ok';
  try {
    await env.K4_HUBS.get(HUB_REGISTRY_KEY);
  } catch {
    kv = 'error';
  }
  const ok = kv === 'ok';
  const writeAuth =
    env.HUBS_WRITE_TOKEN != null && String(env.HUBS_WRITE_TOKEN).length > 0 ? 'required' : 'open';
  const rlRaw = env.RATE_LIMIT_POST_PER_MIN;
  const rateLimitWritesPerMin =
    rlRaw === undefined || rlRaw === '' ? 240 : Number(rlRaw);
  return json(
    {
      ok,
      service: 'k4-hubs',
      workerVersion: env.WORKER_VERSION || '1.0.0',
      checks: { kv },
      auth: { write: writeAuth },
      integrations: {
        personal_mesh_url: String(
          env.PERSONAL_MESH_URL || 'https://k4-personal.trimtab-signal.workers.dev',
        ).replace(/\/$/, ''),
      },
      features: {
        live_ping_relay: validateRelayUrl(env.HUB_LIVE_RELAY_URL).ok,
      },
      limits: {
        write_requests_per_ip_per_minute: Number.isFinite(rateLimitWritesPerMin) ? rateLimitWritesPerMin : 240,
      },
      timestamp: new Date().toISOString(),
    },
    ok ? 200 : 503,
    reqHeaders(ctx),
  );
}

/**
 * @param {{ requestId?: string }} [ctx]
 */
export function hubRouteIndex(ctx = {}) {
  return json(
    {
      service: 'k4-hubs',
      package: '@p31/k4-mesh-core',
      routes: [
        { method: 'GET', path: '/api', desc: 'This index' },
        { method: 'GET', path: '/api/health', desc: 'Liveness + KV + auth mode' },
        { method: 'GET', path: '/viz', desc: 'Hub list (add ?id=hubUuid for one hub viz)' },
        { method: 'GET', path: '/api/dockback', desc: 'Reverse index: ?ref=personal:default' },
        { method: 'GET', path: '/api/hubs', desc: 'List hubs' },
        { method: 'POST', path: '/api/hubs', desc: 'Create hub (needs write token if HUBS_WRITE_TOKEN set)' },
        { method: 'GET', path: '/api/hubs/:id', desc: 'Manifest + bindings' },
        { method: 'GET', path: '/api/hubs/:id/mesh', desc: 'Hub K₄ + docks (mirror fetch to personal when bound)' },
        { method: 'POST', path: '/api/hubs/:id/dock/:dockId/bind', desc: 'Bind dock (auth if token set)' },
        { method: 'POST', path: '/api/hubs/:id/dock/:dockId/unbind', desc: 'Unbind dock (auth if token set)' },
        { method: 'POST', path: '/api/hubs/:id/presence/:dockId', desc: 'Hub dock presence (auth if token set)' },
        { method: 'POST', path: '/api/hubs/:id/ping/:from/:to', desc: 'Hub edge ping; live relay if HUB_LIVE_RELAY_URL + live dock' },
        { method: 'DELETE', path: '/api/hubs/:id', desc: 'Delete hub (dockbacks + KV; auth + rate limit if configured)' },
      ],
    },
    200,
    reqHeaders(ctx),
  );
}
