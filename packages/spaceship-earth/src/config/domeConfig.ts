/**
 * @file config/domeConfig.ts — Single source of truth for the Spaceship Earth dome.
 *
 * Phase 0 (Config Layer): strips hardcoded constants out of the runtime code and
 * centralizes them here. The public tool reads this config to build the dome
 * dynamically — users (or URL params) can request 320 faces (detail=2),
 * 1280 faces (detail=3), etc. on the fly.
 *
 * Precedence (highest wins): URL params > localStorage > DEFAULT_CONFIG.
 */

export type LedMode = 'rainbow' | 'chase' | 'solid' | 'breath' | 'gradient' | 'dual-chase' | 'off';

export type Aggregation = 'last' | 'max' | 'avg' | 'sum';

export type NodeAxis = 'family' | 'system' | 'care' | 'shield';

export interface ShipNode {
  id: string;
  label: string;
  type: NodeAxis;
  color: string;
}

export interface DomeGeometryConfig {
  /** Dome radius in world units. */
  radius: number;
  /** Geodesic subdivision level (2 → 320 faces, 3 → 1280 faces). */
  detail: number;
  /** Upper bound the public UI may request via URL / panels. */
  maxDetail: number;
}

export interface NeoPixelConfig {
  /** LED segments laid along each geodesic edge. */
  segmentsPerEdge: number;
  /** Radius of each LED cylinder in world units. */
  pixelRadius: number;
  /** Gap between consecutive LEDs on an edge (world units). */
  pixelGap: number;
  /** Cap on total LED instances drawn (also the shader uTotal). */
  maxSegments: number;
}

export interface DataConfig {
  /** 1–2 active datasets at a time (e.g. one face + one vertex layer). */
  maxActiveDatasets: number;
  /** How overlapping points on the same face/vertex are merged. */
  defaultAggregation: Aggregation;
  /** ms between auto-refreshes; 0 = manual only. */
  autoRefreshInterval: number;
  /** Minutes of continuous focus before the rest reminder shows (0 = off). */
  focusReminderMinutes: number;
}

export interface LedDefaults {
  mode: LedMode;
  speed: number;
  color: string;
  brightness: number;
  colors: string[];
  collapsed: boolean;
}

export interface UiConfig {
  /** Render the legacy docking/HUD chrome (private/demo mode). */
  showDockUI: boolean;
  /** Draw text labels next to nodes. */
  showNodeLabels: boolean;
  /** Enable Bucky Mode toggles (unfold, connection arcs). */
  enableBuckyMode: boolean;
}

export interface DomeConfig {
  geometry: DomeGeometryConfig;
  neoPixel: NeoPixelConfig;
  data: DataConfig;
  led: LedDefaults;
  ui: UiConfig;
}

export const DEFAULT_CONFIG: DomeConfig = {
  geometry: { radius: 12, detail: 2, maxDetail: 4 },
  neoPixel: { segmentsPerEdge: 20, pixelRadius: 0.045, pixelGap: 0.01, maxSegments: 9600 },
  data: { maxActiveDatasets: 2, defaultAggregation: 'last', autoRefreshInterval: 0, focusReminderMinutes: 45 },
  led: {
    mode: 'rainbow',
    speed: 5,
    color: '#22d3ee',
    brightness: 80,
    colors: ['#ff9944', '#22d3ee', '#44ffaa'],
    collapsed: true,
  },
  ui: {
    showDockUI: false,
    showNodeLabels: false,
    enableBuckyMode: true,
  },
};

export const CONFIG_STORAGE_KEY = 'spaceship-earth:config:v1';

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function deepMerge<T>(base: T, patch: unknown): T {
  if (!isPlainObject(patch)) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(patch)) {
    const existing = (base as Record<string, unknown>)[key];
    if (isPlainObject(existing) && isPlainObject(value)) {
      out[key] = deepMerge(existing, value);
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out as T;
}

function parsePositiveInt(raw: string | null, fallback: number, max = Number.MAX_SAFE_INTEGER): number {
  if (raw === null) return fallback;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n <= 0) return fallback;
  return Math.min(n, max);
}

function parseFloatParam(raw: string | null, fallback: number): number {
  if (raw === null) return fallback;
  const n = Number.parseFloat(raw);
  return Number.isNaN(n) || n <= 0 ? fallback : n;
}

function parseLedMode(raw: string | null, fallback: LedMode): LedMode {
  const valid: LedMode[] = ['rainbow', 'chase', 'solid', 'breath', 'gradient', 'dual-chase', 'off'];
  return raw !== null && (valid as string[]).includes(raw) ? (raw as LedMode) : fallback;
}

/** Read supported URL params (?detail=&radius=&segmentsPerEdge=&brightness=&mode=&autoRefresh=). */
export function parseQueryConfig(search: string): Partial<DomeConfig> {
  const params = new URLSearchParams(search);
  const patch: Partial<DomeConfig> = {};

  const detail = parsePositiveInt(params.get('detail'), NaN, DEFAULT_CONFIG.geometry.maxDetail);
  const radius = parseFloatParam(params.get('radius'), NaN);
  const segmentsPerEdge = parsePositiveInt(params.get('segmentsPerEdge'), NaN);
  const autoRefresh = parsePositiveInt(params.get('autoRefresh'), NaN);
  const brightness = parsePositiveInt(params.get('brightness'), NaN, 100);

  if (!Number.isNaN(detail)) patch.geometry = { ...(patch.geometry ?? {}), detail } as DomeConfig['geometry'];
  if (!Number.isNaN(radius)) patch.geometry = { ...(patch.geometry ?? {}), radius } as DomeConfig['geometry'];
  if (!Number.isNaN(segmentsPerEdge)) patch.neoPixel = { ...(patch.neoPixel ?? {}), segmentsPerEdge } as DomeConfig['neoPixel'];
  if (!Number.isNaN(autoRefresh)) patch.data = { ...(patch.data ?? {}), autoRefreshInterval: autoRefresh } as DomeConfig['data'];
  if (!Number.isNaN(brightness)) patch.led = { ...(patch.led ?? {}), brightness } as DomeConfig['led'];

  const modeParam = params.get('mode');
  if (modeParam !== null) patch.led = { ...(patch.led ?? {}), mode: parseLedMode(modeParam, DEFAULT_CONFIG.led.mode) } as DomeConfig['led'];

  return patch;
}

/** Persisted config (may be partial). */
export function loadSavedConfig(): Partial<DomeConfig> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return isPlainObject(parsed) ? (parsed as Partial<DomeConfig>) : {};
  } catch {
    return {};
  }
}

/** Merge defaults ← localStorage ← URL params. Pure; safe for SSR. */
export function loadConfig(search?: string): DomeConfig {
  const query = search ?? (typeof window !== 'undefined' ? window.location.search : '');
  return deepMerge(deepMerge(DEFAULT_CONFIG, loadSavedConfig()), parseQueryConfig(query));
}

/** Persist a (possibly partial) config overlay to localStorage. */
export function saveConfig(patch: Partial<DomeConfig>): void {
  if (typeof window === 'undefined') return;
  const merged = deepMerge(loadSavedConfig(), patch);
  window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(merged));
}

/** Remove any persisted config overlay, returning the pristine defaults. */
export function resetConfig(): DomeConfig {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(CONFIG_STORAGE_KEY);
  }
  return deepMerge(DEFAULT_CONFIG, {});
}

/**
 * The live config instance. Resolved once at module load so every consumer
 * (geometry, ship store, LED frame, verify hooks) reads the same values.
 */
export const domeConfig: DomeConfig = loadConfig();
