/**
 * @file store/datasetStore.ts — Zustand store for dataset management
 *
 * Manages 1–2 active datasets at a time (one face layer + one vertex layer),
 * per domeConfig.data.maxActiveDatasets. Raw points persist to localStorage;
 * derived face/vertex render arrays and time-series frames are regenerated on
 * load so large payloads don't bloat storage.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DatasetStore, Dataset } from '../engine/datasetTypes';
import type { FaceData, VertexData, EdgeData, DatasetStyleGuide } from '../engine/dataConnectors';
import { mapDataToFaces, mapDataToVertices, mapDataToEdges, type AggregationStrategy } from '../engine/faceMapper';
import { buildTimelineFrames } from '../engine/timeSeries';
import { domeConfig } from '../config/domeConfig';

const STORAGE_KEY = 'spaceship-earth:datasets:v1';

function generateId(): string {
  return `ds_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function layerCount(frames: FaceData[][] | VertexData[][] | EdgeData[][] | undefined): number {
  return frames?.length ?? 0;
}

export const useDatasetStore = create<DatasetStore>()(
  persist(
    (set, get) => ({
      datasets: [],
      activeFaceDatasetId: null,
      activeVertexDatasetId: null,
      isLoading: false,
      lastError: null,
      currentTimeIndex: 0,
      isPlaying: false,
      playbackSpeed: 1,
      aggregation: domeConfig.data.defaultAggregation as AggregationStrategy,
      buckyMode: false,

      addDataset: (dataset) => {
        const id = generateId();
        const entry: Dataset = {
          ...dataset,
          id,
          status: 'idle',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({ datasets: [...state.datasets, entry] }));
        return id;
      },

      removeDataset: (id) => {
        const state = get();
        // Release derived render data + timeline frames before dropping the record.
        get().unloadDataset(id);
        set({
          datasets: state.datasets.filter((d) => d.id !== id),
          currentTimeIndex: 0,
          isPlaying: false,
        });
      },

      /**
       * Release the in-memory derived render data (face/vertex/edge arrays and
       * time-series frames) for a dataset and deactivate it if it is the active
       * layer. Raw points persist in the store; derived data regenerates on the
       * next `loadDataset`. This is the memory-unload path — swapping datasets
       * does not accumulate large render arrays.
       */
      unloadDataset: (id) => {
        const state = get();
        if (!state.datasets.some((d) => d.id === id)) return;
        get().updateDataset(id, {
          status: 'idle',
          faceData: undefined,
          vertexData: undefined,
          edgeData: undefined,
          faceFrames: undefined,
          vertexFrames: undefined,
          edgeFrames: undefined,
          timestamps: undefined,
        });
        set({
          activeFaceDatasetId: state.activeFaceDatasetId === id ? null : state.activeFaceDatasetId,
          activeVertexDatasetId: state.activeVertexDatasetId === id ? null : state.activeVertexDatasetId,
          currentTimeIndex: 0,
          isPlaying: false,
        });
      },

      setActiveFaceDataset: (id) => {
        set({ activeFaceDatasetId: id, currentTimeIndex: 0, isPlaying: false });
        if (id) void get().loadDataset(id);
      },

      setActiveVertexDataset: (id) => {
        set({ activeVertexDatasetId: id, currentTimeIndex: 0, isPlaying: false });
        if (id) void get().loadDataset(id);
      },

      updateDataset: (id, patch) => {
        set((state) => ({
          datasets: state.datasets.map((d) =>
            d.id === id ? { ...d, ...patch, updatedAt: Date.now() } : d,
          ),
        }));
      },

      clearAll: () => {
        const state = get();
        for (const d of state.datasets) get().unloadDataset(d.id);
        set({
          datasets: [],
          activeFaceDatasetId: null,
          activeVertexDatasetId: null,
          lastError: null,
          currentTimeIndex: 0,
          isPlaying: false,
        });
      },

      loadDataset: async (id) => {
        const state = get();
        const dataset = state.datasets.find((d) => d.id === id);
        if (!dataset) return;
        if (dataset.status === 'ready' && (dataset.faceData || dataset.vertexData || dataset.edgeData)) return;

        set({ isLoading: true, lastError: null });
        try {
          const aggregation = get().aggregation;
          const hasGraph =
            dataset.data.some((p) => p.type === 'edge' || (p.connections?.length ?? 0) > 0);
          const wantsEdges = dataset.target !== 'face' || hasGraph;
          const faceData: FaceData[] | undefined =
            dataset.target === 'face' || dataset.target === 'both'
              ? mapDataToFaces(dataset.data, { aggregation })
              : undefined;
          const vertexData: VertexData[] | undefined =
            dataset.target === 'vertex' || dataset.target === 'both'
              ? mapDataToVertices(dataset.data, { aggregation, categoryColors: dataset.categoryColors })
              : undefined;
          const edgeData: EdgeData[] | undefined =
            wantsEdges ? mapDataToEdges(dataset.data, dataset.styleGuide) : undefined;

          const timeline = buildTimelineFrames(dataset.data, aggregation, dataset.target, {
            styleGuide: dataset.styleGuide,
            includeEdges: wantsEdges,
          });

          // On a timeline, initial render shows frame 0 so the dome and the
          // scrubber agree from the start.
          const initialFaceData = timeline?.faceFrames?.length ? timeline.faceFrames[0] : faceData;
          const initialVertexData = timeline?.vertexFrames?.length ? timeline.vertexFrames[0] : vertexData;
          const initialEdgeData = timeline?.edgeFrames?.length ? timeline.edgeFrames[0] : edgeData;

          get().updateDataset(id, {
            status: 'ready',
            faceData: initialFaceData,
            vertexData: initialVertexData,
            edgeData: initialEdgeData,
            faceFrames: timeline?.faceFrames,
            vertexFrames: timeline?.vertexFrames,
            edgeFrames: timeline?.edgeFrames,
            timestamps: timeline?.timestamps,
            error: undefined,
          });
          set({ currentTimeIndex: timeline ? 0 : get().currentTimeIndex });
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to load dataset';
          get().updateDataset(id, { status: 'error', error });
          set({ lastError: error });
        } finally {
          set({ isLoading: false });
        }
      },

      refreshDataset: async (id) => {
        const dataset = get().datasets.find((d) => d.id === id);
        if (!dataset) return;
        get().updateDataset(id, { status: 'idle' });
        await get().loadDataset(id);
      },

      setCurrentTimeIndex: (index) => {
        const state = get();
        const faceDataset = state.datasets.find((d) => d.id === state.activeFaceDatasetId);
        const vertexDataset = state.datasets.find((d) => d.id === state.activeVertexDatasetId);
        const maxFace = layerCount(faceDataset?.faceFrames);
        const maxVertex = layerCount(vertexDataset?.vertexFrames);
        const edgeSource = faceDataset?.edgeFrames?.length ? faceDataset : vertexDataset?.edgeFrames?.length ? vertexDataset : null;
        const maxEdge = layerCount(edgeSource?.edgeFrames);
        const max = Math.max(maxFace, maxVertex, maxEdge);
        if (max === 0) return;

        const clamped = Math.max(0, Math.min(index, max - 1));
        const patches: { id: string; patch: Partial<Dataset> }[] = [];
        if (maxFace > 0 && faceDataset?.faceFrames?.[clamped]) {
          patches.push({ id: faceDataset.id, patch: { faceData: faceDataset.faceFrames[clamped] } });
        }
        if (maxVertex > 0 && vertexDataset?.vertexFrames?.[clamped]) {
          patches.push({ id: vertexDataset.id, patch: { vertexData: vertexDataset.vertexFrames[clamped] } });
        }
        if (maxEdge > 0 && edgeSource?.edgeFrames?.[clamped]) {
          patches.push({ id: edgeSource.id, patch: { edgeData: edgeSource.edgeFrames[clamped] } });
        }
        set((s) => ({
          currentTimeIndex: clamped,
          datasets: s.datasets.map((d) => {
            const p = patches.find((x) => x.id === d.id);
            return p ? { ...d, ...p.patch } : d;
          }),
        }));
      },

      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

      setAggregation: (aggregation) => {
        set({ aggregation, currentTimeIndex: 0, isPlaying: false });
        const state = get();
        const activeIds = [state.activeFaceDatasetId, state.activeVertexDatasetId].filter(
          (x): x is string => x !== null,
        );
        for (const id of activeIds) void get().refreshDataset(id);
      },

      setBuckyMode: (mode) => set({ buckyMode: mode }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        datasets: state.datasets.map((d) => ({
          ...d,
          // Regenerate derived render data on next load — don't persist it.
          faceData: undefined,
          vertexData: undefined,
          edgeData: undefined,
          faceFrames: undefined,
          vertexFrames: undefined,
          edgeFrames: undefined,
          timestamps: undefined,
          status: 'idle',
          error: undefined,
        })),
        activeFaceDatasetId: state.activeFaceDatasetId,
        activeVertexDatasetId: state.activeVertexDatasetId,
        aggregation: state.aggregation,
        buckyMode: state.buckyMode,
      }),
    },
  ),
);

