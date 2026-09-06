/**
 * Fixed-scope personal K₄ (vertices a–d). No family telemetry chain.
 * Used by k4-personal Worker only.
 */
import {
  buildMeshPayload,
  getVertexScoped,
  setVertexScoped,
  getEdgeScoped,
  setEdgeScoped,
  isValidVertexScoped,
  isValidEdgeScoped,
  edgeKeySub,
  edgesForScope,
  PHASE_SIERPINSKI,
  MESH_PAYLOAD_VERSION,
  listScopes,
} from './scopes.js';
import { json, err } from './http.js';
import {
  parseJsonObjectBody,
  sanitizeMetadata,
  sanitizeStatus,
  sanitizeEmoji,
} from './personal-body.js';

export const PERSONAL_SCOPE = 'personal';

/** @typedef {{ requestId?: string }} PersonalCtx */

export function buildPersonalConnectHub(requestUrl) {
  const o = new URL(requestUrl);
  const origin = o.origin;
  return {
    service: 'k4-personal',
    mantra: 'Create & Connect',
    mesh: `${origin}/api/mesh`,
    viz: `${origin}/viz`,
    routes: `${origin}/api`,
    family_cage: 'https://k4-cage.trimtab-signal.workers.dev',
    hubs: 'https://k4-hubs.trimtab-signal.workers.dev',
    hubs_viz: 'https://k4-hubs.trimtab-signal.workers.dev/viz',
    hubs_api: 'https://k4-hubs.trimtab-signal.workers.dev/api',
    carrie_public: 'https://carrie-wellness.trimtab-signal.workers.dev',
    docs: 'https://docs.phosphorus31.org',
    support: 'https://phosphorus31.org/support',
    hub: 'https://p31ca.org',
  };
}

function reqHeaders(ctx) {
  return ctx?.requestId ? { 'X-Request-ID': ctx.requestId } : {};
}

export async function personalMesh(env, requestUrl, ctx = {}) {
  const hub = buildPersonalConnectHub(requestUrl);
  return json(await buildMeshPayload(env, PERSONAL_SCOPE, { connectHub: hub }), 200, reqHeaders(ctx));
}

export async function personalPresence(env, request, id, ctx = {}) {
  const rid = ctx.requestId;
  if (!isValidVertexScoped(PERSONAL_SCOPE, id)) {
    return err('Unknown vertex for personal scope (valid: a, b, c, d)', 400, {
      code: 'INVALID_VERTEX',
      requestId: rid,
    });
  }

  const parsed = await parseJsonObjectBody(request);
  if (!parsed.ok) {
    return err(parsed.message, parsed.status, { code: 'INVALID_BODY', requestId: rid });
  }
  const body = parsed.value;
  const vertex = await getVertexScoped(env, PERSONAL_SCOPE, id, { legacyFamily: false });

  vertex.status = sanitizeStatus(body.status);
  vertex.lastSeen = new Date().toISOString();
  vertex.heartbeat = Date.now();
  const meta = sanitizeMetadata(body.metadata);
  if (meta) vertex.metadata = { ...(vertex.metadata || {}), ...meta };

  await setVertexScoped(env, PERSONAL_SCOPE, id, vertex);

  return json({ vertex, recorded: true, scope: 'personal' }, 200, reqHeaders(ctx));
}

export async function personalPing(env, request, from, to, ctx = {}) {
  const rid = ctx.requestId;
  if (!isValidEdgeScoped(PERSONAL_SCOPE, from, to)) {
    return err('Invalid edge for personal K₄ (vertices a, b, c, d)', 400, {
      code: 'INVALID_EDGE',
      requestId: rid,
    });
  }

  const parsed = await parseJsonObjectBody(request);
  if (!parsed.ok) {
    return err(parsed.message, parsed.status, { code: 'INVALID_BODY', requestId: rid });
  }
  const body = parsed.value;
  const emoji = sanitizeEmoji(body.emoji);
  const edge = await getEdgeScoped(env, PERSONAL_SCOPE, from, to);
  const fromVertex = await getVertexScoped(env, PERSONAL_SCOPE, from, { legacyFamily: false });
  const toVertex = await getVertexScoped(env, PERSONAL_SCOPE, to, { legacyFamily: false });

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

  await setEdgeScoped(env, PERSONAL_SCOPE, from, to, edge);
  await setVertexScoped(env, PERSONAL_SCOPE, from, fromVertex);
  await setVertexScoped(env, PERSONAL_SCOPE, to, toVertex);

  return json(
    {
      ping,
      edge: { love: edge.love, lastActivity: edge.lastActivity },
      fromLove: fromVertex.love,
      toLove: toVertex.love,
      scope: 'personal',
    },
    200,
    reqHeaders(ctx),
  );
}

export async function personalVertexGet(env, id, ctx = {}) {
  const rid = ctx.requestId;
  if (!isValidVertexScoped(PERSONAL_SCOPE, id)) {
    return err('Unknown vertex (valid: a, b, c, d)', 400, { code: 'INVALID_VERTEX', requestId: rid });
  }

  const vertex = await getVertexScoped(env, PERSONAL_SCOPE, id, { legacyFamily: false });
  const connectedEdges = {};
  for (const [v1, v2] of edgesForScope(PERSONAL_SCOPE)) {
    if (v1 === id || v2 === id) {
      const key = edgeKeySub(v1, v2);
      connectedEdges[key] = await getEdgeScoped(env, PERSONAL_SCOPE, v1, v2);
    }
  }

  return json({ vertex, edges: connectedEdges, scope: 'personal' }, 200, reqHeaders(ctx));
}

