/**
 * @file engine/share.ts — Dataset URL payload encoding/decoding + share-link helpers
 *
 * Pure logic, no React/DOM. All `window`/`location` access is guarded so this
 * module runs in node tests.
 */

import type { NormalizedDataPoint } from './dataConnectors';
import type { Dataset } from './datasetTypes';

/** Fields kept when serializing a point — `metadata` is deliberately dropped. */
const PAYLOAD_FIELDS: (keyof NormalizedDataPoint)[] = [
  'id',
  'value',
  'label',
  'category',
  'timestamp',
  'location',
  'vector',
  'faceIndex',
  'vertexIndex',
  'connections',
];

function toBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) b64 += '=';
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/** Compact base64url JSON of the given points (metadata omitted). */
export function encodeDatasetPayload(points: NormalizedDataPoint[]): string {
  const compact = points.map((point) => {
    const out: Record<string, unknown> = {};
    for (const key of PAYLOAD_FIELDS) {
      const value = (point as unknown as Record<string, unknown>)[key];
      if (value !== undefined) out[key] = value;
    }
    return out;
  });
  return toBase64Url(JSON.stringify(compact));
}

/** Inverse of `encodeDatasetPayload`; returns null on any failure. */
export function decodeDatasetPayload(encoded: string): NormalizedDataPoint[] | null {
  try {
    const json = fromBase64Url(encoded);
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return null;
    return parsed as NormalizedDataPoint[];
  } catch {
    return null;
  }
}

export interface ShareOptions {
  dataset?: Dataset;
  aggregation?: string;
  bucky?: boolean;
}

const FALLBACK_BASE = 'https://p31ca.org/spaceship-earth/';

/** Build a shareable URL for the current view. */
export function buildShareUrl(opts: ShareOptions = {}): string {
  const { dataset, aggregation, bucky } = opts;
  const base =
    typeof window !== 'undefined' && window.location
      ? window.location.origin + window.location.pathname
      : FALLBACK_BASE;

  const params: string[] = [];

  if (dataset) {
    if (dataset.source === 'url') {
      const sourceUrl =
        typeof dataset.metadata?.sourceUrl === 'string' ? dataset.metadata.sourceUrl : '';
      params.push(`dataset=${encodeURIComponent(sourceUrl)}`);
    } else {
      const payload = encodeDatasetPayload(dataset.data ?? []);
      params.push(`dataset=${encodeURIComponent(`payload:${payload}`)}`);
    }
    params.push(`name=${encodeURIComponent(dataset.name ?? '')}`);
  }

  if (aggregation) params.push(`agg=${encodeURIComponent(aggregation)}`);
  if (bucky) params.push('bucky=1');

  return `${base}?${params.join('&')}`;
}

export interface ParsedShareParams {
  datasetUrl?: string;
  payload?: string;
  name?: string;
  agg?: string;
  bucky?: boolean;
}

/** Parse a `location.search`-style string into share params (null when invalid). */
export function parseShareParams(search: string): ParsedShareParams | null {
  if (typeof search !== 'string' || search === '') return null;
  const raw = search.startsWith('?') ? search.slice(1) : search;
  if (raw === '') return null;

  const params = new URLSearchParams(raw);
  const dataset = params.get('dataset');
  if (!dataset) return null;

  const result: ParsedShareParams = {};
  if (dataset.startsWith('payload:')) {
    result.payload = dataset.slice('payload:'.length);
  } else {
    result.datasetUrl = dataset;
  }

  const name = params.get('name');
  if (name) result.name = name;
  const agg = params.get('agg');
  if (agg) result.agg = agg;
  const bucky = params.get('bucky');
  if (bucky === '1' || bucky === 'true') result.bucky = true;

  return result;
}
