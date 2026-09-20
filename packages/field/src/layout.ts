/**
 * @p31/field — layout.ts
 *
 * The pure rendering layer. Takes a Reading + what's visible and returns
 * primitives — dots, lines, text, readouts — with no React, no DOM, no
 * canvas. Same determinism contract as the substrate: the same reading and
 * viewport produce the same primitives, byte for byte.
 *
 * Two decisions live here, both load-bearing:
 *
 *  1. STABLE POSITIONS (PhylloTrees, Neumann/Carpendale 2006). A zone sits
 *     where it sat yesterday. Position is a deterministic function of the
 *     zone's id hash on a phyllotaxis spiral — "a non-overlapping, optimal
 *     packing when the total number of nodes is not known a priori." You
 *     learn the map; the map does not rearrange under you.
 *
 *  2. TOKENS, NOT COLORS. Canvas 2D cannot parse var(--token) or
 *     color-mix(); it silently falls back to black. So the layout emits
 *     token NAMES plus an alpha, and the render layer resolves the name via
 *     getComputedStyle and applies the alpha via globalAlpha. The instrument
 *     inherits the active theme without knowing which theme is active.
 *
 *  3. THE PALETTE IS THE READING. Fill opacity encodes pressure; stroke hue
 *     encodes hazard (green → gold → red); stroke width encodes trust. Three
 *     signals, three channels, zero ornament.
 */

import type { Reading, ZoneReading } from './instrument.ts';

export interface DotPrimitive {
  id: string;
  x: number; // [0,1]
  y: number; // [0,1]
  r: number; // normalized radius
  fillToken: string;   // e.g. '--p31-accent'
  fillOpacity: number; // 0..1
  strokeToken: string; // e.g. '--p31-accent-green'
  strokeWidth: number;
}

export interface LinePrimitive {
  x1: number; y1: number; x2: number; y2: number;
  strokeToken: string;
  strokeWidth: number;
  dash?: number[];
}

export interface TextPrimitive {
  x: number; y: number;
  text: string;
  size: number; // in em
  weight: number; // 300–700
  colorToken: string;
  align?: 'left' | 'center' | 'right';
  mono?: boolean;
}

export interface ReadoutPrimitive {
  x: number; y: number;
  label: string;
  value: string;
  /** 0–1 fill fraction for a horizontal bar; omitted for a bare readout. */
  bar?: number;
  barToken?: string;
}

export interface Scene {
  dots: DotPrimitive[];
  lines: LinePrimitive[];
  text: TextPrimitive[];
  readouts: ReadoutPrimitive[];
  pulsePhase: number;
}

/** Token names, not colors. The render layer resolves these. */
export const PALETTE = {
  accent: '--p31-accent',          // cyan — the base signal hue
  safe: '--p31-accent-green',      // hazard ≈ 0
  amber: '--p31-accent-gold',      // hazard ~0.5
  danger: '--p31-accent-red',      // hazard → 1 (floating neutral)
  text: '--p31-text',              // body
  faint: '--p31-text-tertiary',    // faint
  strong: '--p31-text',            // headings
  edge: '--p31-glass-border',      // K₄ edges, grid
} as const;

/** FNV-1a → [0,1). Same id, same value, forever. */
function hash01(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0x100000000;
}

/**
 * Stable positions (PhylloTrees, Neumann/Carpendale 2006 — "a non-overlapping
 * packing when the total number of nodes is not known a priori"). A zone sits
 * where it sat yesterday. Position is a pure function of the zone's id, NOT
 * of how many other zones exist — so a zone added later cannot displace the
 * ones already on screen, and the map is learnable.
 *
 * Phyllotaxis in the continuous, total-independent limit is exactly this:
 * the golden-angle spiral distributes points with uniform angle and
 * area-uniform radius (√r). Hashing the id onto those two coordinates is the
 * same even packing, made id-stable. Two differently-salted hashes decouple
 * angle from radius so coverage is even in expectation, not clumped.
 */
function sunflower(id: string): { x: number; y: number } {
  const a = hash01(id + '#angle') * Math.PI * 2;          // uniform angle
  const r = Math.sqrt(hash01(id + '#radius')) * 0.46;     // uniform-area radius
  return { x: 0.5 + r * Math.cos(a), y: 0.5 + r * Math.sin(a) };
}

/** Hazard → token. 0 = safe (green), 0.5 = amber, 1 = floating neutral. */
function hazardToken(h: number): string {
  if (h < 0.33) return PALETTE.safe;
  if (h < 0.66) return PALETTE.amber;
  return PALETTE.danger;
}

/**
 * Lay out the constellation scale. All zones, at most RENDER_BUDGET visible.
 * Complexity is rendered as a fixed panel (bottom-left); the pulse is a
 * single ring (top-center) — the clock made visible.
 */
