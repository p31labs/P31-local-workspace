/**
 * Sierpiński-style nested K₄ scopes — depth 0 (family root) through depth 4 (max segments > 3).
 * Root family: vertices will | sj | wj | christyn
 * Nested / personal: vertices a | b | c | d (complete graph each level)
 *
 * KV: expects binding `K4_MESH` on env (namespace differs per Worker in wrangler.toml).
 */

export const PHASE_SIERPINSKI = 4;
/** Max path segments (e.g. will/a/b/c/d = 5 → >3 levels of nested K₄ under a person). */
export const MAX_DEPTH = 5;
export const SUB_VERTICES = ['a', 'b', 'c', 'd'];

const FAMILY = new Set(['will', 'sj', 'wj', 'christyn']);

export const EDGES_SUB = [
  ['a', 'b'],
  ['a', 'c'],
  ['a', 'd'],
  ['b', 'c'],
  ['b', 'd'],
  ['c', 'd'],
];

export function edgeKeySub(v1, v2) {
  return [v1, v2].sort().join('-');
}

/** Normalize to internal path: empty string = root family; "personal"; "will"; "will/a/b" */
export function normalizeScopePath(raw) {
  if (raw == null || raw === '') return '';
  let s = String(raw).trim().replace(/^\/+|\/+$/g, '');
  if (s === 'root' || s === 'family') return '';
  if (s === 'personal') return 'personal';
  const parts = s.split('/').filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length > MAX_DEPTH) return null;
  if (parts[0] === 'personal') {
    if (parts.length > 1) return null;
    return 'personal';
  }
  if (!FAMILY.has(parts[0])) return null;
  for (let i = 1; i < parts.length; i++) {
    if (!SUB_VERTICES.includes(parts[i])) return null;
  }
  return parts.join('/');
}

export function scopeDepth(path) {
  if (path === '' || path === null) return 0;
  if (path === 'personal') return 1;
  return path.split('/').length;
}

export function verticesForScope(path) {
  if (path === '' || path === null) {
    return { labels: ['will', 'sj', 'wj', 'christyn'], mode: 'family' };
  }
  return { labels: [...SUB_VERTICES], mode: path === 'personal' ? 'personal' : 'nested' };
}

export function edgesForScope(path) {
  if (path === '' || path === null) {
    return [
      ['will', 'sj'],
      ['will', 'wj'],
      ['will', 'christyn'],
      ['sj', 'wj'],
      ['sj', 'christyn'],
      ['wj', 'christyn'],
    ];
  }
  return EDGES_SUB;
}

