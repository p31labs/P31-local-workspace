// packages/shared/src/theme/tokens/index.ts

export * from './brand';
export * from './operatorLane';
export * from './axis';
export * from './semantic';
export * from './typography';
export * from './animation';

export type { BrandColorKey } from './brand';
export type { AxisColorKey } from './axis';
export type { SemanticColorKey } from './semantic';
export type { TypographyTokenKey } from './typography';
export type { AnimationTokenKey } from './animation';

export const SPACING_SCALE = [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128];

export const SPACING_TOKENS = {
  scale: SPACING_SCALE,
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
} as const;

export type SpacingTokenKey = keyof typeof SPACING_TOKENS;