/**
 * @file layoutField.ts — Phase 4 morphogenetic layout engine.
 *
 * Deterministic, bounded, identity-sensitive, time-evolving panel layout
 * derived from a hashed passport seed plus live spoons / session depth.
 * ⚠️ Contested-science metaphor — asserts ENGINE behavior only.
 */

const clamp = (v: number, lo: number, hi: number): number => {
  if (!Number.isFinite(v)) return lo;
  return Math.min(hi, Math.max(lo, v));
};

/** FNV-1a 32-bit string hash normalized to [0,1). */
export function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

const hash = (seed: string, salt: string): number => hashSeed(`${seed}:${salt}`);

export interface LayoutPanel {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  visible: boolean;
}

export interface LayoutField {
  panels: Record<'status' | 'larmor' | 'whale' | 'proof', LayoutPanel>;
  layers: number[];
}

export interface LayoutInput {
  passportSeed: string;
  spoons: number;
  maxSpoons: number;
  sessionSeconds: number;
}

const PANEL_IDS = ['status', 'larmor', 'whale', 'proof'] as const;
const BASES: ReadonlyArray<readonly [number, number]> = [
  [-0.5, -0.5],
  [0.5, -0.5],
  [-0.5, 0.5],
  [0.5, 0.5],
];

export function computeLayoutField(input: LayoutInput): LayoutField {
  const energy = input.maxSpoons > 0 ? clamp(input.spoons / input.maxSpoons, 0, 1) : 0;
  const t = clamp(input.sessionSeconds / 3600, 0, 1);

  const panels = {} as LayoutField['panels'];
  PANEL_IDS.forEach((id, i) => {
    const hx = hash(input.passportSeed, `${id}:x`);
    const hy = hash(input.passportSeed, `${id}:y`);
    const hs = hash(input.passportSeed, `${id}:scale`);
    const ho = hash(input.passportSeed, `${id}:opacity`);
    const hv = hash(input.passportSeed, `${id}:visible`);
    const drift = 0.1 * t * Math.sin((i + 1) * hx * Math.PI);
    panels[id] = {
      x: clamp(BASES[i][0] + (hx - 0.5) * 0.5 + drift, -1, 1),
      y: clamp(BASES[i][1] + (hy - 0.5) * 0.5, -1, 1),
      scale: clamp(1 + (hs - 0.5) * 0.3, 0.85, 1.15),
      opacity: clamp(0.4 + ho * 0.6, 0.4, 1),
      visible: hv > 0.12,
    };
  });

  const layers: number[] = [];
  const layerCount = 8;
  for (let i = 0; i < layerCount; i++) {
    const h = hash(input.passportSeed, `layer:${i}`);
    const v = Math.sin(2 * Math.PI * (h + t * 0.1 * (i + 1))) * (0.6 + 0.4 * energy);
    layers.push(clamp(v, -1, 1));
  }

  return { panels, layers };
}
