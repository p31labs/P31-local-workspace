// packages/shared/src/theme/presets/operator.ts

import { BRAND_COLORS, AXIS_COLORS, SEMANTIC_COLORS, TYPOGRAPHY_TOKENS, ANIMATION_TOKENS, SPACING_TOKENS } from '../tokens';
import type { ThemeConfig } from '../types';

export const OPERATOR_THEME: ThemeConfig = {
  id: 'operator',
  name: 'Operator',
  mode: 'dark',
  skin: 'OPERATOR',
  contrast: 'normal',
  density: 'comfortable',
  tokens: {
    color: {
      // Brand colors
      phosphor: BRAND_COLORS.phosphor,
      phosphorMuted: BRAND_COLORS.phosphorMuted,
      quantumCyan: BRAND_COLORS.quantumCyan,
      quantumViolet: BRAND_COLORS.quantumViolet,
      phosphorOrange: BRAND_COLORS.phosphorOrange,
      calciumAmber: BRAND_COLORS.calciumAmber,
      dangerRed: BRAND_COLORS.dangerRed,
      
      // Axis colors
      body: AXIS_COLORS.body,
      mesh: AXIS_COLORS.mesh,
      forge: AXIS_COLORS.forge,
      shield: AXIS_COLORS.shield,
      
      // UI layers
      void: SEMANTIC_COLORS.void,
      voidLight: SEMANTIC_COLORS.voidLight,
      surface: SEMANTIC_COLORS.surface,
      surfaceElevated: SEMANTIC_COLORS.surfaceElevated,
      border: SEMANTIC_COLORS.border,
      borderSubtle: SEMANTIC_COLORS.borderSubtle,
      
      // Text colors
      textPrimary: SEMANTIC_COLORS.textPrimary,
      textSecondary: SEMANTIC_COLORS.textSecondary,
      textMuted: SEMANTIC_COLORS.textMuted,
      textInverse: SEMANTIC_COLORS.textInverse,
      
      // Semantic colors
      success: SEMANTIC_COLORS.success,
      warning: SEMANTIC_COLORS.warning,
      error: SEMANTIC_COLORS.error,
      info: SEMANTIC_COLORS.info,
    },
    typography: TYPOGRAPHY_TOKENS,
    spacing: SPACING_TOKENS,
    animation: ANIMATION_TOKENS,
  },
  skinOverride: {
    background: SEMANTIC_COLORS.void,
    foreground: SEMANTIC_COLORS.textPrimary,
    primary: BRAND_COLORS.phosphor,
    secondary: BRAND_COLORS.quantumCyan,
    accent: BRAND_COLORS.quantumViolet,
    muted: SEMANTIC_COLORS.textMuted,
    glassOpacity: 0.15,
    borderRadius: '8px',
    reduceMotion: false,
  },
};