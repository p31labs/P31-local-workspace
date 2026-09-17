/**
 * /api/eye — single aggregator feeding the All-Seeing Eye dashboard.
 * Merges: KV fleet status (cron ping), live surface probes, seed ground truth,
 * K4 mesh, MCP reach, grants, legal countdown, and optional D1 cost telemetry.
 */
import seed from '../status.json';

const PING_TIMEOUT_MS = 4500;
const DAY_MS = 86400000;

const CORE_SURFACES = [
  ['mesh', 'https://mesh.p31ca.org/health'],
  ['k4-cage', 'https://k4-cage.trimtab-signal.workers.dev/health'],
  ['p31-dispatch', 'https://p31-dispatch.trimtab-signal.workers.dev/health'],
  ['p31-passport', 'https://p31-passport.trimtab-signal.workers.dev/health'],
  ['spaceship-relay-mcp', 'https://spaceship-relay.trimtab-signal.workers.dev/mcp'],
  ['portal-willow', 'https://willow.p31ca.org'],
  ['portal-tetra', 'https://tetra.p31ca.org'],
  ['portal-sixseven', 'https://sixseven.p31ca.org'],
  ['portal-meatspace', 'https://meatspace.p31ca.org'],
  ['portal-design', 'https://design.p31ca.org'],
  ['portal-qpj', 'https://qpj.p31ca.org'],
  ['portal-chat', 'https://chat.p31ca.org'],
  ['site-p31ca', 'https://p31ca.org'],
  ['site-phosphorus', 'https://phosphorus31.org'],
];

function daysUntil(iso) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / DAY_MS);
}

/** Destructive control is inert unless explicitly enabled on the Worker. */
export function controlEnabled(env) {
  const v = env && env.CONTROL_ENABLED;
  return v === '1' || v === 'true' || v === true;
}

async function ping(url) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      headers: { 'user-agent': 'p31-command-center-eye/1.0' },
      signal: AbortSignal.timeout(PING_TIMEOUT_MS),
    });
    return { ok: res.status >= 200 && res.status < 400, code: res.status };
  } catch {
    return { ok: false, code: 0 };
  }
}

async function probeSurfaces(list) {
  const results = await Promise.all(
    list.map(async ([name, url]) => {
      const { ok, code } = await ping(url);
      return { name, url, ok, code };
    }),
  );
  return results;
}

async function fetchMesh() {
  const baseline = {
    vertices: 4,
    edges: 6,
    isostatic: true,
    rigidity: 1,
    love: 0,
    verticesList: [],
    edgesList: [],
  };
  try {
    const res = await fetch('https://k4-cage.trimtab-signal.workers.dev/api/mesh', {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(PING_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`mesh ${res.status}`);
    const data = await res.json();
    const verticesObj = data?.mesh?.vertices || {};
    const verticesList = Object.entries(verticesObj).map(([id, v]) => ({
      id,
      label: v?.label || id,
      love: Number(v?.love) || 0,
    }));
    const edgesList = (data?.mesh?.edges || data?.edges || []).map((e) => ({
      a: e?.a || e?.source || '?',
      b: e?.b || e?.target || '?',
      weight: Number(e?.weight ?? e?.love) || 0,
    }));
    const love = verticesList.reduce((s, v) => s + v.love, 0);
    const V = verticesList.length || baseline.vertices;
    const E = edgesList.length || baseline.edges;
    const rigidity = V > 2 ? E / (3 * V - 6) : 0;
    return {
      vertices: V,
      edges: E,
      isostatic: Math.abs(rigidity - 1) < 0.05,
      rigidity,
      love,
      verticesList,
      edgesList,
    };
  } catch {
    return baseline;
  }
}

async function readCosts(env) {
  if (!env?.EPCP_DB) return null;
  try {
    const hours = 24;
    const cutoff = Date.now() - hours * 3600 * 1000;
    const results = await env.EPCP_DB.prepare(
      'SELECT service, operation, SUM(quantity) as qty, SUM(estimated_cost) as cost FROM cost_tracking WHERE ts > ? GROUP BY service, operation',
    )
      .bind(cutoff)
      .all();
    const items = (results.results || []).map((r) => ({
      service: r.service,
      operation: r.operation,
      qty: Number(r.qty) || 0,
      cost: Number(r.cost) || 0,
    }));
    return { total: items.reduce((s, i) => s + i.cost, 0), period_hours: hours, items };
  } catch {
    return null;
  }
}

export async function buildEye(env) {
  let fleet = seed.workers || [];
  let rawStatus = null;

  if (env?.STATUS_KV) {
    try {
      rawStatus = await env.STATUS_KV.get('status', 'json');
      if (rawStatus?.workers?.length) fleet = rawStatus.workers;
    } catch {
      /* fall through to seed */
    }
  }

  // Quarantine flags — real KV state written by the control API.
  let quarantined = new Set();
  if (env?.STATUS_KV) {
    try {
      const keys = await env.STATUS_KV.list({ prefix: 'quarantine:' });
      quarantined = new Set(keys.keys.map((k) => k.name.slice('quarantine:'.length)));
    } catch {
      /* ignore */
    }
  }
  if (quarantined.size) {
    fleet = fleet.map((w) => (quarantined.has(w.name) ? { ...w, status: 'offline', group: 'quarantined' } : w));
  }

  const [surfaces, mesh, costs] = await Promise.all([
    probeSurfaces(CORE_SURFACES),
    fetchMesh(),
    readCosts(env),
  ]);

  const portals = seed.portals || [];
  const portalsLive = portals.length
    ? surfaces.filter((s) => portals.some((p) => p.url && s.url.startsWith(p.url)) && s.ok).length
    : surfaces.filter((s) => s.name.startsWith('portal-') && s.ok).length;

  const grants = (seed.grants || []).map((g) => ({ ...g, days: daysUntil(g.deadline) ?? 9999 }));
  const soonestGrant = grants.reduce((min, g) => (g.days < min ? g.days : min), 9999);

  const hearingDate = seed.legal?.hearing_date || null;
  const daysToHearing = daysUntil(hearingDate);

  const workersOnline = fleet.filter((w) => w.status === 'online').length;

  const mcp = seed.mcp
    ? {
        ...seed.mcp,
        endpoints: await Promise.all(
          (seed.mcp.endpoints || []).map(async (e) => {
            const { ok } = await ping(e.url);
            return { ...e, ok };
          }),
        ),
      }
    : { name: 'unknown', version: '—', registry_url: '', endpoints: [] };

  return {
    ts: new Date().toISOString(),
    control_enabled: controlEnabled(env),
    kpi: {
      workers_online: workersOnline,
      workers_total: fleet.length,
      portals_live: portalsLive,
      grants_active: grants.length,
      days_to_next_deadline: soonestGrant,
      days_to_hearing: daysToHearing ?? -1,
    },
    legal: {
      case: seed.legal?.case || rawStatus?.legal?.case || 'unknown',
      next_hearing: seed.legal?.next_hearing || 'TBD',
      hearing_date: hearingDate || '',
      days_to_hearing: daysToHearing ?? -1,
      judge: seed.legal?.judge || '',
      status: seed.legal?.status || '',
      mcghan_deadline: seed.legal?.mcghan_deadline,
    },
    fleet,
    surfaces,
    mesh,
    grants,
    mcp,
    costs,
  };
}
