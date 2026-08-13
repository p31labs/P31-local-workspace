/**
 * @file engine/dataConnectors.ts — Universal data types for the dome connector layer
 *
 * Supports any data form:
 * - Coordinates: lat/lon, 3D vector, face index, vertex index
 * - Values: scalar, categorical, multi-dimensional, time-series, graph connections
 */

import type { DatasetTarget } from './datasetTypes';

export interface LatLon {
  lat: number;
  lon: number;
}

export interface TimeSeriesPoint {
  time: number;
  value: number;
}

export type MappingStrategy = 'geo' | 'vector' | 'direct' | 'hash' | 'category' | 'topological' | 'auto';

export type PointKind = 'node' | 'edge';

/** Semantic metadata carried on nodes/edges through the whole pipeline. */
export interface PointMetadata {
  /** Domain partition: family | legal | medical | project | other | … */
  category?: string;
  /** Visual prominence tier. */
  criticality?: 'primary' | 'secondary' | 'tertiary';
  /** State-dependent rendering (active | pending | resolved | dormant). */
  temporal?: 'active' | 'pending' | 'resolved' | 'dormant';
  /** Edge weight; scales both path selection and attraction in layout. */
  weight?: number;
  /** Free-form extension surface for connectors. */
  customFields?: Record<string, unknown>;
}

export interface NormalizedDataPoint {
  id: string;

  /** Graph role — defaults to 'node' when absent. */
  type?: PointKind;

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

  // Edge endpoints (when type === 'edge')
  source?: string;
  target?: string;

  // Override auto-detection
  strategy?: MappingStrategy;

  label: string;
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

/** Read the typed semantic metadata off a point, defaulting missing fields. */
export function readPointMetadata(point: NormalizedDataPoint): PointMetadata {
  const m = (point.metadata ?? {}) as PointMetadata;
  return {
    category: m.category ?? point.category,
    criticality: m.criticality ?? 'tertiary',
    temporal: m.temporal ?? 'active',
    weight: m.weight,
    customFields: m.customFields,
  };
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
  /** Source point id — lets the layout engine key settled positions. */
  id?: string;
  metadata?: Record<string, unknown>;
}

// ─── Edge layer ─────────────────────────────────────────────────────────────

export type EdgeAnimation = 'pulse' | 'breathe' | 'subtle-glow' | 'none';

/** Fully-resolved rendering hints for one edge. Renderers apply these verbatim. */
export interface EdgeStyle {
  color: string;
  thickness: number;
  opacity: number;
  animation: EdgeAnimation;
  dasharray?: string;
  glow: boolean;
  pulseIntensity?: number;
}

/** A rendered graph edge: 3D path + style + the metadata that produced it. */
export interface EdgeData {
  source: string;
  target: string;
  /** Ordered 3D polyline from source to target across the dome. */
  vertices: [number, number, number][];
  style: EdgeStyle;
  category: string;
  criticality: string;
  temporal: string;
  weight?: number;
}

// ─── Dataset style guide ────────────────────────────────────────────────────

/** Per-category base style. */
export interface CategoryStyle {
  color?: string;
  thickness?: number;
  opacity?: number;
  animation?: EdgeAnimation;
  glow?: boolean;
}

/** Temporal-state override applied on top of the category base. */
export interface TemporalOverride {
  opacity?: number;
  dasharray?: string;
  pulseIntensity?: number;
  desaturate?: number;
}

/**
 * Declarative, human-auditable visual contract for a dataset's edges.
 * Renderers never hardcode edge logic — they read this guide.
 */
export interface DatasetStyleGuide {
  categories?: Record<string, CategoryStyle>;
  temporalOverrides?: Record<string, TemporalOverride>;
  /** Scales thickness by criticality ('primary' 1.0, 'secondary' 0.7, …). */
  criticalityMultiplier?: Record<string, number>;
}

export const DEFAULT_EDGE_STYLE: EdgeStyle = {
  color: '#22d3ee',
  thickness: 1.5,
  opacity: 0.8,
  animation: 'none',
  glow: false,
};

export interface DataConnector {
  id: string;
  name: string;
  description?: string;
  /** Which dome layer(s) this source maps onto (face / vertex / both). */
  target?: DatasetTarget;
  /** Declarative edge styling contract carried into the dataset. */
  styleGuide?: DatasetStyleGuide;
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
