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
  SIZE_CLASSES,
} from './tokens/index';

export type { OKLCH, RGB } from './math/colors';

export { getDeviceClass, useDeviceClass } from './device';
export type { SizeClass, InputMode } from './device';

export { initStarfield, mountStarfield } from './starfield';
export type { StarfieldConfig, StarfieldOptions, StarfieldInstance } from './starfield';

export { mountJitterbugStarfield } from './starfield/jitterbug';
export type {
  JitterbugStarfieldOptions,
  JitterbugStarfieldInstance,
  VertexData,
  BrightStarData,
  EdgeData,
} from './starfield/jitterbug';

export { registerP31CrisisOverlay } from './crisis-overlay';
export { health, type HealthResponse, type HealthCheck } from './health';

export * from './generator/componentGenerator';
export * from './generator/componentGenerator.wc';
export * from './generator/componentGenerator.html';
export * from './generator/index';
export * from './generator/cache';
export * from './brand';
export type { BrandColor, BrandColorInfo } from './brand';
export * from './mcp/schema';
