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

import type { NormalizedDataPoint, FaceData, VertexData, MappingStrategy, TimeSeriesPoint } from './dataConnectors';
import { DOME_FACE_CENTROIDS, DOME_VERTICES, DOME_EDGES } from '../math/domeMap';

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
  const scale = colorScale || ((v: number) => (v === 0 ? '#1e293b' : '#22d3ee'));
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

  const vertices: Record<number, { value: number; count: number; label: string; category?: string; metadata?: Record<string, unknown> }> = {};

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
      existing.metadata = point.metadata;
    }
  }

  const values = Object.values(vertices).map(v => v.value);
  const min = values.length ? Math.min(...values) : defaultValue;
  const max = values.length ? Math.max(...values) : defaultValue;
  const scale = colorScale || ((v: number) => (v === 0 ? '#1e293b' : '#22d3ee'));

  const result: VertexData[] = [];
  for (let i = 0; i < DOME_VERTICES.length; i++) {
    const v = vertices[i];
    if (v) {
      const avg = aggregation === 'avg' && v.count > 0 ? v.value / v.count : v.value;
      result.push({
        vertexIndex: i,
        value: avg,
        color: scale(avg, min, max),
        label: v.label,
        category: v.category,
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
