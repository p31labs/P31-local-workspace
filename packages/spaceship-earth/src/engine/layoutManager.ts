/**
 * @file engine/layoutManager.ts — Spoon-aware force-directed layout manager
 *
 * The manager decides how the settlement of a graph dataset is *experienced*:
 * - spoons ≥ 4  → 'live-settlement'  — checkpoints stream to the scene; the
 *   user watches nodes negotiate and settle (a cognitive anchor / visual fidget).
 * - spoons 2–3  → 'hidden-settlement' — computed in the background; the scene
 *   stays calm and only the final locked layout fades in.
 * - spoons ≤ 1  → 'locked-only'       — no animation at all; a single breathing
 *   indicator until the locked layout appears.
 *
 * Layouts are cached per dataset id (deterministic: seeded RNG, no Math.random)
 * so revisiting a dataset never re-settles and the dome stays a stable mirror.
 */

import type { LayoutNode, LayoutEdge, LayoutConfig } from '../workers/layoutWorker';
import { DEFAULT_LAYOUT_CONFIG, runForceDirectedLayout } from '../workers/layoutWorker';

export type LayoutStrategy = 'live-settlement' | 'hidden-settlement' | 'locked-only';
export type LayoutStatus = 'idle' | 'settling' | 'locked';
export type NodePositionMap = Record<string, [number, number, number]>;

export interface GraphLayoutRequest {
  datasetId: string;
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  config?: LayoutConfig;
}

export interface LayoutCheckpoint {
  iteration: number;
  positions: NodePositionMap;
}

export function selectRenderingStrategy(spoons: number): LayoutStrategy {
  if (spoons >= 4) return 'live-settlement';
  if (spoons >= 2) return 'hidden-settlement';
  return 'locked-only';
}

function toPositionMap(nodes: LayoutNode[], flat: Float64Array): NodePositionMap {
  const out: NodePositionMap = {};
  for (let i = 0; i < nodes.length; i++) {
    out[nodes[i].id] = [flat[i * 3], flat[i * 3 + 1], flat[i * 3 + 2]];
  }
  return out;
}

export class LayoutManager {
  private cache = new Map<string, NodePositionMap>();
  private worker: Worker | null = null;
  private checkpointListeners = new Set<(checkpoint: LayoutCheckpoint) => void>();
  private settledListeners = new Set<(positions: NodePositionMap) => void>();
  private status: LayoutStatus = 'idle';
  private activeDatasetId: string | null = null;

  getStatus(): LayoutStatus {
    return this.status;
  }

  getActiveDatasetId(): string | null {
    return this.activeDatasetId;
  }

  /** Cached layout for a dataset, if already settled. */
  getCached(datasetId: string): NodePositionMap | undefined {
    return this.cache.get(datasetId);
  }

  onCheckpoint(listener: (checkpoint: LayoutCheckpoint) => void): () => void {
    this.checkpointListeners.add(listener);
    return () => this.checkpointListeners.delete(listener);
  }

  onSettled(listener: (positions: NodePositionMap) => void): () => void {
    this.settledListeners.add(listener);
    return () => this.settledListeners.delete(listener);
  }

  private emitCheckpoint(checkpoint: LayoutCheckpoint): void {
    for (const l of this.checkpointListeners) l(checkpoint);
  }

  private emitSettled(positions: NodePositionMap): void {
    for (const l of this.settledListeners) l(positions);
  }

  private settleSync(req: GraphLayoutRequest): NodePositionMap {
    const config: Required<LayoutConfig> = { ...DEFAULT_LAYOUT_CONFIG, ...req.config };
    const result = runForceDirectedLayout(req.nodes, req.edges, config, undefined, req.datasetId);
    const positions = toPositionMap(req.nodes, result.positions);
    this.cache.set(req.datasetId, positions);
    this.status = 'locked';
    this.emitSettled(positions);
    return positions;
  }

  /**
   * Request the layout for a dataset. Returns the settled positions. When the
   * dataset is already settled (cached) it resolves immediately.
   */
  async requestLayout(req: GraphLayoutRequest, spoons: number): Promise<NodePositionMap> {
    const cached = this.cache.get(req.datasetId);
    if (cached) {
      this.status = 'locked';
      return cached;
    }

    this.activeDatasetId = req.datasetId;
    this.status = 'settling';
    const strategy = selectRenderingStrategy(spoons);
    const config: Required<LayoutConfig> = { ...DEFAULT_LAYOUT_CONFIG, ...req.config };

    // No Worker available (SSR, tests, unusual embeds) — settle synchronously.
    // Deterministic, so behaviour is identical.
    if (typeof Worker === 'undefined') {
      return this.settleSync(req);
    }

    return new Promise<NodePositionMap>((resolve) => {
      const worker = new Worker(new URL('../workers/layoutWorker.ts', import.meta.url), {
        type: 'module',
      });
      this.worker = worker;

      worker.onmessage = (event: MessageEvent) => {
        const msg = event.data;
        if (msg?.type === 'checkpoint') {
          if (strategy === 'live-settlement') {
            this.emitCheckpoint({ iteration: msg.iteration, positions: msg.positions });
          }
        } else if (msg?.type === 'complete') {
          this.worker = null;
          worker.terminate();
          this.cache.set(req.datasetId, msg.positions as NodePositionMap);
          this.status = 'locked';
          this.emitSettled(msg.positions as NodePositionMap);
          resolve(msg.positions as NodePositionMap);
        }
      };

      worker.onerror = () => {
        this.worker = null;
        worker.terminate();
        resolve(this.settleSync(req));
      };

      worker.postMessage({
        type: 'start',
        nodes: req.nodes,
        edges: req.edges,
        config,
        seed: req.datasetId,
      });
    });
  }

  invalidate(datasetId: string): void {
    this.cache.delete(datasetId);
  }

  clear(): void {
    this.cache.clear();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.status = 'idle';
    this.activeDatasetId = null;
  }
}

/** App-wide singleton. */
export const layoutManager = new LayoutManager();