/**
 * One round-trip: full mesh payload + liveness metadata (for observatory + fat clients).
 * Schema: p31.mesh.snapshot/1.0.0
 */
export async function personalApiSnapshot(env, requestUrl, ctx = {}) {
  const hub = buildPersonalConnectHub(requestUrl);
  const mesh = await buildMeshPayload(env, PERSONAL_SCOPE, { connectHub: hub });
  const workerVersion = env.WORKER_VERSION || '1.0.0';
  let kv = 'ok';
  try {
    await env.K4_MESH.get('meta:scope_registry');
  } catch {
    kv = 'error';
  }
  const ok = kv === 'ok';
  return json(
    {
      schema: 'p31.mesh.snapshot/1.0.0',
      at: new Date().toISOString(),
      service: 'k4-personal',
      workerVersion,
      meshPayloadVersion: MESH_PAYLOAD_VERSION,
      mesh,
      /** Larmor-locked readout: same 863 Hz anchor as hub trim (p31-constants physics.larmorHz). */
      physics: {
        schema: 'p31.meshPhysics/0.1.0',
        larmorReferenceHz: 863,
        note:
          "Classical mesh vitality; not a qubit. PQC app transport: FIPS 203/204 in @p31/quantum-core (separate from this KV state).",
      },
      /** Hermetic echo: p31ca ↑ ↔ Workers ↓ (observatory + curl). */
      mirror: {
        schema: 'p31.mirror/0.1.0',
        asAbove:
          'p31ca static shell, Mesh Observatory, landing/dome HUD (src/lib/mesh/mesh-snapshot.ts)',
        asBelow: 'k4-personal Worker, K4_MESH KV, PersonalAgent Durable Object',
        familyBelow: 'k4-cage Worker (separate request; same K4 face lattice)',
        tag: 'as above, so below <3',
      },
      liveness: {
        ok,
        checks: { kv },
        scope: 'personal',
        topology: 'K4',
        phase: PHASE_SIERPINSKI,
      },
    },
    ok ? 200 : 503,
    reqHeaders(ctx),
  );
}

export async function personalHealth(env, ctx = {}) {
  const workerVersion = env.WORKER_VERSION || '1.0.0';
  let kv = 'ok';
  try {
    await env.K4_MESH.get('meta:scope_registry');
  } catch {
    kv = 'error';
  }
  const ok = kv === 'ok';
  let registry = null;
  if (ok) {
    try {
      registry = await listScopes(env);
    } catch {
      registry = { error: 'registry_unavailable' };
    }
  }
  return json(
    {
      ok,
      service: 'k4-personal',
      workerVersion,
      meshPayloadVersion: MESH_PAYLOAD_VERSION,
      topologyLabel: env.TOPOLOGY || 'K4_PERSONAL',
      scope: 'personal',
      topology: 'K4',
      phase: PHASE_SIERPINSKI,
      vertices: ['a', 'b', 'c', 'd'],
      checks: { kv },
      capabilities: [
        'GET /api/mesh',
        'GET /api/vertex/:id',
        'POST /api/presence/:id',
        'POST /api/ping/:from/:to',
        'GET /viz',
        'GET /u/:user/home',
        'DurableObject /agent/*',
      ],
      registry: registry || { error: 'skipped' },
      note: 'Dedicated Worker + KV; mesh keys k4s:personal:*',
      mirror: {
        schema: 'p31.mirror/0.1.0',
        asAbove: 'p31ca GET /api/* via mesh-snapshot (browser)',
        asBelow: 'k4-personal edge (this service)',
        tag: 'as above, so below <3',
      },
      timestamp: new Date().toISOString(),
    },
    ok ? 200 : 503,
    reqHeaders(ctx),
  );
}

export function personalRouteIndex(ctx = {}) {
  return json({
    service: 'k4-personal',
    package: '@p31/k4-mesh-core',
    meshPayloadVersion: MESH_PAYLOAD_VERSION,
    routes: [
      { method: 'GET', path: '/', desc: 'HTML index' },
      { method: 'GET', path: '/viz', desc: 'Live tetrahedron (pillars a–d)' },
      { method: 'GET', path: '/api', desc: 'Route index (this JSON)' },
      { method: 'GET', path: '/api/mesh', desc: 'Personal K₄ mesh (same shape as cage GET /api/v4/mesh?scope=personal)' },
      { method: 'GET', path: '/api/snapshot', desc: 'Mesh + liveness in one JSON (p31.mesh.snapshot/1.0.0)' },
      { method: 'GET', path: '/api/health', desc: 'Liveness' },
      { method: 'GET', path: '/api/vertex/:id', desc: 'Vertex detail a|b|c|d' },
      { method: 'POST', path: '/api/presence/:id', desc: 'Presence heartbeat' },
      { method: 'POST', path: '/api/ping/:from/:to', desc: 'LOVE ping' },
    ],
  }, 200, reqHeaders(ctx));
}
