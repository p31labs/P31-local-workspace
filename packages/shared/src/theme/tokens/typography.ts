// packagess/shared/src/theme/tokens/typography.ts

export const TYPOGRAPHY_TOKENS = {
  fontFamily: {
    mono: "'Space Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    sans: "'Inter', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif",
    display: "'Oxanium', ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
  },
  fontSize: {
    xs: 'clamp(8px, 1vh, 10px)',
    sm: 'clamp(9px, 1.2vh, 11px)',
    base: 'clamp(10px, 1.3vh, 12px)',
    lg: 'clamp(12px, 1.6vh, 14px)',
    xl: 'clamp(16px, 2vh, 20px)',
    '2xl': 'clamp(20px, 3.5vh, 32px)',
    '3xl': 'clamp(24px, 4vh, 40px)',
    '4xl': 'clamp(32px, 5vh, 48px)',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export type TypographyTokenKey = keyof typeof TYPOGRAPHY_TOKENS;