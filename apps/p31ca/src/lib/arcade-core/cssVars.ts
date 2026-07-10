/**
 * cssVars.ts — Read P31 arcade theme colors from CSS custom properties at runtime.
 *
 * Canvas-based games (BashballField, OrbitalDrift, ResonanceRings, LiquidSculptor)
 * cannot use `var(--p31-*)` directly in `ctx.fillStyle`. This helper reads the
 * resolved value from `:root` so canvas rendering stays in sync with the theme.
 */

export type CssVarName =
  | '--p31-void'
  | '--p31-void-lighter'
  | '--p31-deep-void'
  | '--p31-cloud'
  | '--p31-cloud-70'
  | '--p31-cloud-60'
  | '--p31-cloud-50'
  | '--p31-cloud-40'
  | '--p31-cloud-35'
  | '--p31-cloud-30'
  | '--p31-cloud-25'
  | '--p31-cloud-20'
  | '--p31-white-15'
  | '--p31-white-12'
  | '--p31-white-10'
  | '--p31-white-8'
  | '--p31-white-6'
  | '--p31-white-5'
  | '--p31-white-4'
  | '--p31-white-3'
  | '--p31-white-2'
  | '--p31-teal'
  | '--p31-teal-dim'
  | '--p31-gold'
  | '--p31-gold-dim'
  | '--p31-gold-border'
  | '--p31-rust'
  | '--p31-rust-dim'
  | '--p31-rust-border'
  | '--p31-purple'
  | '--p31-purple-dim'
  | '--p31-purple-border'
  | '--p31-green'
  | '--p31-green-dim'
  | '--p31-green-border'
  | '--p31-ice'
  | '--p31-card-red'
  | '--p31-field-green';

/** Cache of resolved CSS variable values, refreshed per frame via getComputedStyle. */
let rootEl: HTMLElement | null = null;

function getRoot(): HTMLElement {
  if (!rootEl) rootEl = document.documentElement;
  return rootEl;
}

/**
 * Read a single CSS custom property from :root.
 * Returns `fallback` (or empty string) if not found.
 */
export function cssVar(name: CssVarName, fallback = ''): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(getRoot()).getPropertyValue(name).trim();
  return value || fallback;
}

/**
 * Read many CSS custom properties at once, returning a typed record keyed by name.
 * Call this at the start of each canvas draw frame so colors track theme switches.
 */
export function readCssVars<K extends CssVarName>(names: K[]): Record<K, string> {
  const out = {} as Record<K, string>;
  for (const name of names) {
    out[name] = cssVar(name);
  }
  return out;
}

/** Convenience: read all arcade theme colors used by canvas games. */
export function readThemeColors() {
  return readCssVars([
    '--p31-void',
    '--p31-deep-void',
    '--p31-cloud',
    '--p31-cloud-70',
    '--p31-cloud-60',
    '--p31-cloud-50',
    '--p31-cloud-40',
    '--p31-cloud-30',
    '--p31-cloud-20',
    '--p31-white-10',
    '--p31-white-8',
    '--p31-teal',
    '--p31-teal-dim',
    '--p31-gold',
    '--p31-gold-dim',
    '--p31-gold-border',
    '--p31-rust',
    '--p31-rust-dim',
    '--p31-purple',
    '--p31-purple-dim',
    '--p31-green',
    '--p31-green-dim',
    '--p31-green-border',
    '--p31-ice',
    '--p31-field-green',
  ]);
}

/**
 * Spoon-aware motion factor — a P31 neuroinclusive invariant.
 *
 * Motion scales with cognitive energy (spoon level, 0–12) and is FULLY
 * DISABLED at spoons 0–1 (crisis / rest-required state). Returns a multiplier
 * in [0, 1] suitable for scaling animation speed, trail fade, or simulation step.
 *
 *   spoons 0–1 → 0      (no motion; freeze)
 *   spoons 2–6 → 0.3→1.0 (gradual ramp)
 *   spoons 7–12 → 1.0   (full motion)
 */
export function motionFactor(spoonLevel: number): number {
  if (!spoonLevel || spoonLevel <= 1) return 0;
  return Math.max(0.3, Math.min(1.0, spoonLevel / 6));
}

/** True when motion should be suppressed entirely (crisis / rest state). */
export function motionDisabled(spoonLevel: number): boolean {
  return motionFactor(spoonLevel) === 0;
}
