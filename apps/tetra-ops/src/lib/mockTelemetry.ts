import type { DashboardData, Vertex } from './mapTopology';

// Mock telemetry source — mirrors the real tetra-hub schema shape but adds the
// per-vertex metrics (latency/cache/cpu) that the live worker does not yet emit.
// Used by default until VITE_USE_MOCK_TELEMETRY=false (real worker deployed).

const HOSTS: { id: 1 | 2 | 3 | 4; host: string; role: string; accent: Vertex['accent'] }[] = [
  { id: 1, host: 'p31ca.org', role: 'Apex — Technical Hub', accent: 'gold' },
  { id: 2, host: 'phosphorus31.org', role: 'Nonprofit Portal', accent: 'cyan' },
  { id: 3, host: 'phos.p31ca.org', role: 'Ambient Workspace', accent: 'violet' },
  { id: 4, host: 'willow.p31ca.org', role: 'Quantum Companion', accent: 'green' },
];

const EDGES = [
  { id: 'E1', from: 1 as const, to: 2 as const, label: 'Hub ↔ NP' },
  { id: 'E2', from: 1 as const, to: 3 as const, label: 'Hub ↔ OS' },
  { id: 'E3', from: 1 as const, to: 4 as const, label: 'Hub ↔ Willow' },
  { id: 'E4', from: 2 as const, to: 3 as const, label: 'NP ↔ OS' },
  { id: 'E5', from: 2 as const, to: 4 as const, label: 'NP ↔ Willow' },
  { id: 'E6', from: 3 as const, to: 4 as const, label: 'OS ↔ Willow' },
];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const walk = (v: number, step: number, lo: number, hi: number) => clamp(v + (Math.random() - 0.5) * 2 * step, lo, hi);

interface MockVertexState {
  alive: boolean;
  nextFlip: number;
  latency: number;
  cache: number;
  cpu: number;
}

const state: Record<number, MockVertexState> = {};
for (const h of HOSTS) {
  state[h.id] = { alive: true, nextFlip: Date.now() + 10000 + Math.random() * 10000, latency: 40 + Math.random() * 40, cache: 97 + Math.random() * 2, cpu: 0.4 + Math.random() * 0.8 };
}

function stepVertex(s: MockVertexState) {
  if (Date.now() >= s.nextFlip) {
    s.alive = !s.alive;
    s.nextFlip = Date.now() + 10000 + Math.random() * 10000;
  }
  if (s.alive) {
    s.latency = walk(s.latency, 12, 20, 150);
    s.cache = walk(s.cache, 0.4, 95, 99.6);
    s.cpu = walk(s.cpu, 0.4, 0.1, 2.5);
  } else {
    // down vertices: high latency, low cache, no cpu
    s.latency = walk(s.latency, 30, 200, 900);
    s.cache = walk(s.cache, 1, 0, 60);
    s.cpu = 0;
  }
}

export function mockTelemetry(): DashboardData {
  for (const h of HOSTS) stepVertex(state[h.id]);

  const vertices: Vertex[] = HOSTS.map((h) => {
    const s = state[h.id];
    return {
      id: h.id,
      host: h.host,
      role: h.role,
      accent: h.accent,
      alive: s.alive,
      edges: EDGES.filter((e) => e.from === h.id || e.to === h.id).map((e) => e.id),
      metrics: { latency: Math.round(s.latency), cache: Math.round(s.cache * 10) / 10, cpu: Math.round(s.cpu * 100) / 100 },
    };
  });

  return {
    vertices,
    edges: EDGES,
    stats: { vertices: 4, edges: 6, rigid: true, gatheredAt: new Date().toISOString() },
  };
}

// Track previous alive state so callers can diff for notifications.
export function snapshotAlive(data: DashboardData): Record<number, boolean> {
  const out: Record<number, boolean> = {};
  for (const v of data.vertices) out[v.id] = v.alive;
  return out;
}
