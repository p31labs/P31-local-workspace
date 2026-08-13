/**
 * @file engine/faceMapper.ts — Universal mapping strategies for dome faces and vertices
 *
 * Strategies:
 * - geo:        lat/lon → nearest face centroid (haversine)
 * - vector:     3D vector → nearest face by 3D distance
 * - direct:     faceIndex or vertexIndex → exact target
 * - hash:       id/label → deterministic face index
 * - category:   category string → face by hash
 * - topological: connections → graph edges between faces/vertices
 * - auto:       detect strategy from data point fields
 */

import type {
  NormalizedDataPoint,
  FaceData,
  VertexData,
  EdgeData,
  EdgeStyle,
  MappingStrategy,
  TimeSeriesPoint,
  DatasetStyleGuide,
} from './dataConnectors';
import { DEFAULT_EDGE_STYLE, readPointMetadata } from './dataConnectors';
import { DOME_FACE_CENTROIDS, DOME_VERTICES, shortestPath } from '../math/domeMap';

const EARTH_RADIUS_KM = 6371;

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const c = 2 * Math.asin(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon));
  return EARTH_RADIUS_KM * c;
}

function latLonToVector3(lat: number, lon: number, radius: number): { x: number; y: number; z: number } {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return {
    x: -(radius * Math.sin(phi) * Math.cos(theta)),
    z: radius * Math.sin(phi) * Math.sin(theta),
    y: radius * Math.cos(phi),
  };
}

function hashStringToIndex(str: string, max: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % max;
}

function findNearestFace(v: { x: number; y: number; z: number }): number {
  let minDist = Infinity;
  let target = 0;
  for (let i = 0; i < DOME_FACE_CENTROIDS.length; i++) {
    const c = DOME_FACE_CENTROIDS[i];
    const dx = v.x - c[0];
    const dy = v.y - c[1];
    const dz = v.z - c[2];
    const dist = dx * dx + dy * dy + dz * dz;
    if (dist < minDist) {
      minDist = dist;
      target = i;
    }
  }
  return target;
}

function findNearestVertex(v: { x: number; y: number; z: number }): number {
  let minDist = Infinity;
  let target = 0;
  for (let i = 0; i < DOME_VERTICES.length; i++) {
    const c = DOME_VERTICES[i];
    const dx = v.x - c[0];
    const dy = v.y - c[1];
    const dz = v.z - c[2];
    const dist = dx * dx + dy * dy + dz * dz;
    if (dist < minDist) {
      minDist = dist;
      target = i;
    }
  }
  return target;
}

export type AggregationStrategy = 'last' | 'max' | 'avg' | 'sum';

