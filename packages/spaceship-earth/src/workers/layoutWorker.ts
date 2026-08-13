/**
 * @file workers/layoutWorker.ts — Force-directed layout, off the main thread
 *
 * Deterministic soft-determinism layout:
 * - Seeded PRNG (mulberry32) — same input → byte-identical output.
 * - Nodes initialize near their category's K₄ face, jittered by the seed.
 * - Repulsion + weight-scaled attraction + soft face-affinity pull.
 * - Simulated-annealing cooling drives kinetic energy to zero (nodes rest).
 * - Checkpoints every N iterations let high-spoon users watch the settle;
 *   low-spoon users just receive the final locked positions.
 *
 * Pure functions are exported for unit testing (no Worker required);
 * the worker glue is guarded so this module is importable in Node/vitest.
 */

export interface LayoutNode {
  id: string;
  category?: string;
  /** Preferred dome position when a vertex index is already assigned. */
  vertex?: [number, number, number];
}

export interface LayoutEdge {
  source: string;
  target: string;
  weight?: number;
}

export interface LayoutConfig {
  repulsionStrength?: number;
  attractionStrength?: number;
  damping?: number;
  iterations?: number;
  faceAffinityStrength?: number;
  radius?: number;
  jitter?: number;
  checkpointEvery?: number;
}

export const DEFAULT_LAYOUT_CONFIG: Required<LayoutConfig> = {
  repulsionStrength: 0.5,
  attractionStrength: 0.8,
  damping: 0.95,
  iterations: 300,
  faceAffinityStrength: 0.3,
  radius: 9,
  jitter: 0.15,
  checkpointEvery: 10,
};

/** Category → K₄ face anchor (mirrors math/domeMap). Kept local for zero deps. */
const CATEGORY_FACE: Record<string, number> = { family: 0, legal: 1, medical: 2, project: 3 };

const K4_FACE_CENTERS: [number, number, number][] = [
  [5.196152422706632, 5.196152422706632, 5.196152422706632],
  [5.196152422706632, -5.196152422706632, -5.196152422706632],
  [-5.196152422706632, 5.196152422706632, -5.196152422706632],
  [-5.196152422706632, -5.196152422706632, 5.196152422706632],
];

// ─── Seeded RNG (mulberry32) ────────────────────────────────────────────────