// ─── Selector hooks ───────────────────────────────────────────────────────

/** Face render data of the active face dataset (empty array when none). */
export function useActiveFaceData(): FaceData[] {
  const activeId = useDatasetStore((s) => s.activeFaceDatasetId);
  const dataset = useDatasetStore((s) => s.datasets.find((d) => d.id === activeId));
  return dataset?.faceData ?? [];
}

/** Vertex render data of the active vertex dataset (empty array when none). */
export function useActiveVertexData(): VertexData[] {
  const activeId = useDatasetStore((s) => s.activeVertexDatasetId);
  const dataset = useDatasetStore((s) => s.datasets.find((d) => d.id === activeId));
  return dataset?.vertexData ?? [];
}

/** Edge render data of the active graph dataset (empty array when none). */
export function useActiveEdgeData(): EdgeData[] {
  const activeFaceId = useDatasetStore((s) => s.activeFaceDatasetId);
  const activeVertexId = useDatasetStore((s) => s.activeVertexDatasetId);
  const datasets = useDatasetStore((s) => s.datasets);
  const faceDs = datasets.find((d) => d.id === activeFaceId);
  const vertexDs = datasets.find((d) => d.id === activeVertexId);
  if (faceDs?.edgeData?.length) return faceDs.edgeData;
  return vertexDs?.edgeData ?? [];
}

