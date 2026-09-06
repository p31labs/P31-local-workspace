/**
 * P31 Forge — KV-backed activity log + scan snapshots.
 *
 * Single source of truth for "what did Forge do?" Every publish, scan,
 * and cron firing writes one entry. Dashboards and audit reviews read
 * from the same place.
 *
 * KV layout:
 *   activity:<ts>               -> ActivityEntry (JSON)
 *   activity:index              -> sorted list of timestamp keys (newest first, capped)
 *   scan:grants:seen            -> { "<oppId>": firstSeenISO, ... }
 *   scan:grants:last            -> last scan result (hits, keywords, runAt)
 *
 * All operations are defensive — if env.FORGE_KV isn't bound (local dev,
 * unconfigured deploy), the functions short-circuit and return null/true.
 */

const ACTIVITY_INDEX_KEY = 'activity:index';
const ACTIVITY_INDEX_CAP = 500; // keep newest 500 entries indexed
const GRANTS_SEEN_KEY    = 'scan:grants:seen';
const GRANTS_LAST_KEY    = 'scan:grants:last';

/**
 * @param {any} env
 * @param {{kind: string, channel?: string, ok?: boolean, detail?: any, error?: string, source?: string}} entry
 * @returns {Promise<{id: string, timestamp: string} | null>}
 */
async function logActivity(env, entry) {
  if (!env?.FORGE_KV) return null;
  const timestamp = new Date().toISOString();
  const id = `activity:${timestamp}:${randomSuffix()}`;
  const record = { id, timestamp, ...entry };
  await env.FORGE_KV.put(id, JSON.stringify(record), {
    expirationTtl: 60 * 60 * 24 * 90 // 90 days
  });
  // Update index (newest first, capped)
  const indexRaw = await env.FORGE_KV.get(ACTIVITY_INDEX_KEY);
  const index = indexRaw ? JSON.parse(indexRaw) : [];
  index.unshift(id);
  const capped = index.slice(0, ACTIVITY_INDEX_CAP);
  await env.FORGE_KV.put(ACTIVITY_INDEX_KEY, JSON.stringify(capped));
  return { id, timestamp };
}

async function listActivity(env, { limit = 50, kind = null } = {}) {
  if (!env?.FORGE_KV) return { entries: [], bound: false };
  const indexRaw = await env.FORGE_KV.get(ACTIVITY_INDEX_KEY);
  const index = indexRaw ? JSON.parse(indexRaw) : [];
  const ids = index.slice(0, Math.min(limit * 3, index.length)); // overfetch for kind filter
  const entries = [];
  for (const id of ids) {
    const raw = await env.FORGE_KV.get(id);
    if (!raw) continue;
    const entry = JSON.parse(raw);
    if (kind && entry.kind !== kind) continue;
    entries.push(entry);
    if (entries.length >= limit) break;
  }
  return { entries, bound: true, total: index.length };
}

/**
 * Given fresh grants.gov scan hits, return the subset that is genuinely new
 * (never seen in a prior scan) and persist the updated seen-set.
 */
async function diffGrants(env, hits) {
  if (!env?.FORGE_KV) {
    // Without KV, everything is "new"
    return { newHits: hits, firstScan: true };
  }
  const seenRaw = await env.FORGE_KV.get(GRANTS_SEEN_KEY);
  const seen = seenRaw ? JSON.parse(seenRaw) : {};
  const firstScan = Object.keys(seen).length === 0;
  const now = new Date().toISOString();
  const newHits = [];
  for (const h of hits) {
    if (!seen[h.id]) {
      seen[h.id] = now;
      newHits.push(h);
    }
  }
  await env.FORGE_KV.put(GRANTS_SEEN_KEY, JSON.stringify(seen));
  return { newHits, firstScan };
}

async function saveLastGrantsScan(env, summary) {
  if (!env?.FORGE_KV) return;
  await env.FORGE_KV.put(GRANTS_LAST_KEY, JSON.stringify({
    ...summary,
    runAt: new Date().toISOString()
  }));
}

async function getLastGrantsScan(env) {
  if (!env?.FORGE_KV) return null;
  const raw = await env.FORGE_KV.get(GRANTS_LAST_KEY);
  return raw ? JSON.parse(raw) : null;
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

module.exports = {
  logActivity,
  listActivity,
  diffGrants,
  saveLastGrantsScan,
  getLastGrantsScan
};
