/**
 * @file engine/dataConnectors.ts — Base types for the universal data connector layer
 */

export interface LatLon {
  lat: number;
  lon: number;
}

export interface NormalizedDataPoint {
  id: string;
  location?: LatLon;
  value: number;
  label: string;
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

export interface FaceData {
  faceIndex: number;
  value: number | null;
  color: string;
  label: string;
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
