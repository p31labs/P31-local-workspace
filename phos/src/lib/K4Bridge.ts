import { endpoints } from '../config/endpoints';

export interface K4Entry {
  level: number;
  feature: string;
  vertex: string;
  edge: string;
  value: number;
  source?: string;
  node_id?: string;
  timestamp?: string;
}

export interface K4Graph {
  level: number;
  matrix: Record<string, Record<string, number>>;
  edges: Record<string, number>;
}

export interface K4Features {
  [feature: string]: { L0: number; L1: number; L2: number; L3: number; L4: number };
}

const BASE = endpoints.k4Api || 'https://cashpilot-sync.trimtab-signal.workers.dev';

async function pushEntry(entry: K4Entry): Promise<boolean> {
  try {
    const resp = await fetch(`${BASE}/api/k4/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: entry.level,
        vertex: entry.vertex,
        edge: entry.edge,
        amount_usd: entry.value,
        feature: entry.feature,
        source: entry.source || 'phos',
        node_id: entry.node_id || 'phos-browser',
        timestamp: entry.timestamp || new Date().toISOString(),
      }),
    });
    return resp.ok;
  } catch { return false; }
}

async function fetchGraph(level?: number, feature?: string): Promise<K4Graph | null> {
  try {
    const params = new URLSearchParams();
    if (level !== undefined) params.set('level', String(level));
    const resp = await fetch(`${BASE}/api/k4/graph?${params}`);
    if (!resp.ok) return null;
    return resp.json();
  } catch { return null; }
}

async function fetchSummary(feature?: string): Promise<K4Features | null> {
  try {
    const params = feature ? `?feature=${feature}` : '';
    const resp = await fetch(`${BASE}/api/k4/summary${params}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    const features: K4Features = {};
    for (const [level, summary] of Object.entries(data.summary || {})) {
      const l = Number(level);
      for (const [f, val] of Object.entries(summary.vertices || {})) {
        if (!features[f]) features[f] = { L0: 0, L1: 0, L2: 0, L3: 0, L4: 0 };
        (features[f] as any)[`L${l}`] = val as number;
      }
    }
    return features;
  } catch { return null; }
}

async function fetchFeatures(): Promise<K4Features | null> {
  try {
    const resp = await fetch(`${BASE}/api/k4/features`);
    if (!resp.ok) return fetchSummary();
    return resp.json();
  } catch { return fetchSummary(); }
}

export const K4Bridge = {
  pushEntry,
  fetchGraph,
  fetchSummary,
  fetchFeatures,
};
