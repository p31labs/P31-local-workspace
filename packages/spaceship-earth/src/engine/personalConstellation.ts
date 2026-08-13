/**
 * @file engine/personalConstellation.ts — Personal Constellation connector
 *
 * Re-emits the @p31/shared personal graph (58 nodes / 55 edges — meds, kids,
 * court, OPM/SSA, projects) as a NormalizedDataPoint[] source with typed
 * semantic metadata. It flows through the same mapper + canonical layer as any
 * dataset: one tap in the source registry, replaceable, never a hardwired
 * default. Node/edge placement is deterministic (domeMap assignment + seeded
 * layout), so the constellation renders identically on every visit.
 */

import { VERTICES, EDGES } from '@p31/shared';
import { assignNodeVertices, type Axis } from '../math/domeMap';
import type { NormalizedDataPoint, DatasetStyleGuide, DataConnector } from './dataConnectors';

// ─── Domain mapping (real graph axes → semantic categories) ─────────────────

const AXIS_TO_CATEGORY: Record<string, string> = {
  Body: 'medical',
  Mesh: 'family',
  Forge: 'project',
  Shield: 'legal',
};

const PRIMARY_STATES = new Set(['crisis', 'emergency', 'urgent', 'countdown', 'actionable']);
const SECONDARY_STATES = new Set(['active', 'operational', 'stable']);
const PENDING_STATES = new Set(['pending', 'review', 'countdown', 'actionable']);
const DORMANT_STATES = new Set(['blocked', 'stale', 'missing', 'unknown']);

const CRITICALITY_VALUE: Record<string, number> = { primary: 100, secondary: 60, tertiary: 25 };

const EDGE_WEIGHT: Record<string, number> = {
  treats: 1.0,
  requires: 0.9,
  'depends-on': 0.8,
  supports: 0.6,
  monitors: 0.5,
  includes: 0.5,
  uses: 0.5,
  blocks: 1.0,
  litigates: 1.0,
  'relates-to': 0.4,
};

/** Relationships that are inherently urgent regardless of endpoint state. */
const EDGE_CRITICAL_RELATIONSHIPS = new Set(['treats', 'requires', 'blocks', 'litigates']);

// ─── Style contract ─────────────────────────────────────────────────────────

export const PERSONAL_CONSTELLATION_STYLE_GUIDE: DatasetStyleGuide = {
  categories: {
    family: { color: '#ff9944', thickness: 2.5, opacity: 0.9, animation: 'breathe', glow: true },
    legal: { color: '#ff4466', thickness: 3, opacity: 1, animation: 'pulse', glow: true },
    medical: { color: '#44ffaa', thickness: 2, opacity: 0.8, animation: 'subtle-glow', glow: true },
    project: { color: '#44aaff', thickness: 1.5, opacity: 0.7, animation: 'none', glow: false },
  },
  temporalOverrides: {
    active: { opacity: 1 },
    pending: { opacity: 0.6, dasharray: '4,3', pulseIntensity: 0.5 },
    resolved: { opacity: 0.35 },
    dormant: { opacity: 0.2 },
  },
  criticalityMultiplier: { primary: 1, secondary: 0.75, tertiary: 0.5 },
};

/** Node colors per category (used by the vertex mapper's categoryColors). */
export const PERSONAL_CONSTELLATION_NODE_COLORS: Record<string, string> = {
  family: '#ff9944',
  legal: '#ff4466',
  medical: '#44ffaa',
  project: '#44aaff',
};

// ─── State → metadata helpers ───────────────────────────────────────────────

function criticalityFor(state: string): 'primary' | 'secondary' | 'tertiary' {
  if (PRIMARY_STATES.has(state)) return 'primary';
  if (SECONDARY_STATES.has(state)) return 'secondary';
  return 'tertiary';
}

function temporalFor(state: string): 'active' | 'pending' | 'resolved' | 'dormant' {
  if (state === 'resolved') return 'resolved';
  if (PENDING_STATES.has(state)) return 'pending';
  if (DORMANT_STATES.has(state)) return 'dormant';
  return 'active';
}

// ─── Emit ───────────────────────────────────────────────────────────────────

export function emitPersonalConstellation(): NormalizedDataPoint[] {
  const axisCounts: Record<Axis, number> = { body: 0, mesh: 0, forge: 0, shield: 0 };
  for (const v of VERTICES) {
    axisCounts[v.axis.toLowerCase() as Axis]++;
  }
  const indices = assignNodeVertices(axisCounts);

  const categoryById = new Map<string, string>();
  const criticalityById = new Map<string, string>();
  const temporalById = new Map<string, string>();

  const nodes: NormalizedDataPoint[] = VERTICES.map((v, i) => {
    const category = AXIS_TO_CATEGORY[v.axis] ?? 'other';
    const criticality = criticalityFor(v.state);
    const temporal = temporalFor(v.state);
    categoryById.set(v.id, category);
    criticalityById.set(v.id, criticality);
    temporalById.set(v.id, temporal);

    return {
      id: v.id,
      type: 'node',
      label: v.label,
      vertexIndex: indices[i],
      value: CRITICALITY_VALUE[criticality],
      metadata: {
        category,
        criticality,
        temporal,
        notes: v.notes,
      },
    };
  });

  const rank: Record<string, number> = { primary: 3, secondary: 2, tertiary: 1 };
  const edges: NormalizedDataPoint[] = EDGES.map((e) => {
    const sourceCrit = criticalityById.get(e.source) ?? 'tertiary';
    const targetCrit = criticalityById.get(e.target) ?? 'tertiary';
    const criticality = EDGE_CRITICAL_RELATIONSHIPS.has(e.relationship)
      ? 'primary'
      : (rank[sourceCrit] >= rank[targetCrit] ? sourceCrit : targetCrit) ?? 'tertiary';

    const sourceTemporal = temporalById.get(e.source) ?? 'active';
    const targetTemporal = temporalById.get(e.target) ?? 'active';
    const temporal =
      sourceTemporal === 'pending' || targetTemporal === 'pending'
        ? 'pending'
        : sourceTemporal === 'dormant' || targetTemporal === 'dormant'
          ? 'dormant'
          : sourceTemporal === 'resolved' || targetTemporal === 'resolved'
            ? 'resolved'
            : 'active';

    return {
      id: `${e.source}|${e.target}`,
      type: 'edge',
      source: e.source,
      target: e.target,
      label: e.relationship,
      metadata: {
        category: categoryById.get(e.target) ?? 'other',
        criticality,
        temporal,
        weight: EDGE_WEIGHT[e.relationship] ?? 0.5,
        relationship: e.relationship,
      },
    };
  });

  return [...nodes, ...edges];
}

// ─── Connector ──────────────────────────────────────────────────────────────

export const personalConstellationConnector: DataConnector = {
  id: 'personal-constellation',
  name: 'Personal Constellation',
  description: 'Your 58-node personal graph — meds, kids, court, OPM/SSA, and projects.',
  target: 'vertex',
  styleGuide: PERSONAL_CONSTELLATION_STYLE_GUIDE,
  fetch: async () => emitPersonalConstellation(),
};
