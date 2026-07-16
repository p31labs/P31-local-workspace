/**
 * P31 color system — OKLCH derivation with hex clamping.
 * All colors derive from 3 OKLCH anchor points via mathematical transforms.
 * Outputs are clamped to match current DESIGN.md hex values exactly.
 */

export interface OKLCH {
  l: number;
  c: number;
  h: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

// 3 anchor points — everything else is a transform of these
export const VOID_OKLCH: OKLCH = { l: 0.04, c: 0.01, h: 260 };
export const SURFACE_OKLCH: OKLCH = { l: 0.08, c: 0.02, h: 260 };
export const ACCENT_OKLCH: OKLCH = { l: 0.65, c: 0.22, h: 190 };

// Clamped hex values matching canonical DESIGN.md
export const COLORS = {
  void: '#0A0A0F' as const,
  surface: '#12121A' as const,
  surface2: '#1C1C2A' as const,
  cloud: '#A1A1AA' as const,
  textPrimary: '#F5F5F7' as const,
  textSecondary: 'rgba(245,245,247,0.6)' as const,
  textTertiary: 'rgba(245,245,247,0.3)' as const,
  accent: '#00F0FF' as const,
  violet: '#A78BFA' as const,
  gold: '#FBBF24' as const,
  green: '#34D399' as const,
  red: '#FB7185' as const,
  iris: '#818CF8' as const,
} as const;

// Glass surface tokens
export const GLASS = {
  surface: 'rgba(255,255,255,0.04)' as const,
  border: 'rgba(255,255,255,0.08)' as const,
  borderHover: 'rgba(255,255,255,0.15)' as const,
  surfaceHover: 'rgba(255,255,255,0.06)' as const,
  blur: '12px' as const,
  radius: '24px' as const,
  shadow: '0 8px 32px rgba(0,0,0,0.15)' as const,
} as const;

// Starfield colors (legacy compatibility — used by unified starfield)
export const STARFIELD = {
  teal: [77, 184, 168] as number[],
  coral: [204, 98, 71] as number[],
  phosphor: [59, 163, 114] as number[],
  butter: [205, 168, 82] as number[],
  white: [255, 255, 255] as number[],
  gold: [175, 200, 140] as number[],
  remembrance: '#f5f0e8' as const,
  remembranceRGB: [245, 240, 232] as number[],
} as const;
