/**
 * Hub-scale K₄ mesh payload + optional personal mirror summaries.
 */
import { EDGES_SUB, PHASE_SIERPINSKI, MAX_DEPTH } from './scopes.js';
import {
  sweepStaleHub,
  getVertexHub,
  getEdgeHub,
  getBinding,
  HUB_DOCK_IDS,
} from './hub-store.js';

const STALE_MS = 5 * 60 * 1000;

/**
 * @param {{ K4_HUBS: KVNamespace }} env
 * @param {string} hubId
 * @param {string} requestUrl
 * @param {{ fetchPersonalMirror?: (ref: string) => Promise<Record<string, unknown>|null> }} [opts]
 */
export async function buildHubMeshPayload(env, hubId, requestUrl, opts = {}) {
  const { fetchPersonalMirror } = opts;
  await sweepStaleHub(env, hubId);

  const o = new URL(requestUrl);
  const origin = o.origin;

  const vertices = {};
  const edgesOut = {};
  let totalLove = 0;
  let onlineCount = 0;
  let edgesWithRecentPing = 0;
  const activityHorizon = Date.now() - 24 * 60 * 60 * 1000;

  for (const v of HUB_DOCK_IDS) {
    vertices[v] = await getVertexHub(env, hubId, v);
    totalLove += vertices[v].love || 0;
    if (vertices[v].status === 'online' || vertices[v].status === 'away') onlineCount += 1;
  }

  for (const [v1, v2] of EDGES_SUB) {
    const key = [v1, v2].sort().join('-');
    edgesOut[key] = await getEdgeHub(env, hubId, v1, v2);
    totalLove += edgesOut[key].love || 0;
    const la = edgesOut[key].lastActivity;
    if (la && new Date(la).getTime() > activityHorizon) edgesWithRecentPing += 1;
  }

  /** @type {Record<string, { binding: Record<string, unknown>|null, personalSummary: Record<string, unknown>|null }>} */
  const docks = {};
  for (const dockId of HUB_DOCK_IDS) {
    const binding = await getBinding(env, hubId, dockId);
    let personalSummary = null;
    if (binding && fetchPersonalMirror) {
      const mode = binding.mode;
      const ref = binding.personalRef;
      if (mode === 'mirror' || mode === 'live') {
        personalSummary = await fetchPersonalMirror(ref);
      } else if (mode === 'vault') {
        personalSummary = { mode: 'vault', opaque: true };
      }
    }
    docks[dockId] = {
      binding,
      personalSummary,
    };
  }

  return {
    phase: PHASE_SIERPINSKI,
    topology: 'K4',
    layer: 'hub',
    hubId,
    scopeMode: 'hub',
    depth: 1,
    maxDepth: MAX_DEPTH,
    vertices: 4,
    edges: 6,
    rigidity: 'isostatic',
    betti_2: 1,
    mesh: { vertices, edges: edgesOut },
    docks,
    connect: {
      service: 'k4-hubs',
      self: `${origin}/api/hubs/${hubId}`,
      mesh: `${origin}/api/hubs/${hubId}/mesh`,
      hubs_list: `${origin}/api/hubs`,
      hubs_viz: `${origin}/viz`,
      personal_worker: 'https://k4-personal.trimtab-signal.workers.dev',
      personal_viz: 'https://k4-personal.trimtab-signal.workers.dev/viz',
      cage: 'https://k4-cage.trimtab-signal.workers.dev',
      cage_viz: 'https://k4-cage.trimtab-signal.workers.dev/viz',
    },
    totalLove,
    onlineCount,
    edgeActivity24h: edgesWithRecentPing,
    staleThresholdMs: STALE_MS,
    timestamp: new Date().toISOString(),
    signature: 'Ca₉(PO₄)₆',
    sierpinski: true,
  };
}
