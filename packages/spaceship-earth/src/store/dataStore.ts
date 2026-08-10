/**
 * @file store/dataStore.ts — Zustand store for dome data layer
 *
 * Manages:
 * - Active data source / connector
 * - Face data array (one entry per dome face)
 * - Loading / error state
 * - Color scale configuration
 */

import { create } from 'zustand';
import type { FaceData, DataConnector } from '../engine/dataConnectors';

export interface DataStore {
  faceData: FaceData[];
  activeConnector: DataConnector | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  aggregation: 'last' | 'max' | 'avg' | 'sum';
  setFaceData: (data: FaceData[]) => void;
  setActiveConnector: (connector: DataConnector | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refresh: () => Promise<void>;
  setAggregation: (strategy: 'last' | 'max' | 'avg' | 'sum') => void;
}

export const useDataStore = create<DataStore>((set, get) => ({
  faceData: [],
  activeConnector: null,
  loading: false,
  error: null,
  lastUpdated: null,
  aggregation: 'last',

  setFaceData: (data) => set({ faceData: data, lastUpdated: Date.now() }),
  setActiveConnector: (connector) => set({ activeConnector: connector }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  setAggregation: (strategy) => set({ aggregation: strategy }),

  refresh: async () => {
    const { activeConnector, aggregation } = get();
    if (!activeConnector) return;

    set({ loading: true, error: null });
    try {
      const points = await activeConnector.fetch();
      const { mapDataToFaces } = await import('../engine/faceMapper');
      const faceData = mapDataToFaces(points, { aggregation });
      set({ faceData, loading: false, lastUpdated: Date.now() });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error', loading: false });
    }
  },
}));
