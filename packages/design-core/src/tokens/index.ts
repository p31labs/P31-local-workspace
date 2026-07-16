import { COLORS, GLASS, STARFIELD, VOID_OKLCH, SURFACE_OKLCH, ACCENT_OKLCH } from '../math/colors';
import type { OKLCH, RGB } from '../math/colors';
import { FONT_SIZES, FONT_FAMILY, TYPOGRAPHY } from '../math/typography';
import { SPACING, SPACING_SEMANTIC, RADII } from '../math/spacing';
import { DURATIONS, EASING, SPOON_MOTION, spoonDuration } from '../math/motion';
import { PHI, BASE, RATIO, SPACE_BASE, TEMPO, BEAT } from '../math/constants';
import { scale, round } from '../math/scale';

export {
  COLORS, GLASS, STARFIELD, VOID_OKLCH, SURFACE_OKLCH, ACCENT_OKLCH,
  FONT_SIZES, FONT_FAMILY, TYPOGRAPHY,
  SPACING, SPACING_SEMANTIC, RADII,
  DURATIONS, EASING, SPOON_MOTION, spoonDuration,
  PHI, BASE, RATIO, SPACE_BASE, TEMPO, BEAT,
  scale, round,
};
export type { OKLCH, RGB };

export const TOKENS = {
  colors: COLORS,
  glass: GLASS,
  radii: RADII,
  spacing: SPACING,
  spacingSemantic: SPACING_SEMANTIC,
  typography: TYPOGRAPHY,
  fontSizes: FONT_SIZES,
  durations: DURATIONS,
  easing: EASING,
} as const;
