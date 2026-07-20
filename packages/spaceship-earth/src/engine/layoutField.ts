/**
 * @file layoutField.ts — Phase 4: morphogenetic field as the ship's layout engine.
 *
 * ⚠️ HONEST LABEL
 * Generates the HUD panel arrangement from a recursive Clifford-phase field
 * (MacDonald 2025, contested). This is an architectural metaphor: the user's
 * passport + spoon state + session depth seed a generative layout. No claims
 * about biological or physical fields. Critically, the field only drives
 * CSS/token properties (position offset, scale, opacity, visibility) — it
 * NEVER restructures the DOM. The ship's ground truth (components, content)
 * is fixed; only the surface arrangement shifts.
 *
 * Seed  = passport hash + spoon level (user identity + current energy)
 * Depth = session duration / 300 (the layout evolves over time)
 * Field = computeMorphogeneticField(seed, depth)
 * Map   = field layers → HUD panel { x, y, scale, visible, opacity }
 */

import { computeMorphogeneticField } from '@p31/quantum-core/morphogeneticField';
import { PHI } from '@p31/design-core/math';

export type PanelId = 'status' | 'larmor' | 'whale' | 'proof';

export interface PanelLayout {
  /** Normalized offset from anchor, -1..1 (CSS multiplier on a base inset). */
  x: number;
  y: number;
  /** Scale 0.85..1.15. */
  scale: number;
  /** Whether the panel is shown at this field state. */
  visible: boolean;
  /** Opacity 0.4..1. */
  opacity: number;
}

export interface LayoutField {
  panels: Record<PanelId, PanelLayout>;
  /** Raw normalized field layers (for debugging/visualization). */
  layers: number[];
}

const PANELS: PanelId[] = ['status', 'larmor', 'whale', 'proof'];

/** Deterministic string hash → [0,1). */
export function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Map to [0,1) avoiding exact 0/1.
  return ((h >>> 0) % 100000) / 100000;
}

/** Clamp helper. */
const clamp = (n: number, lo: number, hi: number): number =>
  Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo;

export interface LayoutInput {
  /** Passport-derived seed string (e.g. DID or identity hash). */
  passportSeed: string;
  /** Spoon level 0..maxSpoons (energy). */
  spoons: number;
  maxSpoons: number;
  /** Session age in seconds (drives recursive depth). */
  sessionSeconds: number;
}

/**
 * Compute the layout field. `depth` grows with session time (bounded to 6 so
 * the layout stays legible), seed combines passport + spoon state.
 */
export function computeLayoutField(input: LayoutInput): LayoutField {
  const spoon01 = input.maxSpoons > 0 ? clamp(input.spoons / input.maxSpoons, 0, 1) : 0;
  const seed = (hashSeed(input.passportSeed) + spoon01 * 0.5) % 1;
  const depth = clamp(Math.floor(input.sessionSeconds / 300) + 1, 1, 6);

  const raw = computeMorphogeneticField(seed, depth, Math.PI / 4, 1.9);

  // Normalize each layer to [-1,1]: divide by the layer's own PHI^n magnitude
  // envelope so the recursive field yields bounded, evolving offsets.
  const layers = raw.map((v, n) => {
    const env = Math.pow(PHI, n) || 1;
    return clamp(v / env, -1, 1);
  });

  const panels = {} as Record<PanelId, PanelLayout>;
  PANELS.forEach((id, i) => {
    const layer = layers[i % layers.length] ?? 0;
    const mag = Math.abs(layer);
    panels[id] = {
      x: layer,
      y: layers[(i + 1) % layers.length] ?? 0,
      scale: clamp(1 + layer * 0.15, 0.85, 1.15),
      visible: mag > 0.04,
      opacity: clamp(0.4 + mag * 0.6, 0.4, 1),
    };
  });

  return { panels, layers };
}
