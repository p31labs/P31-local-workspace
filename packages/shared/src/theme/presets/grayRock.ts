// packages/shared/src/theme/presets/grayRock.ts

import { BRAND_COLORS, AXIS_COLORS, SEMANTIC_COLORS, TYPOGRAPHY_TOKENS, ANIMATION_TOKENS, SPACING_TOKENS } from '../tokens';
import type { ThemeConfig } from '../types';

export const GRAY_ROCK_THEME: ThemeConfig = {
  id: 'gray-rock',
  name: 'Gray Rock',
  mode: 'dark',
  skin: 'GRAY_ROCK',
  contrast: 'normal',
  density: 'compact',
  tokens: {
    color: {
      // Brand colors - desaturated grayscale
      phosphor: '#888888', // Desaturated
      phosphorMuted: '#777777',
      quantumCyan: '#888888',
      quantumViolet: '#888888',
      phosphorOrange: '#888888',
      calciumAmber: '#888888',
      dangerRed: '#888888',
      
      // Axis colors - all gray
      body: '#999999',
      mesh: '#999999',
      forge: '#999999',
      shield: '#999999',
      
      // UI layers - minimal contrast
      void: '#0a0a0a', // Very dark gray
      voidLight: '#111111',
      surface: '#111111',
      surfaceElevated: '#1a1a1a',
      border: '#333333',
      borderSubtle: '#2a2a2a',
      
      // Text colors - high contrast for readability
      textPrimary: '#e0e0e0',
      textSecondary: '#b0b0b0',
      textMuted: '#808080',
      textInverse: '#ffffff',
      
      // Semantic colors - grayscale
      success: '#888888',
      warning: '#888888',
      error: '#888888',
      info: '#888888',
    },
    typography: {
      ...TYPOGRAPHY_TOKENS,
      fontFamily: {
        ...TYPOGRAPHY_TOKENS.fontFamily,
        mono: "'Inter', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif", // No monospace for reduced stimulation
        display: "'Inter', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif", // No decorative fonts
      },
      fontSize: {
        ...TYPOGRAPHY_TOKENS.fontSize,
        base: 'clamp(10px, 1.2vh, 12px)', // Slightly smaller for compact density
        lg: 'clamp(12px, 1.5vh, 14px)',
      },
    },
    spacing: {
      ...SPACING_TOKENS,
      md: '8px', // Compact spacing
      lg: '12px',
    },
    animation: {
      ...ANIMATION_TOKENS,
      duration: {
        instant: '0s',
        fast: '0.05s', // Very fast to minimize visual distraction
        normal: '0.1s',
        slow: '0.2s',
        slowest: '0.3s',
      },
    },
  },
  skinOverride: {
    background: '#0a0a0a',
    foreground: '#e0e0e0',
    primary: '#888888',
    secondary: '#888888',
    accent: '#888888',
    muted: '#808080',
    glassOpacity: 0.05, // Minimal transparency
    borderRadius: '4px', // Sharp corners
    reduceMotion: true, // Always reduce motion
  },
};