// packages/shared/src/theme/presets/lowMotion.ts

import { BRAND_COLORS, AXIS_COLORS, SEMANTIC_COLORS, TYPOGRAPHY_TOKENS, ANIMATION_TOKENS, SPACING_TOKENS } from '../tokens';
import type { ThemeConfig } from '../types';

export const LOW_MOTION_THEME: ThemeConfig = {
  id: 'low-motion',
  name: 'Low Motion',
  mode: 'dark',
  skin: 'LOW_MOTION',
  contrast: 'normal',
  density: 'comfortable',
  tokens: {
    color: {
      // Brand colors - calming and stable
      phosphor: '#4ade80', // Softer green
      phosphorMuted: '#22c55e',
      quantumCyan: '#60a5fa', // Softer blue
      quantumViolet: '#a78bfa', // Softer purple
      phosphorOrange: '#f59e0b', // Softer orange
      calciumAmber: '#f59e0b',
      dangerRed: '#ef4444',
      
      // Axis colors - muted versions
      body: '#f59e0b', // Calming orange
      mesh: '#60a5fa', // Calming blue
      forge: '#4ade80', // Calming green
      shield: '#ef4444', // Calming red
      
      // UI layers - stable and consistent
      void: '#0a0a1a', // Stable dark
      voidLight: '#111122',
      surface: '#0f172a', // Slightly lighter for depth
      surfaceElevated: '#1e293b',
      border: '#334155',
      borderSubtle: '#1e293b',
      
      // Text colors - easy on the eyes
      textPrimary: '#e2e8f0',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      textInverse: '#ffffff',
      
      // Semantic colors - muted
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#60a5fa',
    },
    typography: {
      ...TYPOGRAPHY_TOKENS,
      fontSize: {
        ...TYPOGRAPHY_TOKENS.fontSize,
        base: 'clamp(11px, 1.4vh, 13px)', // Comfortable reading size
        lg: 'clamp(14px, 1.8vh, 16px)',
      },
    },
    spacing: {
      ...SPACING_TOKENS,
      md: '16px', // Generous spacing
      lg: '24px',
    },
    animation: {
      ...ANIMATION_TOKENS,
      duration: {
        instant: '0s',
        fast: '0.05s', // Minimal animation
        normal: '0.1s',
        slow: '0.15s',
        slowest: '0.2s',
      },
    },
  },
  skinOverride: {
    background: '#0a0a1a',
    foreground: '#e2e8f0',
    primary: '#4ade80',
    secondary: '#60a5fa',
    accent: '#a78bfa',
    muted: '#64748b',
    glassOpacity: 0.1, // Minimal transparency
    borderRadius: '6px', // Gentle curves
    reduceMotion: true, // Always reduce motion
  },
};