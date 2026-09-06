// packages/shared/src/theme/presets/index.ts

export * from './operator';
export * from './kids';
export * from './grayRock';
export * from './aurora';
export * from './highContrast';
export * from './lowMotion';

export { OPERATOR_THEME } from './operator';
export { KIDS_THEME } from './kids';
export { GRAY_ROCK_THEME } from './grayRock';
export { AURORA_THEME } from './aurora';
export { HIGH_CONTRAST_THEME } from './highContrast';
export { LOW_MOTION_THEME } from './lowMotion';

export const THEME_PRESETS = {
  OPERATOR: 'operator',
  KIDS: 'kids',
  GRAY_ROCK: 'gray-rock',
  AURORA: 'aurora',
  HIGH_CONTRAST: 'high-contrast',
  LOW_MOTION: 'low-motion',
} as const;

export type ThemePresetKey = keyof typeof THEME_PRESETS;
