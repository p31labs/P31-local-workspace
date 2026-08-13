/**
 * @file engine/datasetParser.ts — Auto-detect CSV/JSON schema and parse to NormalizedDataPoint[]
 *
 * Detects (in priority order for target mapping):
 *  - faceIndex / vertexIndex columns  → direct mapping
 *  - vector x/y/z columns             → nearest vertex
 *  - lat / lon columns                → nearest face (geo)
 *  - category / value / label         → hash / categorical mapping
 */

import type { NormalizedDataPoint, LatLon } from './dataConnectors';
import type { DatasetSchema, DatasetTarget } from './datasetTypes';

export interface ParseResult {
  points: NormalizedDataPoint[];
  schema: DatasetSchema;
  errors: string[];
}

export interface ParseOptions {
  target?: DatasetTarget;
  latField?: string;
  lonField?: string;
  valueField?: string;
  categoryField?: string;
  labelField?: string;
  idField?: string;
}

export function detectFormat(raw: string): 'csv' | 'json' | 'unknown' {
  const trimmed = raw.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) return 'json';
  if (trimmed.includes(',') && trimmed.includes('\n')) return 'csv';
  return 'unknown';
}

function isNumeric(v: unknown): boolean {
  return typeof v === 'number' || (typeof v === 'string' && !Number.isNaN(parseFloat(v)));
}

function toNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

const LAT_KEYS = /^(latitude|lat|la|y)$/i;
const LON_KEYS = /^(longitude|lon|lng|lo|x)$/i;
const VALUE_KEYS = /value|val|count|amount|indicator|population|score|index|rate|pct|per/i;
const CATEGORY_KEYS = /category|type|class|group|status|level|sector/i;
const LABEL_KEYS = /label|name|title|location|country|admin|area|city|region/i;
const DIM_KEYS = /dim|vector|axis/i;
const CONNECT_KEYS = /connect|edge|link|neighbor|peer/i;
const TIME_KEYS = /^date$|^time$|^year$|timestamp|period/i;

function pickFirst(keys: string[], matcher: RegExp): string | null {
  for (const k of keys) {
    if (matcher.test(k)) return k;
  }
  return null;
}

function guessLatLon(keys: string[]): { lat: string; lon: string } | null {
  let lat: string | null = null;
  let lon: string | null = null;
  for (const k of keys) {
    if (LAT_KEYS.test(k) && lat === null) lat = k;
    if (LON_KEYS.test(k) && lon === null) lon = k;
  }
  return lat && lon ? { lat, lon } : null;
}

function emptySchema(): DatasetSchema {
  return {
    fields: [],
    hasLatLon: false,
    hasValue: false,
    hasCategory: false,
    hasLabel: false,
    hasDimensions: false,
    hasConnections: false,
    hasFaceIndex: false,
    hasVertexIndex: false,
    hasVector: false,
    hasTimeSeries: false,
    detectedTarget: 'face',
    sample: null,
  };
}

function detectSchema(rows: Record<string, unknown>[], allKeys: string[]): DatasetSchema {
  const latLon = guessLatLon(allKeys);
  const vectorKeys = allKeys.filter((k) => /^v(?:[xyz])$/i.test(k) || /^[xyz]$/i.test(k) && allKeys.filter((kk) => /^[xyz]$/i.test(kk)).length >= 3);

  const schema: DatasetSchema = {
    fields: allKeys,
    hasLatLon: !!latLon,
    hasValue: !!pickFirst(allKeys, VALUE_KEYS),
    hasCategory: !!pickFirst(allKeys, CATEGORY_KEYS),
    hasLabel: !!pickFirst(allKeys, LABEL_KEYS),
    hasDimensions: allKeys.some((k) => DIM_KEYS.test(k)),
    hasConnections: allKeys.some((k) => CONNECT_KEYS.test(k)),
    hasFaceIndex: allKeys.some((k) => /face.?index|face/i.test(k)),
    hasVertexIndex: allKeys.some((k) => /vertex.?index|node.?index/i.test(k)),
    hasVector: vectorKeys.length >= 3,
    hasTimeSeries: allKeys.some((k) => TIME_KEYS.test(k)),
    detectedTarget: 'face',
    sample: null,
  };

  if (schema.hasFaceIndex) schema.detectedTarget = 'face';
  else if (schema.hasVertexIndex) schema.detectedTarget = 'vertex';
  else if (schema.hasVector || schema.hasDimensions) schema.detectedTarget = 'vertex';
  else if (schema.hasLatLon) schema.detectedTarget = 'face';
  else schema.detectedTarget = 'face';

  if (rows.length > 0) {
    schema.sample = rowToPoint(rows[0], allKeys, {});
  }

  return schema;
}

function parseConnections(v: unknown): string[] | undefined {
  if (v === undefined || v === null) return undefined;
  const raw = String(v);
  if (!raw.trim()) return undefined;
  return raw.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
}

function parseTime(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'number') return v;
  const n = Date.parse(String(v));
  return Number.isNaN(n) ? undefined : n;
}

