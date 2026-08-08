/**
 * @file k4Binding.ts — Phase 2 K₄ skeleton binding.
 *
 * The ship's K₄ graph: 4 vertices (P31 subsystems), complete and planar
 * (6 edges). Vertex weights reflect activity; edge health derives from relay
 * latency via RicciMath. K₄ is standard graph theory — no scientific claims.
 */
import { RicciMath } from '../lib/engine/ricci';

export const SUBSYSTEM_LABELS = {
  cockpit: 'cockpit',
  kids: 'kids',
  game: 'game',
  ledger: 'ledger',
} as const;

export type SubsystemKey = keyof typeof SUBSYSTEM_LABELS;

export interface SubsystemActivity {
  activity: number;
}

export interface K4Vertex {
  label: string;
  weight: number;
}

export interface ShipK4Graph {
  vertices: K4Vertex[];
  latency: number;
  noise: number;
  vertexCount: number;
  edgeCount: number;
  isComplete: () => boolean;
  isPlanar: () => boolean;
  adjacencyMatrix: () => number[][];
}

const clamp01 = (v: number): number =>
  Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;

/**
 * Edge health from relay latency (ms). Zero / absent latency means a dead
 * link; the curve peaks around a healthy 40 ms round-trip.
 */
function edgeHealth(ping: number): number {
  if (!Number.isFinite(ping) || ping <= 0) return 0;
  const d = (ping - 40) / 40;
  return Math.exp(-d * d);
}

export function buildShipK4(
  activity: Record<SubsystemKey, SubsystemActivity>,
  ping: number,
): ShipK4Graph {
  const keys = Object.keys(SUBSYSTEM_LABELS) as SubsystemKey[];
  const vertices: K4Vertex[] = keys.map((k) => ({
    label: SUBSYSTEM_LABELS[k],
    weight: clamp01(activity[k]?.activity ?? 0),
  }));
  const meanWeight = vertices.reduce((a, v) => a + v.weight, 0) / vertices.length;

  const adjacencyMatrix = (): number[][] => {
    const n = vertices.length;
    const m: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const h = edgeHealth(ping);
        m[i][j] = h;
        m[j][i] = h;
      }
    }
    return m;
  };

  return {
    vertices,
    latency: ping,
    noise: 1 - meanWeight,
    vertexCount: vertices.length,
    edgeCount: 6, // complete K₄
    isComplete: () => true,
    isPlanar: () => true, // K₄ is planar
    adjacencyMatrix,
  };
}

/** Mean edge health across the complete graph. */
export function meshHealth(g: ShipK4Graph): number {
  const adj = g.adjacencyMatrix();
  const n = adj.length;
  let total = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) total += adj[i][j];
  }
  const pairs = (n * (n - 1)) / 2;
  return pairs > 0 ? total / pairs : 0;
}

/** Ricci curvature from relay latency + vertex-weight noise, in [0.5, 1.5]. */
export function meshCurvature(g: ShipK4Graph): number {
  return RicciMath.calculateCurvature(g.latency, g.noise);
}
