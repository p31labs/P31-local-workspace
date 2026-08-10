/**
 * @file engine/faceMapper.ts — Maps normalized data points to dome faces
 *
 * Strategy:
 * 1. If data points have lat/lon, find the nearest face centroid via haversine + brute-force.
 * 2. Aggregate multiple points onto the same face (sum, avg, max, or last-write-wins).
 * 3. Map scalar values to colors via a color scale.
 * 4. Return one FaceData entry per face (0..319).
 */

import type { NormalizedDataPoint, FaceData, ColorScale } from './dataConnectors';
import { DOME_FACE_CENTROIDS } from '../math/domeMap';

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

export type AggregationStrategy = 'last' | 'max' | 'avg' | 'sum';

export interface FaceMapperOptions {
  aggregation?: AggregationStrategy;
  colorScale?: ColorScale;
  defaultValue?: number;
}

export function mapDataToFaces(
  points: NormalizedDataPoint[],
  options: FaceMapperOptions = {},
): FaceData[] {
  const { aggregation = 'last', colorScale, defaultValue = 0 } = options;

  const faces: Record<number, { value: number; count: number; label: string; metadata?: Record<string, unknown> }> = {};

  for (const point of points) {
    let targetFace = -1;
    let minDist = Infinity;

    if (point.location) {
      const v = latLonToVector3(point.location.lat, point.location.lon, 1);
      for (let i = 0; i < DOME_FACE_CENTROIDS.length; i++) {
        const c = DOME_FACE_CENTROIDS[i];
        const dx = v.x - c[0];
        const dy = v.y - c[1];
        const dz = v.z - c[2];
        const dist = dx * dx + dy * dy + dz * dz;
        if (dist < minDist) {
          minDist = dist;
          targetFace = i;
        }
      }
    } else {
      targetFace = Math.floor(Math.random() * DOME_FACE_CENTROIDS.length);
    }

    if (targetFace < 0) continue;

    const existing = faces[targetFace];
    if (!existing) {
      faces[targetFace] = { value: point.value, count: 1, label: point.label, metadata: point.metadata };
    } else {
      switch (aggregation) {
        case 'max':
          existing.value = Math.max(existing.value, point.value);
          break;
        case 'sum':
        case 'avg':
          existing.value += point.value;
          existing.count += 1;
          break;
        case 'last':
        default:
          existing.value = point.value;
          break;
      }
      existing.label = point.label;
      existing.metadata = point.metadata;
    }
  }

  const values = Object.values(faces).map(f => f.value);
  const min = values.length ? Math.min(...values) : defaultValue;
  const max = values.length ? Math.max(...values) : defaultValue;
  const scale = colorScale || ((v: number) => (v === 0 ? '#1e293b' : '#22d3ee'));

  const result: FaceData[] = [];
  for (let i = 0; i < DOME_FACE_CENTROIDS.length; i++) {
    const face = faces[i];
    if (face) {
      const avg = aggregation === 'avg' && face.count > 0 ? face.value / face.count : face.value;
      result.push({
        faceIndex: i,
        value: avg,
        color: scale(avg, min, max),
        label: face.label,
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