function rowToPoint(row: Record<string, unknown>, allKeys: string[], opts: ParseOptions): NormalizedDataPoint {
  const latLon = opts.latField && opts.lonField
    ? { lat: opts.latField, lon: opts.lonField }
    : guessLatLon(allKeys);

  const valueField = opts.valueField ?? pickFirst(allKeys, VALUE_KEYS) ?? undefined;
  const categoryField = opts.categoryField ?? pickFirst(allKeys, CATEGORY_KEYS) ?? undefined;
  const labelField = opts.labelField ?? pickFirst(allKeys, LABEL_KEYS) ?? undefined;
  const idField = opts.idField ?? pickFirst(allKeys, /^id$|^key$|^code$/i) ?? undefined;

  const faceKey = pickFirst(allKeys, /face.?index|face/i);
  const vertexKey = pickFirst(allKeys, /vertex.?index|node.?index/i);
  const xKey = pickFirst(allKeys, /^x$/i);
  const yKey = pickFirst(allKeys, /^y$/i);
  const zKey = pickFirst(allKeys, /^z$/i);
  const timeKey = pickFirst(allKeys, TIME_KEYS);
  const connectKey = pickFirst(allKeys, CONNECT_KEYS);

  let location: LatLon | undefined;
  if (latLon) {
    const lat = toNumber(row[latLon.lat]);
    const lon = toNumber(row[latLon.lon]);
    if (lat !== null && lon !== null) location = { lat, lon };
  }

  let value = 0;
  if (valueField) {
    value = toNumber(row[valueField]) ?? 0;
  } else {
    for (const k of allKeys) {
      const n = toNumber(row[k]);
      if (n !== null && !LAT_KEYS.test(k) && !LON_KEYS.test(k)) {
        value = n;
        break;
      }
    }
  }

  const point: NormalizedDataPoint = {
    id: idField ? String(row[idField] ?? '') : String(row._rowIndex ?? ''),
    value,
    label: labelField ? String(row[labelField] ?? '') : String(row._rowIndex ?? ''),
    location,
    timestamp: timeKey ? parseTime(row[timeKey]) : undefined,
    metadata: row,
  };

  if (categoryField) point.category = String(row[categoryField] ?? '');

  const faceIndex = faceKey ? toNumber(row[faceKey]) : null;
  const vertexIndex = vertexKey ? toNumber(row[vertexKey]) : null;
  if (faceIndex !== null && faceIndex >= 0) point.faceIndex = faceIndex;
  if (vertexIndex !== null && vertexIndex >= 0) point.vertexIndex = vertexIndex;

  if (xKey && yKey && zKey) {
    const x = toNumber(row[xKey]);
    const y = toNumber(row[yKey]);
    const z = toNumber(row[zKey]);
    if (x !== null && y !== null && z !== null) point.vector = { x, y, z };
  }

  if (connectKey) {
    const conns = parseConnections(row[connectKey]);
    if (conns && conns.length > 0) point.connections = conns;
  }

  if (!point.label || point.label === 'undefined') point.label = point.id || 'Unknown';

  return point;
}

export function parseCSV(raw: string, options: ParseOptions = {}): ParseResult {
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { points: [], schema: emptySchema(), errors: ['Not enough rows to parse a CSV header + data'] };
  }

  const header = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const row: Record<string, unknown> = {};
    header.forEach((h, idx) => {
      const val = cols[idx] ?? '';
      const num = toNumber(val);
      row[h] = num !== null ? num : val;
    });
    row._rowIndex = String(i);
    rows.push(row);
  }

  const schema = detectSchema(rows, header);
  const points: NormalizedDataPoint[] = rows.map((r) => rowToPoint(r, header, options));
  return { points, schema, errors: [] };
}

export function parseJSON(raw: string, options: ParseOptions = {}): ParseResult {
  try {
    const data = JSON.parse(raw);
    let rows: Record<string, unknown>[] = [];

    if (Array.isArray(data)) {
      rows = data as Record<string, unknown>[];
    } else if (data && Array.isArray(data.data)) {
      rows = data.data;
    } else if (data && Array.isArray(data.results)) {
      rows = data.results;
    } else if (data && Array.isArray(data.features)) {
      // GeoJSON — pull lat/lon out of geometry.coordinates [lon, lat]
      rows = data.features.map((f: { properties?: Record<string, unknown>; geometry?: { coordinates?: number[] } }) => ({
        ...(f.properties ?? {}),
        lat: f.geometry?.coordinates?.[1],
        lon: f.geometry?.coordinates?.[0],
      }));
    } else {
      return { points: [], schema: emptySchema(), errors: ['Unrecognised JSON structure (expected array, {data:[...]}, {results:[...]}, or GeoJSON)'] };
    }

    if (rows.length === 0) {
      return { points: [], schema: emptySchema(), errors: ['Empty dataset — no rows found'] };
    }

    const allKeys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
    rows.forEach((r, i) => { if (r._rowIndex === undefined) r._rowIndex = String(i); });
    const schema = detectSchema(rows, allKeys);
    const points: NormalizedDataPoint[] = rows.map((r) => rowToPoint(r, allKeys, options));
    return { points, schema, errors: [] };
  } catch (err) {
    return {
      points: [],
      schema: emptySchema(),
      errors: [`JSON parsing failed: ${err instanceof Error ? err.message : String(err)}`],
    };
  }
}

export function parseDataset(raw: string, options: ParseOptions = {}): ParseResult {
  const trimmed = raw.trim();
  const format = detectFormat(trimmed);
  if (format === 'json') return parseJSON(trimmed, options);
  if (format === 'csv') return parseCSV(trimmed, options);
  return { points: [], schema: emptySchema(), errors: ['Unrecognised format — expected CSV or JSON'] };
}
