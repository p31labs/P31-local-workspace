/**
 * @p31/field — instrument.ts
 *
 * The Instrument — the UI substrate that scales with the system.
 *
 * Not a portal, not a dashboard. An instrument is not a window onto data;
 * its state IS the data, read through a fixed grammar. A thermometer does
 * not render a chart of temperatures; it moves, and the movement is the
 * reading.
 *
 * The instrument projects (zones, traces, atMs) into a Reading — a pure,
 * deterministic function. Three properties make it scale with the system
 * rather than against it:
 *
 *  1. A clock. Decay is applied at every projection. A zone the field has
 *     stopped touching cools; the reading changes as the field changes. The
 *     interface is alive because the system is alive.
 *
 *  2. A scale chosen by system state, not user preference. At the coarsest
 *     scale, the field is a constellation of zone-dots; zoom reveals a zone's
 *     K₄; zoom again reveals its traces. Zoom is vertical: the same system at
 *     three resolutions.
 *
 *  3. Complexity is measured, not managed. Shannon entropy, edge density, and
 *     white-space ratio are first-class readings. If the interface is failing
 *     to scale, that is a reading — not a rendering bug, but a signal that the
 *     system's structure needs intervention.
 *
 * The instrument is the field, made visible. Pure: no I/O, no model call, no
 * DOM. A reading at a given atMs is byte-identical across runs.
 */
import type { Trace, Zone } from './index.ts';
import { decay, pressure, hazard } from './index.ts';

export type InstrumentScale = 'constellation' | 'zone' | 'trace';

export interface ZoneReading {
  id: string;
  pressure: number;
  hazard: number;
  beta: [number, number, number];
  rigid: boolean;
  /** The trace count at this zone (for the constellation's dot radius). */
  weight: number;
  /** Last activity, in ms, or null if never touched. */
  lastActivityMs: number | null;
}

export interface Complexity {
  /** Shannon entropy over the normalized zone-pressure distribution. */
  entropy: number;
  /** Edge density = edges / max-edges (a K₄ has 6/6 = 1). */
  edgeDensity: number;
  /** Fraction of zones at near-zero pressure — the interface's idle mass. */
  whiteSpace: number;
}

export interface Reading {
  scale: InstrumentScale;
  focus: string | null;
  atMs: number;
  /** Zones at the current scale. At constellation, all; at zone, the focused. */
  zones: ZoneReading[];
  /** The complexity of the whole field — measured, not hidden. */
  complexity: Complexity;
}

/** Shannon entropy of a set of non-negative weights, normalized to [0,1] by
 *  the number of non-zero entries (max entropy = log n). A uniform field is 1;
 *  a field of one hot zone and N idle is near 0. */
export function shannonEntropy(weights: readonly number[]): number {
  const nonZero = weights.filter((w) => w > 0);
  const n = nonZero.length;
  if (n === 0) return 0;
  const total = nonZero.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  let h = 0;
  for (const w of nonZero) {
    const p = w / total;
    if (p > 0) h -= p * Math.log(p);
  }
  const max = Math.log(n);
  return max > 0 ? h / max : 0;
}

/** Edge density of the field: actual edges over max edges, where each K₄ zone
 *  contributes 6 possible edges. A fully-tetrahedral field is 1. */
export function edgeDensity(zones: readonly Zone[]): number {
  if (zones.length === 0) return 0;
  const actual = zones.reduce((a, z) => a + z.edges.length, 0);
  const max = zones.length * 6;
  return max > 0 ? actual / max : 0;
}

/** White space: the fraction of zones at near-zero pressure — the mass of the
 *  interface that is idle. High white space = a mostly-cold system. */
export function whiteSpaceRatio(zones: readonly ZoneReading[], epsilon = 1e-6): number {
  if (zones.length === 0) return 0;
  const idle = zones.filter((z) => z.pressure <= epsilon).length;
  return idle / zones.length;
}

/** The instrument's projection. Pure and deterministic given atMs. */
export function projectInstrument(
  zones: readonly Zone[],
  traces: readonly Trace[],
  atMs: number,
  focus: string | null = null,
  halfLife: number = 7 * 24 * 3600 * 1000,
): Reading {
  const readings: ZoneReading[] = zones.map((z) => {
    const p = pressure(z, traces, atMs, halfLife);
    const h = hazard(z, traces, atMs, halfLife);
    const zoneTraces = traces.filter((t) => t.zone === z.id);
    const last = zoneTraces.length > 0 ? Math.max(...zoneTraces.map((t) => t.ts)) : null;
    // weight: decayed trace count, so the constellation dot radius is a
    // continuous readout, not a raw count.
    const weight = zoneTraces.reduce((a, t) => a + decay(t, atMs, halfLife), 0);
    return { id: z.id, pressure: p, hazard: h, beta: z.beta, rigid: z.rigid, weight, lastActivityMs: last };
  });

  const focusedReadings = focus === null
    ? readings
    : readings.filter((r) => r.id === focus);

  const complexity: Complexity = {
    entropy: shannonEntropy(readings.map((r) => r.pressure)),
    edgeDensity: edgeDensity(zones),
    whiteSpace: whiteSpaceRatio(readings),
  };

  const scale: InstrumentScale = focus === null ? 'constellation' : 'zone';

  return { scale, focus, atMs, zones: focusedReadings, complexity };
}

/**
 * The scaling contract, expressed as a function. Given N zones, which subset
 * does the instrument render at the constellation scale?
 *
 *   - At ≤ RENDER_BUDGET zones, render all.
 *   - Above it, render the RENDER_BUDGET zones with the highest weight,
 *     plus an explicit "+N more" remainder.
 *
 * The point: the number of dots on screen is O(1) in system size. The field's
 * signal — not the interface's width — decides which zones make the cut.
 */
export const RENDER_BUDGET = 64;

export function selectConstellation(
  readings: readonly ZoneReading[],
  budget: number = RENDER_BUDGET,
): { visible: ZoneReading[]; hidden: number } {
  const sorted = [...readings].sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id));
  if (sorted.length <= budget) return { visible: sorted, hidden: 0 };
  return { visible: sorted.slice(0, budget), hidden: sorted.length - budget };
}
