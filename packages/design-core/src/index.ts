/**
 * P31 design-core — executable DESIGN.md
 * Every surface imports from here. No exceptions.
 */
export {
  COLORS,
  GLASS,
  STARFIELD,
  FONT_SIZES,
  FONT_FAMILY,
  TYPOGRAPHY,
  SPACING,
  SPACING_SEMANTIC,
  RADII,
  DURATIONS,
  EASING,
  SPOON_MOTION,
  spoonDuration,
  PHI,
  BASE,
  RATIO,
  SPACE_BASE,
  TEMPO,
  BEAT,
  scale,
  round,
  TOKENS,
} from './tokens/index';

export type { OKLCH, RGB } from './math/colors';

export { initStarfield, mountStarfield } from './starfield';
export type { StarfieldConfig, StarfieldOptions, StarfieldInstance } from './starfield';

export { registerP31CrisisOverlay } from './crisis-overlay';
export { health, type HealthResponse, type HealthCheck } from './health';
