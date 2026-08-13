/**
 * @file engine/datasetTypes.ts — Universal dataset types for Spaceship Earth
 *
 * A Dataset is a self-contained bundle of normalized data points plus the
 * derived face/vertex render data. The dataset store manages 1–2 active
 * datasets at a time (one face layer + one vertex layer), each acting as an
 * independent overlay on the dome.
 */

import type { NormalizedDataPoint, FaceData, VertexData, EdgeData, ColorScale, DatasetStyleGuide } from './dataConnectors';
import type { AggregationStrategy } from './faceMapper';

export type DatasetSource = 'upload' | 'url' | 'local';
export type DatasetTarget = 'face' | 'vertex' | 'both';
export type DatasetStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface DatasetSchema {
  fields: string[];
  hasLatLon: boolean;
  hasValue: boolean;
  hasCategory: boolean;
  hasLabel: boolean;
  hasDimensions: boolean;
  hasConnections: boolean;
  hasFaceIndex: boolean;
  hasVertexIndex: boolean;
  hasVector: boolean;
  hasTimeSeries: boolean;
  detectedTarget: DatasetTarget;
  sample: NormalizedDataPoint | null;
}

export interface Dataset {
  id: string;
  name: string;
  source: DatasetSource;
  /** Source registry connector that produced this dataset, if any. */
  connectorId?: string;
  target: DatasetTarget;
  status: DatasetStatus;
  /** Raw normalized points (persisted, compact). */
  data: NormalizedDataPoint[];
  /** Derived render data — regenerated on load, not persisted. */
  faceData?: FaceData[];
  vertexData?: VertexData[];
  edgeData?: EdgeData[];
  /** Time-series frames — one FaceData[] per timestamp, regenerated, not persisted. */
  faceFrames?: FaceData[][];
  vertexFrames?: VertexData[][];
  edgeFrames?: EdgeData[][];
  /** Sorted unique timestamps (ms epoch) for the active dataset, if any. */
  timestamps?: number[];
  colorScale?: ColorScale;
  /** Declarative edge styling contract (category / temporal / criticality). */
  styleGuide?: DatasetStyleGuide;
  /** Per-category colors for vertex nodes (category → CSS color). */
  categoryColors?: Record<string, string>;
  visible: boolean;
  opacity: number;
  createdAt: number;
  updatedAt: number;
  schema?: DatasetSchema;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface DatasetStoreState {
  datasets: Dataset[];
  activeFaceDatasetId: string | null;
  activeVertexDatasetId: string | null;
  isLoading: boolean;
  lastError: string | null;
  /** Playback state (global) — time index into the active dataset's frames. */
  currentTimeIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  /** Aggregation strategy for multi-value faces/vertices. */
  aggregation: AggregationStrategy;
  /** Unfold the dome into a flat Dymaxion map. */
  buckyMode: boolean;
}

export interface DatasetStoreActions {
  addDataset: (dataset: Omit<Dataset, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => string;
  removeDataset: (id: string) => void;
  /** Release derived render data + deactivate, keeping raw points for reload. */
  unloadDataset: (id: string) => void;
  setActiveFaceDataset: (id: string | null) => void;
  setActiveVertexDataset: (id: string | null) => void;
  updateDataset: (id: string, patch: Partial<Dataset>) => void;
  clearAll: () => void;
  loadDataset: (id: string) => Promise<void>;
  refreshDataset: (id: string) => Promise<void>;
  /** Rewind playback to the start of a dataset (recomputes its frames). */
  setCurrentTimeIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  /** Re-map active dataset(s) with a new aggregation strategy. */
  setAggregation: (aggregation: AggregationStrategy) => void;
  setBuckyMode: (mode: boolean) => void;
}

export type DatasetStore = DatasetStoreState & DatasetStoreActions;
