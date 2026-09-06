import type { TetraPayload, HealthPayload } from './tetraClient';

export interface VertexMetrics {
  latency: number; // ms
  cache: number; // %
  cpu: number; // ms
}

export interface Vertex {
  id: 1 | 2 | 3 | 4;
  host: string;
  role: string;
  accent: 'gold' | 'cyan' | 'violet' | 'green';
  alive: boolean;
  edges: string[];
  metrics?: VertexMetrics;
}

export interface Edge {
  id: string;
  from: 1 | 2 | 3 | 4;
  to: 1 | 2 | 3 | 4;
  label: string;
}

export interface DashboardStats {
  vertices: number;
  edges: number;
  rigid: boolean;
  gatheredAt: string | null;
}

export interface DashboardData {
  vertices: Vertex[];
  edges: Edge[];
  stats: DashboardStats;
}

const VERTEX_META: Record<1 | 2 | 3 | 4, { host: string; role: string; accent: Vertex['accent'] }> = {
  1: { host: 'p31ca.org', role: 'Apex — Technical Hub', accent: 'gold' },
  2: { host: 'phosphorus31.org', role: 'Nonprofit Portal', accent: 'cyan' },
  3: { host: 'phos.p31ca.org', role: 'Ambient Workspace', accent: 'violet' },
  4: { host: 'willow.p31ca.org', role: 'Quantum Companion', accent: 'green' },
};

const EDGE_META: Edge[] = [
  { id: 'E1', from: 1, to: 2, label: 'Hub ↔ NP' },
  { id: 'E2', from: 1, to: 3, label: 'Hub ↔ OS' },
  { id: 'E3', from: 1, to: 4, label: 'Hub ↔ Willow' },
  { id: 'E4', from: 2, to: 3, label: 'NP ↔ OS' },
  { id: 'E5', from: 2, to: 4, label: 'NP ↔ Willow' },
  { id: 'E6', from: 3, to: 4, label: 'OS ↔ Willow' },
];

/**
 * Maps the real tetra-hub payloads into the dashboard model.
 * Lives entirely on the fields the worker actually emits (topology + faces + health.alive).
 * Does NOT invent per-vertex latency/cache/CPU — those are not in the current schema.
 */
export function mapTopology(tetra: TetraPayload | null, health: HealthPayload | null): DashboardData {
  const aliveFlags = health?.upstream ?? {};
  const alive = (which: 'cage' | 'personal' | 'hubs'): boolean => Boolean(aliveFlags[which]?.alive);

  // Treat each upstream binding as one health signal for the mesh.
  // V1/V3/V4 are app surfaces; we derive "alive" from the trio liveness as a proxy
  // (no per-vertex health endpoint exists yet — see plan §4).
  const meshUp = alive('cage') || alive('personal') || alive('hubs');

  const vertices: Vertex[] = ([1, 2, 3, 4] as const).map((id) => ({
    id,
    host: VERTEX_META[id].host,
    role: VERTEX_META[id].role,
    accent: VERTEX_META[id].accent,
    alive: meshUp, // proxy: whole mesh up/down until per-vertex health exists
    edges: EDGE_META.filter((e) => e.from === id || e.to === id).map((e) => e.id),
  }));

  const stats: DashboardStats = {
    vertices: tetra?.topology?.vertices ?? 4,
    edges: tetra?.topology?.edges ?? 6,
    rigid: true,
    gatheredAt: tetra?.gatheredAt ?? null,
  };

  return { vertices, edges: EDGE_META, stats };
}
