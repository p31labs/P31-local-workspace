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

const BASE = endpoints.k4Api || 'https://gateway.p31ca.org';

async function pushEntry(entry: K4Entry): Promise<boolean> {
  try {
    const resp = await fetch(`${BASE}/api/mesh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    return resp.ok;
  } catch { return false; }
}

async function fetchGraph(level?: number, feature?: string): Promise<K4Graph | null> {
  try {
    const resp = await fetch(`${BASE}/api/mesh`);
    if (!resp.ok) return null;
    const data = await resp.json();
    const vertices = Object.values(data.mesh?.vertices || {}) as any[];
    const matrix: Record<string, Record<string, number>> = {};
    const edges: Record<string, number> = {};
    for (const v of vertices) {
      matrix[v.id] = { love: Number(v.love) || 0 };
    }
    return {
      level: level ?? 0,
      matrix,
      edges,
    };
  } catch { return null; }
}

async function fetchSummary(feature?: string): Promise<K4Features | null> {
  try {
    const resp = await fetch(`${BASE}/api/mesh`);
    if (!resp.ok) return null;
    const data = await resp.json();
    const vertices = Object.values(data.mesh?.vertices || {}) as any[];
    const features: K4Features = {};
    for (const v of vertices) {
      const key = feature || v.id;
      features[key] = { L0: 0, L1: 0, L2: 0, L3: 0, L4: 0 };
      features[key].L0 = Number(v.love) || 0;
    }
    return features;
  } catch { return null; }
}

async function fetchFeatures(): Promise<K4Features | null> {
  try {
    const resp = await fetch(`${BASE}/api/mesh`);
    if (!resp.ok) return fetchSummary();
    return fetchSummary();
  } catch { return fetchSummary(); }
}

export const K4Bridge = {
  pushEntry,
  fetchGraph,
  fetchSummary,
  fetchFeatures,
};