export function layoutConstellation(
  reading: Reading,
  visible: readonly ZoneReading[],
  hidden: number,
  pulsePhase: number,
): Scene {
  const dots: DotPrimitive[] = [];
  const text: TextPrimitive[] = [];
  const readouts: ReadoutPrimitive[] = [];

  const maxPressure = Math.max(1e-6, ...visible.map((z) => z.pressure));
  const maxWeight = Math.max(1e-6, ...visible.map((z) => z.weight));

  for (const z of visible) {
    const { x, y } = sunflower(z.id);
    const pr = z.pressure / maxPressure; // 0–1
    const wr = Math.sqrt(z.weight / maxWeight); // 0–1, area-honest
    // Radius: min for presence, grows with sqrt(weight). Cap so a single hot
    // zone doesn't dominate the field — the whole is the reading.
    const r = 0.006 + Math.min(0.034, 0.034 * wr);
    const fillOpacity = 0.12 + 0.78 * pr;
    const strokeWidth = 0.5 + 1.5 * pr;

    dots.push({
      id: z.id, x, y, r,
      fillToken: PALETTE.accent,
      fillOpacity,
      strokeToken: hazardToken(z.hazard),
      strokeWidth,
    });

    // Label only the top-quartile-by-pressure zones, and only when the field
    // is small enough that text doesn't collide. Everything else is unlabeled
    // on purpose — the eye learns position, not text.
    if (pr > 0.75 && visible.length <= 32) {
      text.push({
        x: x + r + 0.008, y: y + 0.004,
        text: z.id,
        size: 0.022, weight: 500, colorToken: PALETTE.text,
        align: 'left', mono: true,
      });
    }
  }

  // The elision, measured and displayed. Not a "more" button — a number.
  if (hidden > 0) {
    text.push({
      x: 0.5, y: 0.945,
      text: `${hidden} zones below the render budget`,
      size: 0.020, weight: 400, colorToken: PALETTE.faint,
      align: 'center', mono: true,
    });
  }

  // The complexity panel — a diagnostic, not a verdict (MDPI Electronics
  // 2026: computational complexity correlates weakly-to-moderately with
  // perceived load, so the numbers describe structure, never judge the
  // operator). Three bars, one accent hue, no good/bad coloring.
  const cx = 0.03;
  const cy = 0.86;
  readouts.push(
    { x: cx, y: cy,         label: 'ENTROPY', value: reading.complexity.entropy.toFixed(3),
      bar: reading.complexity.entropy,    barToken: PALETTE.accent },
    { x: cx, y: cy + 0.035, label: 'EDGE',   value: reading.complexity.edgeDensity.toFixed(3),
      bar: reading.complexity.edgeDensity, barToken: PALETTE.accent },
    { x: cx, y: cy + 0.070, label: 'WHITE',  value: reading.complexity.whiteSpace.toFixed(3),
      bar: reading.complexity.whiteSpace,  barToken: PALETTE.accent },
  );

  return { dots, lines: [], text, readouts, pulsePhase };
}

/**
 * Lay out the zone scale. Given a focused zone, expand to its K₄: four
 * vertices at the compass points, six edges between them. Trace ticks along
 * each edge accumulate in the render layer.
 */
export function layoutZone(
  reading: Reading,
  traces: readonly { ts: number }[],
  pulsePhase: number,
): Scene {
  const dots: DotPrimitive[] = [];
  const lines: LinePrimitive[] = [];
  const text: TextPrimitive[] = [];
  const readouts: ReadoutPrimitive[] = [];
  const zone = reading.zones[0];
  if (!zone) return { dots, lines, text, readouts, pulsePhase };

  const cx = 0.5, cy = 0.5, R = 0.28;
  const vertices = ['component', 'class', 'token', 'theme'];
  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < 4; i++) {
    const a = -Math.PI / 2 + (i / 4) * Math.PI * 2;
    positions.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
  }

  // The six edges of K₄.
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      lines.push({
        x1: positions[i].x, y1: positions[i].y,
        x2: positions[j].x, y2: positions[j].y,
        strokeToken: PALETTE.edge, strokeWidth: 1,
      });
    }
  }

  // The four vertices.
  for (let i = 0; i < 4; i++) {
    dots.push({
      id: vertices[i],
      x: positions[i].x, y: positions[i].y, r: 0.018,
      fillToken: PALETTE.accent, fillOpacity: 0.4,
      strokeToken: hazardToken(zone.hazard), strokeWidth: 1,
    });
    text.push({
      x: positions[i].x, y: positions[i].y - 0.028,
      text: vertices[i],
      size: 0.024, weight: 500, colorToken: PALETTE.text,
      align: 'center', mono: true,
    });
  }

  text.push({
    x: 0.5, y: 0.08,
    text: zone.id,
    size: 0.055, weight: 300, colorToken: PALETTE.strong,
    align: 'center', mono: true,
  });

  readouts.push(
    { x: 0.5, y: 0.17, label: 'PRESSURE', value: zone.pressure.toFixed(3) },
    { x: 0.5, y: 0.21, label: 'HAZARD',   value: zone.hazard.toFixed(3) },
    { x: 0.5, y: 0.25, label: 'BETAS',    value: `(${zone.beta.join(', ')})` },
    { x: 0.5, y: 0.29, label: 'TRACES',   value: String(traces.length) },
  );

  return { dots, lines, text, readouts, pulsePhase };
}

/**
 * The trace scale — the atomic end. Not yet wired; the placeholder reads as
 * an instrument (a value, not a spinner).
 */
export function layoutTrace(reading: Reading, pulsePhase: number): Scene {
  return {
    dots: [],
    lines: [],
    text: [{
      x: 0.5, y: 0.5,
      text: 'TRACE SCALE — NOT YET RENDERED',
      size: 0.028, weight: 300, colorToken: PALETTE.faint,
      align: 'center', mono: true,
    }],
    readouts: [],
    pulsePhase,
  };
}

/** Dispatch by scale. */
export function layout(
  reading: Reading,
  traces: readonly { ts: number }[],
  visible: readonly ZoneReading[],
  hidden: number,
  pulsePhase: number,
): Scene {
  switch (reading.scale) {
    case 'constellation': return layoutConstellation(reading, visible, hidden, pulsePhase);
    case 'zone':          return layoutZone(reading, traces, pulsePhase);
    case 'trace':         return layoutTrace(reading, pulsePhase);
  }
}