export function hashStringToUint32(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** Deterministic PRNG factory (mulberry32). */
export function createSeededRng(seed: string): () => number {
  let a = hashStringToUint32(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Initialization ─────────────────────────────────────────────────────────

/**
 * Place each node near its category's K₄ face center (soft bias), jittered
 * by the seeded RNG. Nodes without an affinity face float at the dome center.
 */
export function initializeNodePositions(
  nodes: LayoutNode[],
  rng: () => number,
  config: Required<LayoutConfig>,
): Float64Array {
  const pos = new Float64Array(nodes.length * 3);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const face = node.category ? CATEGORY_FACE[node.category] : undefined;
    if (face !== undefined && face < K4_FACE_CENTERS.length) {
      const c = K4_FACE_CENTERS[face];
      const jx = (rng() - 0.5) * 2 * config.jitter * config.radius;
      const jy = (rng() - 0.5) * 2 * config.jitter * config.radius;
      const jz = (rng() - 0.5) * 2 * config.jitter * config.radius;
      pos[i * 3] = c[0] + jx;
      pos[i * 3 + 1] = c[1] + jy;
      pos[i * 3 + 2] = c[2] + jz;
    } else if (node.vertex) {
      pos[i * 3] = node.vertex[0];
      pos[i * 3 + 1] = node.vertex[1];
      pos[i * 3 + 2] = node.vertex[2];
    } else {
      pos[i * 3] = (rng() - 0.5) * 2 * config.jitter * config.radius;
      pos[i * 3 + 1] = (rng() - 0.5) * 2 * config.jitter * config.radius;
      pos[i * 3 + 2] = (rng() - 0.5) * 2 * config.jitter * config.radius;
    }
  }
  return pos;
}

// ─── Simulation ─────────────────────────────────────────────────────────────

export interface SimulationResult {
  positions: Float64Array;
  iterations: number;
}

/**
 * Run the full force-directed settlement with simulated annealing.
 * `onCheckpoint(iteration, positions)` fires every `checkpointEvery`
 * iterations with a snapshot of the current state (main thread may ignore it).
 */
export function runForceDirectedLayout(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  config: Required<LayoutConfig>,
  onCheckpoint?: (iteration: number, positions: Record<string, [number, number, number]>) => void,
  seed = 'layout-init',
): SimulationResult {
  const n = nodes.length;
  const rng = createSeededRng(seed);
  const positions = initializeNodePositions(nodes, rng, config);
  const velocities = new Float64Array(n * 3);
  const ids = nodes.map((node) => node.id);

  // Index maps for O(1) edge lookup: nodeId → array of {otherIdx, weight}
  const idToIndex = new Map<string, number>();
  for (let i = 0; i < n; i++) idToIndex.set(nodes[i].id, i);

  const adjacency: { other: number; weight: number }[][] = Array.from({ length: n }, () => []);
  for (const edge of edges) {
    const si = idToIndex.get(edge.source);
    const ti = idToIndex.get(edge.target);
    if (si === undefined || ti === undefined || si === ti) continue;
    const w = edge.weight ?? 1;
    adjacency[si].push({ other: ti, weight: w });
    adjacency[ti].push({ other: si, weight: w });
  }

  const radius = config.radius;
  let temperature = 1;
  const coolingRate = 1 - 1 / Math.max(1, config.iterations);
  const snapshot = (iteration: number): Record<string, [number, number, number]> => {
    const out: Record<string, [number, number, number]> = {};
    for (let i = 0; i < n; i++) {
      out[ids[i]] = [positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]];
    }
    return out;
  };

  for (let iter = 0; iter < config.iterations; iter++) {
    for (let i = 0; i < n; i++) {
      const px = positions[i * 3];
      const py = positions[i * 3 + 1];
      const pz = positions[i * 3 + 2];
      let fx = 0;
      let fy = 0;
      let fz = 0;

      // Repulsion from every other node (inverse-square).
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const dx = px - positions[j * 3];
        const dy = py - positions[j * 3 + 1];
        const dz = pz - positions[j * 3 + 2];
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy + dz * dz), 0.1);
        const mag = config.repulsionStrength / (dist * dist);
        fx += (dx / dist) * mag;
        fy += (dy / dist) * mag;
        fz += (dz / dist) * mag;
      }

      // Attraction along weighted edges.
      for (const edge of adjacency[i]) {
        const j = edge.other;
        const dx = positions[j * 3] - px;
        const dy = positions[j * 3 + 1] - py;
        const dz = positions[j * 3 + 2] - pz;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy + dz * dz), 0.1);
        const mag = config.attractionStrength * edge.weight * dist;
        fx += (dx / dist) * mag;
        fy += (dy / dist) * mag;
        fz += (dz / dist) * mag;
      }

      // Soft pull toward the category's K₄ face center.
      const face = nodes[i].category ? CATEGORY_FACE[nodes[i].category!] : undefined;
      if (face !== undefined && face < K4_FACE_CENTERS.length) {
        const c = K4_FACE_CENTERS[face];
        const dx = c[0] - px;
        const dy = c[1] - py;
        const dz = c[2] - pz;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy + dz * dz), 0.1);
        fx += (dx / dist) * config.faceAffinityStrength;
        fy += (dy / dist) * config.faceAffinityStrength;
        fz += (dz / dist) * config.faceAffinityStrength;
      }

      const damp = config.damping * temperature;
      velocities[i * 3] = (velocities[i * 3] + fx) * damp;
      velocities[i * 3 + 1] = (velocities[i * 3 + 1] + fy) * damp;
      velocities[i * 3 + 2] = (velocities[i * 3 + 2] + fz) * damp;

      let nx = px + velocities[i * 3];
      let ny = py + velocities[i * 3 + 1];
      let nz = pz + velocities[i * 3 + 2];

      // Constrain inside the dome radius.
      const r = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (r > radius) {
        const s = radius / r;
        nx *= s;
        ny *= s;
        nz *= s;
      }
      positions[i * 3] = nx;
      positions[i * 3 + 1] = ny;
      positions[i * 3 + 2] = nz;
    }

    temperature *= coolingRate;

    if (onCheckpoint && (iter + 1) % config.checkpointEvery === 0) {
      onCheckpoint(iter + 1, snapshot(iter + 1));
    }
  }

  return { positions, iterations: config.iterations };
}

// ─── Worker glue ────────────────────────────────────────────────────────────

export type LayoutWorkerRequest =
  | { type: 'start'; nodes: LayoutNode[]; edges: LayoutEdge[]; config: LayoutConfig; seed: string }
  | { type: 'shutdown' };

export type LayoutWorkerResponse =
  | { type: 'checkpoint'; iteration: number; positions: Record<string, [number, number, number]> }
  | { type: 'complete'; iteration: number; positions: Record<string, [number, number, number]> };

declare const self: Worker;

export function startLayoutWorkerGlue(): void {
  self.onmessage = (event: MessageEvent<LayoutWorkerRequest>) => {
    const msg = event.data;
    if (!msg || msg.type === 'shutdown') {
      (self as unknown as { close: () => void }).close();
      return;
    }
    if (msg.type !== 'start') return;

    const config: Required<LayoutConfig> = { ...DEFAULT_LAYOUT_CONFIG, ...msg.config };
    const result = runForceDirectedLayout(
      msg.nodes,
      msg.edges,
      config,
      (iteration, positions) => {
        self.postMessage({ type: 'checkpoint', iteration, positions } satisfies LayoutWorkerResponse);
      },
      msg.seed,
    );

    const positions: Record<string, [number, number, number]> = {};
    for (let i = 0; i < msg.nodes.length; i++) {
      positions[msg.nodes[i].id] = [
        result.positions[i * 3],
        result.positions[i * 3 + 1],
        result.positions[i * 3 + 2],
      ];
    }
    self.postMessage({
      type: 'complete',
      iteration: result.iterations,
      positions,
    } satisfies LayoutWorkerResponse);
  };
}

// Only wire up the worker glue when running inside an actual Worker
// (Web Worker: has `self` + `postMessage` but no `window`; jsdom has `window`).
const isWorkerContext =
  typeof self !== 'undefined' && typeof window === 'undefined' && typeof self.postMessage === 'function';

if (isWorkerContext) {
  startLayoutWorkerGlue();
}
