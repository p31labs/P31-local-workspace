// packages/shared/src/theme/presets/highContrast.ts

import { BRAND_COLORS, AXIS_COLORS, SEMANTIC_COLORS, TYPOGRAPHY_TOKENS, ANIMATION_TOKENS, SPACING_TOKENS } from '../tokens';
import type { ThemeConfig } from '../types';

export const HIGH_CONTRAST_THEME: ThemeConfig = {
  id: 'high-contrast',
  name: 'High Contrast',
  mode: 'dark',
  skin: 'HIGH_CONTRAST',
  contrast: 'high',
  density: 'comfortable',
  tokens: {
    color: {
      // Brand colors - maximum contrast versions
      phosphor: '#00FFFF', // Cyan for maximum visibility
      phosphorMuted: '#00CCCC',
      quantumCyan: '#00FFFF',
      quantumViolet: '#FF00FF', // Magenta
      phosphorOrange: '#FFFF00', // Yellow
      calciumAmber: '#FFFF00',
      dangerRed: '#FF0000', // Pure red
      
      // Axis colors - high contrast
      body: '#FF0000', // Red for body/health
      mesh: '#00FFFF', // Cyan for mesh/relationships
      forge: '#00FF00', // Green for forge/products
      shield: '#FF00FF', // Magenta for shield/legal
      
      // UI layers - maximum contrast
      void: '#000000', // Pure black
      voidLight: '#111111',
      surface: '#000000',
      surfaceElevated: '#111111',
      border: '#FFFFFF', // White borders
      borderSubtle: '#CCCCCC',
      
      // Text colors - maximum contrast
      textPrimary: '#FFFFFF', // White text
      textSecondary: '#CCCCCC',
      textMuted: '#888888',
      textInverse: '#000000', // Black for inverse
      
      // Semantic colors - high contrast
      success: '#00FF00', // Bright green
      warning: '#FFFF00', // Bright yellow
      error: '#FF0000', // Bright red
      info: '#00FFFF', // Bright cyan
    },
    typography: {
      ...TYPOGRAPHY_TOKENS,
      fontSize: {
        ...TYPOGRAPHY_TOKENS.fontSize,
        base: 'clamp(12px, 1.5vh, 14px)', // Larger for accessibility
        lg: 'clamp(16px, 2.2vh, 20px)',
        xl: 'clamp(20px, 3vh, 28px)',
      },
      fontWeight: {
        ...TYPOGRAPHY_TOKENS.fontWeight,
        normal: 600, // Bolder text for better readability
        medium: 700,
        semibold: 800,
        bold: 900,
      },
    },
    spacing: {
      ...SPACING_TOKENS,
      md: '16px', // More generous spacing
      lg: '24px',
      '2xl': '40px',
    },
    animation: {
      ...ANIMATION_TOKENS,
      duration: {
        instant: '0s',
        fast: '0.1s', // Faster animations to reduce distraction
        normal: '0.15s',
        slow: '0.2s',
        slowest: '0.3s',
      },
    },
  },
  skinOverride: {
    background: '#000000',
    foreground: '#FFFFFF',
    primary: '#00FFFF',
    secondary: '#FF00FF',
    accent: '#FFFF00',
    muted: '#888888',
    glassOpacity: 0, // No transparency for maximum contrast
    borderRadius: '0px', // Sharp corners for clarity
    reduceMotion: true, // Always reduce motion for accessibility
  },
};