/**
 * P31 spacing — 4-multiple grid.
 * All spacing values are multiples of 4.
 *   space = SPACE_BASE × step
 */

import { SPACE_BASE } from './constants';

const STEPS = [0, 1, 2, 3, 4, 6, 8, 12, 16, 24];

function space(step: number): number {
  return step * SPACE_BASE;
}

export const SPACING: Record<number, number> = Object.fromEntries(
  STEPS.map((n) => [n, space(n)])
) as Record<number, number>;

// Semantic spacing aliases
export const SPACING_SEMANTIC = {
  none: 0,
  xs: SPACING[1],
  sm: SPACING[2],
  md: SPACING[4],
  lg: SPACING[6],
  xl: SPACING[8],
  xxl: SPACING[16],
  gutter: SPACING[6],
  margin: SPACING[8],
} as const;

// Border radii — derived from spacing for consistency
export const RADII = {
  none: 0,
  sm: SPACING[2],
  md: SPACING[3],
  lg: SPACING[6],
  full: 9999,
} as const;
