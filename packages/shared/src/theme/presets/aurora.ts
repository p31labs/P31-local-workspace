// packages/shared/src/theme/presets/aurora.ts

import { BRAND_COLORS, AXIS_COLORS, SEMANTIC_COLORS, TYPOGRAPHY_TOKENS, ANIMATION_TOKENS, SPACING_TOKENS } from '../tokens';
import type { ThemeConfig } from '../types';

export const AURORA_THEME: ThemeConfig = {
  id: 'aurora',
  name: 'Aurora',
  mode: 'dark',
  skin: 'AURORA',
  contrast: 'normal',
  density: 'comfortable',
  tokens: {
    color: {
      // Brand colors - vibrant and saturated
      phosphor: '#00FF88', // Keep original for consistency
      phosphorMuted: '#00E68A',
      quantumCyan: '#00D4FF',
      quantumViolet: '#7A27FF',
      phosphorOrange: '#FF6600',
      calciumAmber: '#F59E0B',
      dangerRed: '#EF4444',
      
      // Axis colors - enhanced saturation
      body: '#FF9944',
      mesh: '#44AAFF',
      forge: '#44FFAA',
      shield: '#FF4466',
      
      // UI layers - deep space with subtle gradients
      void: '#050510', // Deep space
      voidLight: '#0b0f19',
      surface: '#0a0a1a',
      surfaceElevated: '#111122',
      border: '#2a2a40',
      borderSubtle: '#1f1f33',
      
      // Text colors - crisp and readable
      textPrimary: '#e8eef4',
      textSecondary: '#b8c1d6',
      textMuted: '#8a94a8',
      textInverse: '#ffffff',
      
      // Semantic colors - vibrant
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    typography: {
      ...TYPOGRAPHY_TOKENS,
      fontSize: {
        ...TYPOGRAPHY_TOKENS.fontSize,
        base: 'clamp(10px, 1.3vh, 12px)',
        lg: 'clamp(12px, 1.6vh, 14px)',
        xl: 'clamp(16px, 2vh, 20px)',
      },
    },
    spacing: {
      ...SPACING_TOKENS,
      md: '12px',
      lg: '16px',
    },
    animation: {
      ...ANIMATION_TOKENS,
      duration: {
        ...ANIMATION_TOKENS.duration,
        normal: '0.25s', // Slightly slower for more dramatic effect
      },
    },
  },
  skinOverride: {
    background: '#050510',
    foreground: '#e8eef4',
    primary: '#00FF88',
    secondary: '#00D4FF',
    accent: '#7A27FF',
    muted: '#8a94a8',
    glassOpacity: 0.18, // Slightly more opacity for depth
    borderRadius: '10px', // More rounded
    reduceMotion: false,
  },
};