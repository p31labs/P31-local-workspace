/**
 * @file k4Binding.ts — Phase 2: the K₄ skeleton of the ship.
 *
 * ⚠️ HONEST LABEL
 * Binds the cockpit's K₄ Delta topology to the canonical @p31/quantum-core
 * K4Graph and to live P31 subsystem state. K₄ is a standard graph-theory object
 * (planar, 4 vertices, 6 edges) — no quantum or metaphysical claims. The four
 * vertices are the four P31 subsystems; the six edges are their data flows.
 * Edge health is derived from real relay latency via the in-repo RicciMath
 * (discrete Ricci-flow proxy), replacing the cosmetic curvature proxy.
 *
 * Subsystems (vertices):
 *   V1 COCKPIT  — Spaceship Earth (this app / HUD)
 *   V2 KIDS     — Willow (child-facing app)
 *   V3 GAME     — Bonding (chemistry builder)
 *   V4 LEDGER   — love-ledger (care accounting)
 *
 * Data flows (edges) — what each carries:
 *   V1–V2 PASSPORT   user prefs / accessibility
 *   V1–V3 EVENTS     game actions / celebrations
 *   V1–V4 CARE       LOVE balance / care score / tx
 *   V2–V3 PRESENCE   who is online / playing
 *   V2–V4 GROWTH     child development / milestones
 *   V3–V4 REWARDS    game rewards → ledger credits
 */

import { K4Graph, type K4Vertex, type K4Edge } from '@p31/quantum-core/k4';
import { RicciMath } from '../lib/engine/ricci';

export type SubsystemId = 'cockpit' | 'kids' | 'game' | 'ledger';

export interface SubsystemActivity {
  /** Recent events per minute / engagement (0..1). Drives vertex weight. */
  activity: number;
}

const SUBSYSTEM_LABELS: Record<SubsystemId, string> = {
  cockpit: 'Cockpit',
  kids: 'Willow',
  game: 'Bonding',
  ledger: 'Love-Ledger',
};

const EDGE_LABELS: Record<string, string> = {
  'cockpit:kids': 'Passport',
  'cockpit:game': 'Events',
  'cockpit:ledger': 'Care',
  'kids:game': 'Presence',
  'kids:ledger': 'Growth',
  'game:ledger': 'Rewards',
};

const clamp01 = (n: number): number => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

function edgeKey(a: SubsystemId, b: SubsystemId): string {
  return [a, b].sort().join(':');
}

/**
 * Build a K4Graph whose 4 vertices are the live P31 subsystems.
 * Vertex weight = observed activity (0..1). Edge weight = flow health
 * (0..1), derived from relay latency/noise via RicciMath.
 *
 * `pingMs` is the live relay RTT (0 when disconnected → edges read degraded).
 */
export function buildShipK4(
  activity: Record<SubsystemId, SubsystemActivity>,
  pingMs: number,
): K4Graph {
  const ids: SubsystemId[] = ['cockpit', 'kids', 'game', 'ledger'];

  const vertices: K4Vertex[] = ids.map((id, i) => ({
    id: i + 1,
    label: SUBSYSTEM_LABELS[id],
    weight: clamp01(activity[id]?.activity ?? 0),
  }));

  const edges: K4Edge[] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i];
      const b = ids[j];
      // Flow health from relay latency (latency 0 ⇒ no connection ⇒ low health).
      const noise = pingMs > 0 ? Math.min(1, pingMs / 5000) : 1;
      const curvature = RicciMath.calculateCurvature(pingMs, noise);
      // κ ∈ [0.5,1.5] → health ∈ [0,1] (1.5 = optimal).
      const health = clamp01((curvature - 0.5) / 1.0);
      edges.push({
        source: i + 1,
        target: j + 1,
        weight: health,
        label: EDGE_LABELS[edgeKey(a, b)] ?? 'flow',
      });
    }
  }

  // Assemble a K4Graph via its public surface (vertices/edges are readonly,
  // so we construct then reassign through a small subclass-free wrapper).
  const graph = new K4Graph();
  (graph as unknown as { vertices: K4Vertex[] }).vertices = vertices;
  (graph as unknown as { edges: K4Edge[] }).edges = edges;
  return graph;
}

/**
 * Mean edge health across the mesh (0..1). Used by DeltaMesh to drive the
 * live Ricci curvature / color of the skeleton.
 */
export function meshHealth(graph: K4Graph): number {
  if (graph.edges.length === 0) return 0;
  const sum = graph.edges.reduce((acc, e) => acc + e.weight, 0);
  return clamp01(sum / graph.edges.length);
}

/**
 * Curvature κ for the whole skeleton from live mesh health (1.5 optimal →
 * low stress, 0.5 degraded). Mirrors RicciMath's κ range so DeltaMesh can
 * reuse its scale/color logic unchanged.
 */
export function meshCurvature(graph: K4Graph): number {
  return 0.5 + meshHealth(graph) * 1.0;
}

export { SUBSYSTEM_LABELS, EDGE_LABELS };
