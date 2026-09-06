/**
 * KV layout for K₄ Hubs — dedicated prefix k4s:hub:{hubId}:*
 * Binding name: K4_HUBS (dedicated namespace).
 */
import { EDGES_SUB, edgeKeySub } from './scopes.js';

export const HUB_REGISTRY_KEY = 'meta:hubs';
export const HUB_DOCK_IDS = ['a', 'b', 'c', 'd'];

const STALE_MS = 5 * 60 * 1000;

/** @param {string} hubId */
export function hubManifestKey(hubId) {
  return `k4s:hub:${hubId}:manifest`;
}

/** @param {string} hubId @param {string} dockId */
export function hubVertexKey(hubId, dockId) {
  return `k4s:hub:${hubId}:v:${dockId}`;
}

/** @param {string} hubId @param {string} v1 @param {string} v2 */
export function hubEdgeKey(hubId, v1, v2) {
  return `k4s:hub:${hubId}:e:${edgeKeySub(v1, v2)}`;
}

/** @param {string} hubId @param {string} dockId */
export function hubBindingKey(hubId, dockId) {
  return `k4s:hub:${hubId}:dock:${dockId}`;
}

/** @param {{ K4_HUBS: KVNamespace }} env */
export async function listHubIds(env) {
  const raw = await env.K4_HUBS.get(HUB_REGISTRY_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** @param {{ K4_HUBS: KVNamespace }} env */
export async function registerHubId(env, hubId) {
  const ids = new Set(await listHubIds(env));
  ids.add(hubId);
  await env.K4_HUBS.put(HUB_REGISTRY_KEY, JSON.stringify([...ids].sort()));
}

/** @param {{ K4_HUBS: KVNamespace }} env */
export async function getManifest(env, hubId) {
  const raw = await env.K4_HUBS.get(hubManifestKey(hubId));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** @param {{ K4_HUBS: KVNamespace }} env */
export async function putManifest(env, hubId, manifest) {
  await env.K4_HUBS.put(hubManifestKey(hubId), JSON.stringify(manifest));
  await registerHubId(env, hubId);
}

/** @param {{ K4_HUBS: KVNamespace }} env */
export async function getVertexHub(env, hubId, id) {
  const raw = await env.K4_HUBS.get(hubVertexKey(hubId, id));
  if (!raw) {
    return {
      id,
      name: id,
      scope: `hub:${hubId}`,
      love: 0,
      status: 'offline',
      lastSeen: null,
      heartbeat: null,
      metadata: {},
    };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {
      id,
      name: id,
      scope: `hub:${hubId}`,
      love: 0,
      status: 'offline',
      lastSeen: null,
      heartbeat: null,
      metadata: {},
    };
  }
}

/** @param {{ K4_HUBS: KVNamespace }} env */
export async function setVertexHub(env, hubId, id, data) {
  await env.K4_HUBS.put(hubVertexKey(hubId, id), JSON.stringify(data));
}

/** @param {{ K4_HUBS: KVNamespace }} env */
export async function getEdgeHub(env, hubId, v1, v2) {
  const raw = await env.K4_HUBS.get(hubEdgeKey(hubId, v1, v2));
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
  try {
    return JSON.parse(raw);
  } catch {
    return {
      vertices: [v1, v2],
      key: ek,
      love: 0,
      pings: [],
      lastActivity: null,
      messageCount: 0,
    };
  }
}

/** @param {{ K4_HUBS: KVNamespace }} env */
export async function setEdgeHub(env, hubId, v1, v2, data) {
  await env.K4_HUBS.put(hubEdgeKey(hubId, v1, v2), JSON.stringify(data));
}

/** @param {{ K4_HUBS: KVNamespace }} env */
export async function getBinding(env, hubId, dockId) {
  const raw = await env.K4_HUBS.get(hubBindingKey(hubId, dockId));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** @param {{ K4_HUBS: KVNamespace }} env */
export async function putBinding(env, hubId, dockId, binding) {
  await env.K4_HUBS.put(hubBindingKey(hubId, dockId), JSON.stringify(binding));
}

/** @param {{ K4_HUBS: KVNamespace }} env */
export async function deleteBinding(env, hubId, dockId) {
  await env.K4_HUBS.delete(hubBindingKey(hubId, dockId));
}

/** @param {{ K4_HUBS: KVNamespace }} env */
export async function sweepStaleHub(env, hubId) {
  const now = Date.now();
  const swept = [];
  for (const id of HUB_DOCK_IDS) {
    const v = await getVertexHub(env, hubId, id);
    if (v.heartbeat == null) continue;
    if (now - v.heartbeat <= STALE_MS) continue;
    if (v.status !== 'online' && v.status !== 'away') continue;
    const previousStatus = v.status;
    v.status = 'offline';
    await setVertexHub(env, hubId, id, v);
    swept.push({ id, previousStatus });
  }
  return { swept: swept.length, vertices: swept.map((s) => s.id) };
}

export function isValidDockId(id) {
  return HUB_DOCK_IDS.includes(id);
}

export function isValidHubEdge(v1, v2) {
  if (!isValidDockId(v1) || !isValidDockId(v2) || v1 === v2) return false;
  return EDGES_SUB.some(([a, b]) => (a === v1 && b === v2) || (a === v2 && b === v1));
}

/** Reverse index: which hub docks reference this personalRef (stored in K4_HUBS KV). */
export function dockbackKeyForRef(personalRef) {
  const s = String(personalRef || '').slice(0, 512);
  return `idx:dockback:${s}`;
}

/** @param {{ K4_HUBS: KVNamespace }} env */
export async function getDockbackList(env, personalRef) {
  const raw = await env.K4_HUBS.get(dockbackKeyForRef(personalRef));
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/**
 * @param {{ K4_HUBS: KVNamespace }} env
 * @param {{ hubId: string, dockId: string, mode: string, boundAt: string }} entry
 */
export async function upsertDockbackEntry(env, personalRef, entry) {
  const list = await getDockbackList(env, personalRef);
  const next = list.filter((x) => !(x.hubId === entry.hubId && x.dockId === entry.dockId));
  next.push(entry);
  await env.K4_HUBS.put(dockbackKeyForRef(personalRef), JSON.stringify(next));
}

/** @param {{ K4_HUBS: KVNamespace }} env */
export async function removeDockbackEntry(env, personalRef, hubId, dockId) {
  const list = await getDockbackList(env, personalRef);
  const next = list.filter((x) => !(x.hubId === hubId && x.dockId === dockId));
  const key = dockbackKeyForRef(personalRef);
  if (next.length === 0) await env.K4_HUBS.delete(key);
  else await env.K4_HUBS.put(key, JSON.stringify(next));
}

/** @param {{ K4_HUBS: KVNamespace }} env */
export async function unregisterHubId(env, hubId) {
  const ids = await listHubIds(env);
  const next = ids.filter((id) => id !== hubId);
  await env.K4_HUBS.put(HUB_REGISTRY_KEY, JSON.stringify(next));
}

/**
 * Remove dockback index entries, delete all hub keys, drop hub id from registry.
 * @param {{ K4_HUBS: KVNamespace }} env
 */
export async function deleteHubCompletely(env, hubId) {
  for (const dockId of HUB_DOCK_IDS) {
    const b = await getBinding(env, hubId, dockId);
    if (b?.personalRef) {
      await removeDockbackEntry(env, b.personalRef, hubId, dockId);
    }
  }
  await env.K4_HUBS.delete(hubManifestKey(hubId));
  for (const d of HUB_DOCK_IDS) {
    await env.K4_HUBS.delete(hubVertexKey(hubId, d));
    await env.K4_HUBS.delete(hubBindingKey(hubId, d));
  }
  for (const [v1, v2] of EDGES_SUB) {
    await env.K4_HUBS.delete(hubEdgeKey(hubId, v1, v2));
  }
  await unregisterHubId(env, hubId);
}