/** Diverging cyan→violet→amber gradient shared by the dome and the legend. */
export function defaultColorScale(value: number, min: number, max: number): string {
  if (max === min) return value === 0 ? '#1e293b' : '#22d3ee';
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const stops = ['#0f172a', '#22d3ee', '#6366f1', '#a855f7', '#f59e0b'];
  const scaled = t * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(scaled));
  const f = scaled - i;
  const c0 = hexToRgb(stops[i]);
  const c1 = hexToRgb(stops[i + 1]);
  const r = Math.round(c0.r + (c1.r - c0.r) * f);
  const g = Math.round(c0.g + (c1.g - c0.g) * f);
  const b = Math.round(c0.b + (c1.b - c0.b) * f);
  return `rgb(${r},${g},${b})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export interface FaceMapperOptions {
  aggregation?: AggregationStrategy;
  colorScale?: (value: number, min: number, max: number) => string;
  defaultValue?: number;
  categoryColors?: Record<string, string>;
}

export interface VertexMapperOptions {
  aggregation?: AggregationStrategy;
  colorScale?: (value: number, min: number, max: number) => string;
  defaultValue?: number;
  /** Per-category colors (category → CSS color); wins over the value scale. */
  categoryColors?: Record<string, string>;
}

function resolveStrategy(point: NormalizedDataPoint): MappingStrategy {
  if (point.strategy && point.strategy !== 'auto') return point.strategy;
  if (point.faceIndex !== undefined) return 'direct';
  if (point.vertexIndex !== undefined) return 'direct';
  if (point.location) return 'geo';
  if (point.vector) return 'vector';
  if (point.category) return 'category';
  if (point.connections) return 'topological';
  if (point.id || point.label) return 'hash';
  return 'geo';
}

export function mapPointToFace(point: NormalizedDataPoint): number {
  const strategy = resolveStrategy(point);

  switch (strategy) {
    case 'direct':
      if (point.faceIndex !== undefined && point.faceIndex >= 0 && point.faceIndex < DOME_FACE_CENTROIDS.length) {
        return point.faceIndex;
      }
      break;
    case 'vector': {
      if (point.vector) {
        return findNearestFace(point.vector);
      }
      break;
    }
    case 'category':
    case 'hash': {
      const key = point.category || point.id || point.label;
      if (key) return hashStringToIndex(key, DOME_FACE_CENTROIDS.length);
      break;
    }
    case 'geo':
    default: {
      if (point.location) {
        const v = latLonToVector3(point.location.lat, point.location.lon, 1);
        return findNearestFace(v);
      }
      break;
    }
  }

  return hashStringToIndex(point.id || point.label || 'default', DOME_FACE_CENTROIDS.length);
}

export function mapPointToVertex(point: NormalizedDataPoint): number {
  const strategy = resolveStrategy(point);

  switch (strategy) {
    case 'direct':
      if (point.vertexIndex !== undefined && point.vertexIndex >= 0 && point.vertexIndex < DOME_VERTICES.length) {
        return point.vertexIndex;
      }
      break;
    case 'vector': {
      if (point.vector) {
        return findNearestVertex(point.vector);
      }
      break;
    }
    case 'geo': {
      if (point.location) {
        const v = latLonToVector3(point.location.lat, point.location.lon, 1);
        return findNearestVertex(v);
      }
      break;
    }
    case 'category':
    case 'hash': {
      const key = point.category || point.id || point.label;
      if (key) return hashStringToIndex(key, DOME_VERTICES.length);
      break;
    }
  }

  return hashStringToIndex(point.id || point.label || 'default', DOME_VERTICES.length);
}

export function mapDataToFaces(
  points: NormalizedDataPoint[],
  options: FaceMapperOptions = {},
): FaceData[] {
  const { aggregation = 'last', colorScale, defaultValue = 0, categoryColors } = options;

  const faces: Record<number, {
    value: number;
    count: number;
    label: string;
    category?: string;
    dimensions?: number[];
    timeSeries?: TimeSeriesPoint[];
    connections?: number[];
    metadata?: Record<string, unknown>;
  }> = {};

  for (const point of points) {
    const targetFace = mapPointToFace(point);
    if (targetFace < 0 || targetFace >= DOME_FACE_CENTROIDS.length) continue;

    const existing = faces[targetFace];
    if (!existing) {
      faces[targetFace] = {
        value: point.value ?? 0,
        count: 1,
        label: point.label,
        category: point.category,
        dimensions: point.dimensions,
        timeSeries: point.timeSeries,
        connections: point.connections ? point.connections.map(c => hashStringToIndex(c, DOME_FACE_CENTROIDS.length)) : undefined,
        metadata: point.metadata,
      };
    } else {
      switch (aggregation) {
        case 'max':
          existing.value = Math.max(existing.value, point.value ?? 0);
          break;
        case 'sum':
          existing.value += point.value ?? 0;
          existing.count += 1;
          break;
        case 'avg':
          existing.value += point.value ?? 0;
          existing.count += 1;
          break;
        case 'last':
        default:
          existing.value = point.value ?? existing.value;
          break;
      }
      existing.label = point.label;
      if (point.category) existing.category = point.category;
      if (point.dimensions) existing.dimensions = point.dimensions;
      if (point.timeSeries) existing.timeSeries = point.timeSeries;
      if (point.connections) existing.connections = point.connections.map(c => hashStringToIndex(c, DOME_FACE_CENTROIDS.length));
      existing.metadata = point.metadata;
    }
  }

  const values = Object.values(faces).map(f => f.value);
  const min = values.length ? Math.min(...values) : defaultValue;
  const max = values.length ? Math.max(...values) : defaultValue;
  const scale = colorScale || defaultColorScale;
  const catColors = categoryColors || {};

  const result: FaceData[] = [];
  for (let i = 0; i < DOME_FACE_CENTROIDS.length; i++) {
    const face = faces[i];
    if (face) {
      const avg = aggregation === 'avg' && face.count > 0 ? face.value / face.count : face.value;
      const color = face.category
        ? (catColors[face.category] || '#22d3ee')
        : scale(avg, min, max);
      result.push({
        faceIndex: i,
        value: avg,
        color,
        label: face.label,
        category: face.category,
        dimensions: face.dimensions,
        timeSeries: face.timeSeries,
        connections: face.connections,
        metadata: face.metadata,
      });
    } else {
      result.push({
        faceIndex: i,
        value: null,
        color: '#0f172a',
        label: '',
      });
    }
  }

  return result;
}

export function mapDataToVertices(
  points: NormalizedDataPoint[],
  options: VertexMapperOptions = {},
): VertexData[] {
  const { aggregation = 'last', colorScale, defaultValue = 0 } = options;

  const vertices: Record<number, { value: number; count: number; label: string; category?: string; id?: string; metadata?: Record<string, unknown> }> = {};

  for (const point of points) {
    const targetVertex = mapPointToVertex(point);
    if (targetVertex < 0 || targetVertex >= DOME_VERTICES.length) continue;

    const existing = vertices[targetVertex];
    if (!existing) {
      vertices[targetVertex] = {
        value: point.value ?? 0,
        count: 1,
        label: point.label,
        category: point.category,
        id: point.id,
        metadata: point.metadata,
      };
    } else {
      switch (aggregation) {
        case 'max':
          existing.value = Math.max(existing.value, point.value ?? 0);
          break;
        case 'sum':
          existing.value += point.value ?? 0;
          existing.count += 1;
          break;
        case 'avg':
          existing.value += point.value ?? 0;
          existing.count += 1;
          break;
        case 'last':
        default:
          existing.value = point.value ?? existing.value;
          break;
      }
      existing.label = point.label;
      if (point.category) existing.category = point.category;
      existing.id = point.id;
      existing.metadata = point.metadata;
    }
  }

  const values = Object.values(vertices).map(v => v.value);
  const min = values.length ? Math.min(...values) : defaultValue;
  const max = values.length ? Math.max(...values) : defaultValue;
  const scale = colorScale || ((v: number) => (v === 0 ? '#1e293b' : '#22d3ee'));
  const catColors = options.categoryColors || {};

  const result: VertexData[] = [];
  for (let i = 0; i < DOME_VERTICES.length; i++) {
    const v = vertices[i];
    if (v) {
      const avg = aggregation === 'avg' && v.count > 0 ? v.value / v.count : v.value;
      result.push({
        vertexIndex: i,
        value: avg,
        color: v.category ? (catColors[v.category] ?? scale(avg, min, max)) : scale(avg, min, max),
        label: v.label,
        category: v.category,
        id: v.id,
        metadata: v.metadata,
      });
    } else {
      result.push({
        vertexIndex: i,
        value: null,
        color: '#0f172a',
        label: '',
      });
    }
  }

  return result;
}

// ─── Edge mapping ───────────────────────────────────────────────────────────

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** Merge category base style + temporal override + criticality multiplier. */
export function mergeEdgeStyle(
  category: string,
  criticality: string,
  temporal: string,
  styleGuide?: DatasetStyleGuide,
): EdgeStyle {
  const cat = styleGuide?.categories?.[category] ?? {};
  const temp = styleGuide?.temporalOverrides?.[temporal] ?? {};
  const mult = styleGuide?.criticalityMultiplier?.[criticality] ?? 1;

  return {
    color: cat.color ?? DEFAULT_EDGE_STYLE.color,
    thickness: Math.max(0.2, (cat.thickness ?? DEFAULT_EDGE_STYLE.thickness) * mult),
    opacity: clamp01((cat.opacity ?? DEFAULT_EDGE_STYLE.opacity) * (temp.opacity ?? 1)),
    animation: cat.animation ?? DEFAULT_EDGE_STYLE.animation,
    dasharray: temp.dasharray,
    glow: cat.glow ?? DEFAULT_EDGE_STYLE.glow,
    pulseIntensity: temp.pulseIntensity,
  };
}

interface EdgePointRecord {
  source: string;
  target: string;
  category: string;
  criticality: string;
  temporal: string;
  weight?: number;
}

/**
 * Map a dataset's node/edge points to the edge layer.
 *
 * Edges come from either explicit `type: 'edge'` points (source/target node
 * ids) or implicit `connections[]` on node points. Each edge's 3D path follows
 * the geodesic wireframe (shortestPath) between the endpoint vertex positions,
 * and its style is derived entirely from metadata + the dataset style guide.
 */
export function mapDataToEdges(
  points: NormalizedDataPoint[],
  styleGuide?: DatasetStyleGuide,
): EdgeData[] {
  const nodeById = new Map<string, { idx: number; pos: [number, number, number] }>();
  const nodeByLabel = new Map<string, { idx: number; pos: [number, number, number] }>();

  for (const point of points) {
    if (point.type === 'edge') continue;
    const idx = mapPointToVertex(point);
    if (idx < 0 || idx >= DOME_VERTICES.length) continue;
    const pos: [number, number, number] = [
      DOME_VERTICES[idx][0],
      DOME_VERTICES[idx][1],
      DOME_VERTICES[idx][2],
    ];
    nodeById.set(point.id, { idx, pos });
    if (point.label) nodeByLabel.set(point.label, { idx, pos });
  }

  const resolve = (ref: string): { idx: number; pos: [number, number, number] } | undefined =>
    nodeById.get(ref) ?? nodeByLabel.get(ref);

  const records: EdgePointRecord[] = [];

  for (const point of points) {
    if (point.type === 'edge') {
      if (!point.source || !point.target) continue;
      const meta = readPointMetadata(point);
      records.push({
        source: point.source,
        target: point.target,
        category: meta.category ?? 'other',
        criticality: meta.criticality ?? 'tertiary',
        temporal: meta.temporal ?? 'active',
        weight: meta.weight,
      });
      continue;
    }
    if (point.connections?.length) {
      const meta = readPointMetadata(point);
      for (const other of point.connections) {
        records.push({
          source: point.id,
          target: other,
          category: meta.category ?? 'other',
          criticality: meta.criticality ?? 'tertiary',
          temporal: meta.temporal ?? 'active',
          weight: meta.weight,
        });
      }
    }
  }

  const seen = new Set<string>();
  const result: EdgeData[] = [];

  for (const rec of records) {
    const key = rec.source < rec.target ? `${rec.source}|${rec.target}` : `${rec.target}|${rec.source}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const a = resolve(rec.source);
    const b = resolve(rec.target);
    if (!a || !b) continue;

    let path: number[] | null = null;
    if (a.idx !== b.idx) path = shortestPath(a.idx, b.idx);

    let vertices: [number, number, number][];
    if (path) {
      vertices = path.map((vi) => [
        DOME_VERTICES[vi][0],
        DOME_VERTICES[vi][1],
        DOME_VERTICES[vi][2],
      ]);
    } else {
      vertices = [a.pos, b.pos];
    }

    result.push({
      source: rec.source,
      target: rec.target,
      vertices,
      style: mergeEdgeStyle(rec.category, rec.criticality, rec.temporal, styleGuide),
      category: rec.category,
      criticality: rec.criticality,
      temporal: rec.temporal,
      weight: rec.weight,
    });
  }

  return result;
}