/** The active face dataset descriptor (or null). */
export function useActiveFaceDataset(): Dataset | null {
  const activeId = useDatasetStore((s) => s.activeFaceDatasetId);
  return useDatasetStore((s) => s.datasets.find((d) => d.id === activeId) ?? null);
}

export interface ActiveTimeline {
  timestamps: number[];
  frameCount: number;
  currentTimeIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  setCurrentTimeIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
}

/**
 * Playback timeline for whichever layer (face first, then vertex) is a
 * time-series. Returns null when nothing active is time-based.
 */
export function useActiveTimeline(): ActiveTimeline | null {
  const activeFaceId = useDatasetStore((s) => s.activeFaceDatasetId);
  const activeVertexId = useDatasetStore((s) => s.activeVertexDatasetId);
  const datasets = useDatasetStore((s) => s.datasets);
  const currentTimeIndex = useDatasetStore((s) => s.currentTimeIndex);
  const isPlaying = useDatasetStore((s) => s.isPlaying);
  const playbackSpeed = useDatasetStore((s) => s.playbackSpeed);

  const faceDs = datasets.find((d) => d.id === activeFaceId);
  const vertexDs = datasets.find((d) => d.id === activeVertexId);
  const timelineDs = faceDs?.timestamps?.length ? faceDs : vertexDs?.timestamps?.length ? vertexDs : null;

  if (!timelineDs?.timestamps || timelineDs.timestamps.length < 2) return null;

  return {
    timestamps: timelineDs.timestamps,
    frameCount: timelineDs.timestamps.length,
    currentTimeIndex,
    isPlaying,
    playbackSpeed,
    setCurrentTimeIndex: (i) => useDatasetStore.getState().setCurrentTimeIndex(i),
    setIsPlaying: (p) => useDatasetStore.getState().setIsPlaying(p),
    setPlaybackSpeed: (s) => useDatasetStore.getState().setPlaybackSpeed(s),
  };
}
