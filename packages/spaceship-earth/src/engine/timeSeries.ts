/**
 * @file engine/timeSeries.ts — Time-series frame generation for dataset playback
 *
 * A timeline is a sorted list of unique timestamps present on the dataset's
 * normalized points. Each frame is the face/vertex map of the points that share
 * that timestamp, so playback animates by swapping the active frame.
 */

import type { NormalizedDataPoint, FaceData, VertexData, EdgeData, DatasetStyleGuide } from './dataConnectors';
import { mapDataToFaces, mapDataToVertices, mapDataToEdges, type AggregationStrategy } from './faceMapper';

export const MAX_TIMELINE_FRAMES = 240;

/** Sorted unique timestamps (ms epoch). Null when there are fewer than 2. */
export function extractTimestamps(points: NormalizedDataPoint[]): number[] | null {
  const times = points
    .map((p) => p.timestamp)
    .filter((t): t is number => t !== undefined && Number.isFinite(t));
  const unique = Array.from(new Set(times)).sort((a, b) => a - b);
  if (unique.length < 2) return null;
  return unique;
}

export interface TimelineFrames {
  timestamps: number[];
  faceFrames?: FaceData[][];
  vertexFrames?: VertexData[][];
  edgeFrames?: EdgeData[][];
}

export interface TimelineBuildOptions {
  maxFrames?: number;
  styleGuide?: DatasetStyleGuide;
  /** Build per-timestamp edge frames (graph datasets). */
  includeEdges?: boolean;
}

/**
 * Build one face/vertex/edge frame per unique timestamp, decimated to at most
 * `maxFrames`. Returns null when the dataset is not a timeline.
 */
export function buildTimelineFrames(
  points: NormalizedDataPoint[],
  aggregation: AggregationStrategy,
  target: 'face' | 'vertex' | 'both',
  options: TimelineBuildOptions = {},
): TimelineFrames | null {
  const timestamps = extractTimestamps(points);
  if (!timestamps) return null;

  const maxFrames = options.maxFrames ?? MAX_TIMELINE_FRAMES;
  const styleGuide = options.styleGuide;
  const includeEdges = options.includeEdges ?? false;

  let idxs = timestamps.map((_, i) => i);
  if (idxs.length > maxFrames) {
    const stride = Math.ceil(idxs.length / maxFrames);
    idxs = idxs.filter((_, i) => i % stride === 0).slice(0, maxFrames);
  }
  const picked = idxs.map((i) => timestamps[i]);

  return {
    timestamps: picked,
    faceFrames:
      target === 'face' || target === 'both'
        ? picked.map((t) => mapDataToFaces(points.filter((p) => p.timestamp === t), { aggregation }))
        : undefined,
    vertexFrames:
      target === 'vertex' || target === 'both'
        ? picked.map((t) => mapDataToVertices(points.filter((p) => p.timestamp === t), { aggregation }))
        : undefined,
    edgeFrames:
      includeEdges
        ? picked.map((t) => mapDataToEdges(points.filter((p) => p.timestamp === t), styleGuide))
        : undefined,
  };
}

/** Human-readable timestamp for scrubber labels, e.g. "2026-08-10 14:05". */
export function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Localized short timestamp for compact scrubber labels, e.g. "Aug 10 14:05". */
export function formatTimestampShort(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