function scopedVertexKey(scopePath, id) {
  const s = scopePath === '' ? 'root' : scopePath.replace(/\//g, ':');
  return `k4s:${s}:v:${id}`;
}

function scopedEdgeKey(scopePath, v1, v2) {
  const s = scopePath === '' ? 'root' : scopePath.replace(/\//g, ':');
  const ek = edgeKeySub(v1, v2);
  return `k4s:${s}:e:${ek}`;
}

function registryKey() {
  return 'meta:scope_registry';
}

export async function registerScope(env, scopePath) {
  const key = registryKey();
  const raw = await env.K4_MESH.get(key);
  const set = raw ? new Set(JSON.parse(raw)) : new Set();
  const tag = scopePath === '' ? 'root' : scopePath;
  if (!set.has(tag)) {
    set.add(tag);
    await env.K4_MESH.put(key, JSON.stringify([...set].sort()));
  }
}

export async function getVertexScoped(env, scopePath, id, { legacyFamily = false } = {}) {
  const sk = scopedVertexKey(scopePath, id);
  let raw = await env.K4_MESH.get(sk);
  if (!raw && legacyFamily && scopePath === '') {
    raw = await env.K4_MESH.get(`vertex:${id}`);
  }
  const { labels, mode } = verticesForScope(scopePath);
  const defaultName = mode === 'family' ? id : id;
  if (!raw) {
    return {
      id,
      name: defaultName,
      scope: scopePath === '' ? 'family' : scopePath,
      love: 0,
      status: 'offline',
      lastSeen: null,
      heartbeat: null,
      metadata: {},
    };
  }
  return JSON.parse(raw);
}

export async function setVertexScoped(env, scopePath, id, data) {
  await env.K4_MESH.put(scopedVertexKey(scopePath, id), JSON.stringify(data));
  await registerScope(env, scopePath);
}

export async function getEdgeScoped(env, scopePath, v1, v2) {
  const raw = await env.K4_MESH.get(scopedEdgeKey(scopePath, v1, v2));
  const ek = edgeKeySub(v1, v2);
  if (!raw) {
    return {
      vertices: [v1, v2],
      key: ek,
      love: 0,
      pings: [],
      lastActivity: null,
      messageCount: 0,
    };
  }
  return JSON.parse(raw);
}

export async function setEdgeScoped(env, scopePath, v1, v2, data) {
  await env.K4_MESH.put(scopedEdgeKey(scopePath, v1, v2), JSON.stringify(data));
  await registerScope(env, scopePath);
}

export function isValidVertexScoped(scopePath, id) {
  const { labels } = verticesForScope(scopePath);
  return labels.includes(id);
}

export function isValidEdgeScoped(scopePath, v1, v2) {
  if (!isValidVertexScoped(scopePath, v1) || !isValidVertexScoped(scopePath, v2) || v1 === v2) return false;
  const edges = edgesForScope(scopePath);
  return edges.some(([a, b]) => (a === v1 && b === v2) || (a === v2 && b === v1));
}

const STALE_MS = 5 * 60 * 1000;

/** Bumped when GET /api/mesh gains new top-level fields (clients may gate on this). */
export const MESH_PAYLOAD_VERSION = '1.1.0';

export async function sweepStaleScoped(env, scopePath) {
  const { labels } = verticesForScope(scopePath);
  const now = Date.now();
  const swept = [];
  for (const id of labels) {
    const v = await getVertexScoped(env, scopePath, id, { legacyFamily: scopePath === '' });
    if (v.heartbeat == null) continue;
    if (now - v.heartbeat <= STALE_MS) continue;
    if (v.status !== 'online' && v.status !== 'away') continue;
    const previousStatus = v.status;
    v.status = 'offline';
    await setVertexScoped(env, scopePath, id, v);
    swept.push({ id, previousStatus });
  }
  return { swept: swept.length, vertices: swept.map((s) => s.id) };
}

export async function buildMeshPayload(env, scopePath, { connectHub } = {}) {
  const { labels, mode } = verticesForScope(scopePath);
  const edges = edgesForScope(scopePath);

  const vertices = {};
  const edgesOut = {};
  let vertexLove = 0;
  let edgeLove = 0;
  let onlineCount = 0;
  let edgesWithRecentPing = 0;
  const activityHorizon = Date.now() - 24 * 60 * 60 * 1000;

  await sweepStaleScoped(env, scopePath);

  for (const v of labels) {
    vertices[v] = await getVertexScoped(env, scopePath, v, { legacyFamily: scopePath === '' });
    vertexLove += vertices[v].love || 0;
    if (vertices[v].status === 'online' || vertices[v].status === 'away') onlineCount += 1;
  }

  for (const [v1, v2] of edges) {
    const key = edgeKeySub(v1, v2);
    edgesOut[key] = await getEdgeScoped(env, scopePath, v1, v2);
    edgeLove += edgesOut[key].love || 0;
    const la = edgesOut[key].lastActivity;
    if (la && new Date(la).getTime() > activityHorizon) edgesWithRecentPing += 1;
  }

  const totalLove = vertexLove + edgeLove;
  const nVert = labels.length;
  const nEdge = edges.length;
  const onlineRatio = nVert > 0 ? onlineCount / nVert : 0;
  const edgeActivityRatio = nEdge > 0 ? edgesWithRecentPing / nEdge : 0;
  const vitalityScore = Math.round(100 * (0.5 * onlineRatio + 0.5 * edgeActivityRatio));

  let registry = null;
  try {
    registry = await listScopes(env);
  } catch {
    registry = { error: 'registry_unavailable' };
  }

  const depth = scopeDepth(scopePath);

  return {
    api: {
      version: MESH_PAYLOAD_VERSION,
      schema: 'p31.k4mesh.payload',
    },
    phase: PHASE_SIERPINSKI,
    topology: 'K4',
    scope: scopePath === '' ? 'family' : scopePath,
    scopeMode: mode,
    depth,
    maxDepth: MAX_DEPTH,
    vertices: 4,
    edges: 6,
    rigidity: 'isostatic',
    betti_2: 1,
    mesh: { vertices, edges: edgesOut },
    connect: connectHub || {},
    love: {
      vertices: vertexLove,
      edges: edgeLove,
      total: totalLove,
    },
    totalLove,
    onlineCount,
    edgeActivity24h: edgesWithRecentPing,
    vitality: {
      score: vitalityScore,
      onlineRatio: Math.round(onlineRatio * 1000) / 1000,
      edgeActivity24hRatio: Math.round(edgeActivityRatio * 1000) / 1000,
    },
    registry,
    staleThresholdMs: STALE_MS,
    timestamp: new Date().toISOString(),
    signature: 'Ca₉(PO₄)₆',
    sierpinski: true,
  };
}

export async function listScopes(env) {
  const raw = await env.K4_MESH.get(registryKey());
  const tags = raw ? JSON.parse(raw) : ['root'];
  return { scopes: tags, count: tags.length };
}
