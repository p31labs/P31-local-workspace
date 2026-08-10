/**
 * @file engine/dataConnectors.ts — Universal data types for the dome connector layer
 *
 * Supports any data form:
 * - Coordinates: lat/lon, 3D vector, face index, vertex index
 * - Values: scalar, categorical, multi-dimensional, time-series, graph connections
 */

export interface LatLon {
  lat: number;
  lon: number;
}

export interface TimeSeriesPoint {
  time: number;
  value: number;
}

export type MappingStrategy = 'geo' | 'vector' | 'direct' | 'hash' | 'category' | 'topological' | 'auto';

export interface NormalizedDataPoint {
  id: string;

  // Coordinate systems (mutually exclusive — auto-detected if not set)
  location?: LatLon;
  vector?: { x: number; y: number; z: number };
  faceIndex?: number;
  vertexIndex?: number;

  // Value types (mutually exclusive — auto-detected if not set)
  value?: number;
  category?: string;
  dimensions?: number[];
  timeSeries?: TimeSeriesPoint[];
  connections?: string[];

  // Override auto-detection
  strategy?: MappingStrategy;

  label: string;
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

export interface FaceData {
  faceIndex: number;
  value: number | null;
  color: string;
  label: string;
  category?: string;
  dimensions?: number[];
  timeSeries?: TimeSeriesPoint[];
  connections?: number[];
  metadata?: Record<string, unknown>;
}

export interface VertexData {
  vertexIndex: number;
  value: number | null;
  color: string;
  label: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface DataConnector {
  id: string;
  name: string;
  description?: string;
  fetch(): Promise<NormalizedDataPoint[]>;
}

export type ColorScale = (value: number, min: number, max: number) => string;

export const DEFAULT_COLOR_SCALE: ColorScale = (value, min, max) => {
  const t = max === min ? 0.5 : (value - min) / (max - min);
  const r = Math.round(t * 255);
  const g = Math.round((1 - Math.abs(t - 0.5) * 2) * 255);
  const b = Math.round((1 - t) * 255);
  return `rgb(${r},${g},${b})`;
};

export const CATEGORY_COLORS: Record<string, string> = {
  'food-insecure': '#ff4444',
  'food-secure': '#44ff88',
  'crisis': '#ff4444',
  'warning': '#ffaa22',
  'stable': '#44aaff',
  'default': '#22d3ee',
};
