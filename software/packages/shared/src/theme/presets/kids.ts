// packages/shared/src/theme/presets/kids.ts

import { BRAND_COLORS, AXIS_COLORS, SEMANTIC_COLORS, TYPOGRAPHY_TOKENS, ANIMATION_TOKENS, SPACING_TOKENS } from '../tokens';
import type { ThemeConfig } from '../types';

export const KIDS_THEME: ThemeConfig = {
  id: 'kids',
  name: 'Kids',
  mode: 'dark',
  skin: 'KIDS',
  contrast: 'normal',
  density: 'comfortable',
  tokens: {
    color: {
      // Brand colors - warmer, friendlier palette
      phosphor: '#E9C46A', // Warm amber instead of neon green
      phosphorMuted: '#D4A356',
      quantumCyan: '#6ECEDA', // Softer cyan
      quantumViolet: '#B873FF', // Softer violet
      phosphorOrange: BRAND_COLORS.phosphorOrange,
      calciumAmber: BRAND_COLORS.calciumAmber,
      dangerRed: BRAND_COLORS.dangerRed,
      
      // Axis colors - more pastel
      body: '#FFB880', // Softer orange
      mesh: '#80CCFF', // Softer blue
      forge: '#80FFCC', // Softer green
      shield: '#FF8099', // Softer pink
      
      // UI layers - warmer dark theme
      void: '#1e1b4b', // Warmer dark blue
      voidLight: '#2a266b',
      surface: '#2a266b',
      surfaceElevated: '#3a348b',
      border: '#5a52b0',
      borderSubtle: '#4a4290',
      
      // Text colors - adjusted for warmer background
      textPrimary: '#e8e6ff',
      textSecondary: '#d8d6ff', // ↑ from #c8c6ff for WCAG AA
      textMuted: '#b8b6d0',    // ↑ from #a8a6c0 for WCAG AA
      textInverse: '#ffffff',
      
      // Semantic colors - friendlier versions
      success: '#4ade80', // Brighter green
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#60a5fa',
    },
    typography: {
      ...TYPOGRAPHY_TOKENS,
      fontSize: {
        ...TYPOGRAPHY_TOKENS.fontSize,
        base: 'clamp(11px, 1.4vh, 13px)', // Slightly larger for readability
        lg: 'clamp(14px, 1.8vh, 16px)',
      },
    },
    spacing: {
      ...SPACING_TOKENS,
      md: '16px', // More generous spacing
      lg: '24px',
    },
    animation: {
      ...ANIMATION_TOKENS,
      duration: {
        ...ANIMATION_TOKENS.duration,
        normal: '0.3s', // Slower animations for better comprehension
      },
    },
  },
  skinOverride: {
    background: '#1e1b4b',
    foreground: '#e8e6ff',
    primary: '#E9C46A',
    secondary: '#6ECEDA',
    accent: '#B873FF',
    muted: '#a8a6c0',
    glassOpacity: 0.2, // Slightly more opaque for better readability
    borderRadius: '12px', // More rounded corners
    reduceMotion: false,
  },
};