/**
 * Typed bridge to p31-universal-canon.json v1.2.0
 * Single source of truth – embed values from the canon JSON.
 * When the canon JSON is updated, update this file manually.
 */
import type { ThemeMode } from './types';

// ─── Canon JSON v1.2.0 values ───────────────────────────────────────────────

export const CANON_VERSION = '1.2.0';

export type P31Appearance = 'hub' | 'org';

/** Brand anchors – identical across appearances */
export const CANON_PALETTE = {
  coral: '#cc6247',
  teal: '#5DCAA5',
  cyan: '#4db8a8',
  amber: '#cda852',
  lavender: '#8b7cc9',
  phosphorus: '#3ba372',
  phosphor: '#00FF88',
  fuchsia: '#e879f9',
} as const;

export type CanonPaletteKey = keyof typeof CANON_PALETTE;

export const CANON_FONTS = {
  sans: ['Atkinson Hyperlegible', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
} as const;

export const CANON_FONT_SCALE: Record<string, string> = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  md: '1.0625rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
};

export const CANON_LINE_HEIGHT = {
  tight: '1.25',
  snug: '1.4',
  normal: '1.6',
  relaxed: '1.75',
} as const;

export const CANON_LETTER_SPACING = {
  tight: '-0.02em',
  normal: '0',
  wide: '0.08em',
  caps: '0.12em',
} as const;

export const CANON_SPACING: Record<string, string> = {
  px: '1px',
  '0': '0',
  '1': '0.25rem',
  '2': '0.5rem',
  '3': '0.75rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '8': '2rem',
  '10': '2.5rem',
  '12': '3rem',
  '16': '4rem',
  '20': '5rem',
  '24': '6rem',
};

export const CANON_RADIUS: Record<string, string> = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '1.25rem',
  full: '9999px',
};

export const CANON_SHADOW: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.06)',
  md: '0 4px 14px rgba(0, 0, 0, 0.08)',
  lg: '0 12px 40px rgba(0, 0, 0, 0.12)',
  glowTeal: '0 0 24px rgba(37, 137, 125, 0.25)',
};

export const CANON_MOTION_DURATION = {
  instant: '100',
  fast: '150',
  normal: '250',
  slow: '400',
  glacial: '800',
} as const;

export const CANON_MOTION_EASING = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
} as const;

export const CANON_Z_INDEX = {
  base: 0,
  dropdown: 50,
  sticky: 100,
  overlay: 200,
  modal: 300,
  toast: 400,
} as const;

export const CANON_FOCUS = {
  ringWidth: '2px',
  ringOffset: '2px',
  hubRingColor: 'rgba(77, 184, 168, 0.55)',
  orgRingColor: 'rgba(37, 137, 125, 0.45)',
} as const;

export interface AppearanceColors {
  colorScheme: ThemeMode;
  themeColor: string;
  colors: {
    void: string;
    surface: string;
    surface2: string;
    coral: string;
    teal: string;
    cyan: string;
    cloud: string;
    amber: string;
    lavender: string;
    phosphorus: string;
    paper: string;
    ink: string;
    muted: string;
    phosphor: string;
    fuchsia: string;
  };
  semantic: { borderSubtle: string };
  glass: { border: string; surface: string };
}

export const CANON_APPEARANCES: Record<P31Appearance, AppearanceColors> = {
  hub: {
    colorScheme: 'dark',
    themeColor: '#0f1115',
    colors: {
      void: '#0f1115',
      surface: '#161920',
      surface2: '#1c2028',
      coral: '#cc6247',
      teal: '#5DCAA5',
      cyan: '#4db8a8',
      cloud: '#d8d6d0',
      amber: '#cda852',
      lavender: '#8b7cc9',
      phosphorus: '#3ba372',
      paper: '#f4f4f5',
      ink: '#1e293b',
      muted: '#6b7280',
      phosphor: '#00FF88',
      fuchsia: '#e879f9',
    },
    semantic: { borderSubtle: 'rgba(255, 255, 255, 0.06)' },
    glass: { border: 'rgba(255, 255, 255, 0.08)', surface: 'rgba(255, 255, 255, 0.04)' },
  },
  org: {
    colorScheme: 'light',
    themeColor: '#f5f4f0',
    colors: {
      void: '#f5f4f0',
      surface: '#ffffff',
      surface2: '#ebeae4',
      coral: '#cc6247',
      teal: '#5DCAA5',
      cyan: '#4db8a8',
      cloud: '#1e293b',
      amber: '#cda852',
      lavender: '#8b7cc9',
      phosphorus: '#3ba372',
      paper: '#fdfcfa',
      ink: '#0f172a',
      muted: '#64748b',
      phosphor: '#00FF88',
      fuchsia: '#e879f9',
    },
    semantic: { borderSubtle: 'rgba(15, 23, 42, 0.09)' },
    glass: { border: 'rgba(15, 23, 42, 0.07)', surface: 'rgba(255, 255, 255, 0.82)' },
  },
};

/** Return appearance colors for the given appearance key */
export function getAppearance(appearance: P31Appearance): AppearanceColors {
  return CANON_APPEARANCES[appearance];
}
