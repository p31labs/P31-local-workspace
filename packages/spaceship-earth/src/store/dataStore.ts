/**
 * @file store/dataStore.ts — Zustand store for dome data layer
 *
 * Manages:
 * - Active data source / connector
 * - Face data array (one entry per dome face)
 * - Vertex data array (one entry per dome vertex)
 * - Loading / error state
 * - Color scale configuration
 * - Time-series playback state
 */

import { create } from 'zustand';
import type { FaceData, VertexData, DataConnector, TimeSeriesPoint } from '../engine/dataConnectors';

export interface DataStore {
  faceData: FaceData[];
  vertexData: VertexData[];
  activeConnector: DataConnector | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  aggregation: 'last' | 'max' | 'avg' | 'sum';
  timeSeries: TimeSeriesPoint[];
  isPlaying: boolean;
  currentTimeIndex: number;
  setFaceData: (data: FaceData[]) => void;
  setVertexData: (data: VertexData[]) => void;
  setActiveConnector: (connector: DataConnector | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refresh: () => Promise<void>;
  setAggregation: (strategy: 'last' | 'max' | 'avg' | 'sum') => void;
  setTimeSeries: (data: TimeSeriesPoint[]) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTimeIndex: (index: number) => void;
}

export const useDataStore = create<DataStore>((set, get) => ({
  faceData: [],
  vertexData: [],
  activeConnector: null,
  loading: false,
  error: null,
  lastUpdated: null,
  aggregation: 'last',
  timeSeries: [],
  isPlaying: false,
  currentTimeIndex: 0,

  setFaceData: (data) => set({ faceData: data, lastUpdated: Date.now() }),
  setVertexData: (data) => set({ vertexData: data }),
  setActiveConnector: (connector) => set({ activeConnector: connector }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  setAggregation: (strategy) => set({ aggregation: strategy }),

  setTimeSeries: (data) => set({ timeSeries: data }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTimeIndex: (index) => set({ currentTimeIndex: index }),

  refresh: async () => {
    const { activeConnector, aggregation } = get();
    if (!activeConnector) return;

    set({ loading: true, error: null });
    try {
      const points = await activeConnector.fetch();
      const { mapDataToFaces, mapDataToVertices } = await import('../engine/faceMapper');
      const faceData = mapDataToFaces(points, { aggregation });
      const vertexData = mapDataToVertices(points, { aggregation });

      // Extract time-series if present
      const allTimeSeries: TimeSeriesPoint[] = [];
      for (const p of points) {
        if (p.timeSeries) {
          for (const ts of p.timeSeries) {
            allTimeSeries.push(ts);
          }
        }
      }
      allTimeSeries.sort((a, b) => a.time - b.time);

      set({
        faceData,
        vertexData,
        loading: false,
        lastUpdated: Date.now(),
        timeSeries: allTimeSeries,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error', loading: false });
    }
  },
}));
