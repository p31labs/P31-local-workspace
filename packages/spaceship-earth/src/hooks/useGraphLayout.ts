/**
 * @file hooks/useGraphLayout.ts — React binding for the layout manager
 *
 * Derives LayoutNode[]/LayoutEdge[] from the active graph dataset, asks the
 * manager to settle it (spoon-aware), and exposes the resulting positions +
 * status. Also exposes the live checkpoints so high-spoon users can watch the
 * settlement unfold.
 */

import { useEffect, useMemo, useState } from 'react';
import { useShipStore } from '../store/shipStore';
import { useDatasetStore } from '../store/datasetStore';
import { layoutManager, selectRenderingStrategy, type LayoutStrategy, type LayoutStatus, type NodePositionMap } from '../engine/layoutManager';
import type { LayoutNode, LayoutEdge } from '../workers/layoutWorker';
import { readPointMetadata } from '../engine/dataConnectors';
import { DOME_VERTICES } from '../math/domeMap';

export interface GraphLayoutState {
  positions: NodePositionMap | null;
  status: LayoutStatus;
  strategy: LayoutStrategy;
  datasetId: string | null;
}

export function useGraphLayout(): GraphLayoutState {
  const spoons = useShipStore((s) => s.spoons);
  const activeVertexId = useDatasetStore((s) => s.activeVertexDatasetId);
  const datasets = useDatasetStore((s) => s.datasets);
  const dataset = datasets.find((d) => d.id === activeVertexId) ?? null;

  const request = useMemo(() => {
    if (!dataset || dataset.data.length === 0) return null;
    const nodes: LayoutNode[] = [];
    const edges: LayoutEdge[] = [];
    for (const point of dataset.data) {
      const meta = readPointMetadata(point);
      if (point.type === 'edge') {
        if (point.source && point.target) {
          edges.push({ source: point.source, target: point.target, weight: meta.weight });
        }
        continue;
      }
      const idx = point.vertexIndex;
      const vertex: [number, number, number] | undefined =
        idx !== undefined && idx >= 0 && idx < DOME_VERTICES.length
          ? [DOME_VERTICES[idx][0], DOME_VERTICES[idx][1], DOME_VERTICES[idx][2]]
          : undefined;
      nodes.push({ id: point.id, category: meta.category, vertex });
      if (point.connections) {
        for (const other of point.connections) {
          edges.push({ source: point.id, target: other });
        }
      }
    }
    return { datasetId: dataset.id, nodes, edges };
  }, [dataset]);

  const [positions, setPositions] = useState<NodePositionMap | null>(null);
  const [status, setStatus] = useState<LayoutStatus>('idle');

  useEffect(() => {
    if (!request) {
      setPositions(null);
      setStatus('idle');
      return;
    }

    const cached = layoutManager.getCached(request.datasetId);
    if (cached) {
      setPositions(cached);
      setStatus('locked');
      return;
    }

    const offCheckpoint = layoutManager.onCheckpoint((cp) => {
      if (layoutManager.getActiveDatasetId() === request.datasetId) {
        setPositions(cp.positions);
      }
    });
    const offSettled = layoutManager.onSettled(() => {
      setStatus('locked');
    });

    setStatus('settling');
    let cancelled = false;
    void layoutManager.requestLayout(request, spoons).then((pos) => {
      if (!cancelled) {
        setPositions(pos);
        setStatus('locked');
      }
    });

    return () => {
      cancelled = true;
      offCheckpoint();
      offSettled();
    };
  }, [request, spoons]);

  return {
    positions,
    status,
    strategy: selectRenderingStrategy(spoons),
    datasetId: request?.datasetId ?? null,
  };
}
