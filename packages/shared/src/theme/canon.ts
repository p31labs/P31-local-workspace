/**
 * P31 Canon — re-exports from @p31/design-core (mathematical foundation).
 * Previously: p31-universal-canon.json v1.2.0 (arbitrary values).
 * Now: @p31/design-core v2.0.0 (mathematically-derived values).
 *
 * All visual values derive from PHI (1.618), Perfect Fourth (1.333),
 * 4-multiple grid, OKLCH color space, and musical tempo (120 BPM).
 */

import { COLORS, GLASS, FONT_SIZES } from '@p31/design-core/tokens';

export const CANON_VERSION = '2.0.0';

export type P31Appearance = 'hub' | 'org';

/** Brand palette — identical to DESIGN.md / @p31/design-core */
export const CANON_PALETTE = {
  coral: '#FB7185',
  teal: '#34D399',
  cyan: '#00F0FF',
  amber: '#FBBF24',
  lavender: '#A78BFA',
  phosphorus: '#34D399',
  phosphor: '#00F0FF',
  fuchsia: '#A78BFA',
} as const;

export type CanonPaletteKey = keyof typeof CANON_PALETTE;

export const CANON_FONTS = {
  sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
  mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
} as const;

export const CANON_FONT_SCALE: Record<string, string> = {
  xs: '0.44rem',
  sm: '0.75rem',
  base: '1rem',
  md: '1rem',
  lg: '1.33rem',
  xl: '1.78rem',
  '2xl': '2.37rem',
  '3xl': '3.16rem',
  '4xl': '3.16rem',
};

export const CANON_LINE_HEIGHT = {
  tight: '1.1',
  snug: '1.2',
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
  '5': '1.5rem',
  '6': '1.5rem',
  '8': '2rem',
  '10': '3rem',
  '12': '3rem',
  '16': '4rem',
  '20': '6rem',
  '24': '6rem',
};

export const CANON_RADIUS: Record<string, string> = {
  none: '0',
  sm: '8px',
  md: '12px',
  lg: '24px',
  xl: '24px',
  '2xl': '24px',
  full: '9999px',
};

export const CANON_SHADOW: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.06)',
  md: '0 4px 14px rgba(0, 0, 0, 0.08)',
  lg: '0 12px 40px rgba(0, 0, 0, 0.12)',
  glowTeal: '0 0 24px rgba(0, 240, 255, 0.25)',
};

export const CANON_MOTION_DURATION = {
  instant: '63',
  fast: '125',
  normal: '250',
  slow: '500',
  glacial: '1000',
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
  hubRingColor: 'rgba(0, 240, 255, 0.55)',
  orgRingColor: 'rgba(0, 240, 255, 0.45)',
} as const;

export interface AppearanceColors {
  colorScheme: ThemeMode;
  themeColor: string;
  colors: {
    voidDeep: string;
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

import type { ThemeMode } from './types';

// Single dark-only appearance. The org (light mode) appearance is retired.
export const CANON_APPEARANCES: Record<P31Appearance, AppearanceColors> = {
  hub: {
    colorScheme: 'dark',
    themeColor: COLORS.voidDeep,
    colors: {
      voidDeep: COLORS.voidDeep,
      void: COLORS.void,
      surface: COLORS.surface,
      surface2: COLORS.surface2,
      coral: '#FB7185',
      teal: '#34D399',
      cyan: COLORS.accent,
      cloud: COLORS.cloud,
      amber: COLORS.gold,
      lavender: COLORS.violet,
      phosphorus: COLORS.green,
      paper: '#F5F5F7',
      ink: '#0A0A0F',
      muted: '#6b7280',
      phosphor: COLORS.accent,
      fuchsia: COLORS.violet,
    },
    semantic: { borderSubtle: 'rgba(255, 255, 255, 0.06)' },
    glass: { border: GLASS.border, surface: GLASS.surface },
  },
  org: {
    colorScheme: 'dark',
    themeColor: COLORS.voidDeep,
    colors: {
      voidDeep: COLORS.voidDeep,
      void: COLORS.void,
      surface: COLORS.surface,
      surface2: COLORS.surface2,
      coral: '#FB7185',
      teal: '#34D399',
      cyan: COLORS.accent,
      cloud: COLORS.cloud,
      amber: COLORS.gold,
      lavender: COLORS.violet,
      phosphorus: COLORS.green,
      paper: '#F5F5F7',
      ink: '#0A0A0F',
      muted: '#6b7280',
      phosphor: COLORS.accent,
      fuchsia: COLORS.violet,
    },
    semantic: { borderSubtle: 'rgba(255, 255, 255, 0.06)' },
    glass: { border: GLASS.border, surface: GLASS.surface },
  },
};

/** Return appearance colors — now dark-only for both hub and org */
export function getAppearance(appearance: P31Appearance): AppearanceColors {
  return CANON_APPEARANCES[appearance];
}
