/**
 * P31 color system — Pattern B (semantic-first).
 * Ramps are the single source of truth; compiled to CSS custom
 * properties by `scripts/gen-tokens.mts` → src/generated/color-palette.css.
 * Dark mode inverts semantic aliases via prefers-color-scheme.
 */

export const colorRamps = {
  // Neutral
  neutral: ['oklch(1.000 0.000 90)', 'oklch(0.979 0.007 97)', 'oklch(0.923 0.015 98)', 'oklch(0.859 0.014 97)', 'oklch(0.622 0.010 100)', 'oklch(0.482 0.006 95)', 'oklch(0.386 0.005 107)', 'oklch(0.292 0.004 107)'],

  // Semantic (matches intended use)
  accent: ['oklch(0.953 0.018 245)', 'oklch(0.858 0.056 249)', 'oklch(0.764 0.092 250)', 'oklch(0.623 0.149 252)', 'oklch(0.481 0.131 252)', 'oklch(0.385 0.110 253)', 'oklch(0.291 0.083 252)'],
  danger: ['oklch(0.954 0.019 17)', 'oklch(0.859 0.062 18)', 'oklch(0.763 0.110 20)', 'oklch(0.623 0.188 25)', 'oklch(0.480 0.154 25)', 'oklch(0.387 0.124 25)', 'oklch(0.292 0.091 25)'],
  success: ['oklch(0.952 0.029 126)', 'oklch(0.859 0.097 127)', 'oklch(0.765 0.145 128)', 'oklch(0.622 0.156 131)', 'oklch(0.481 0.130 135)', 'oklch(0.386 0.107 136)', 'oklch(0.291 0.081 136)'],
  warning: ['oklch(0.953 0.029 81)', 'oklch(0.858 0.116 78)', 'oklch(0.764 0.154 71)', 'oklch(0.622 0.130 67)', 'oklch(0.480 0.104 64)', 'oklch(0.386 0.084 63)', 'oklch(0.292 0.063 65)'],

  // Decorative (use only when semantic doesn't apply)
  teal: ['oklch(0.953 0.023 173)', 'oklch(0.859 0.073 172)', 'oklch(0.765 0.115 168)', 'oklch(0.623 0.123 165)', 'oklch(0.481 0.091 170)', 'oklch(0.386 0.070 174)', 'oklch(0.292 0.051 178)'],
  purple: ['oklch(0.952 0.023 289)', 'oklch(0.858 0.059 288)', 'oklch(0.764 0.095 288)', 'oklch(0.623 0.150 285)', 'oklch(0.481 0.166 282)', 'oklch(0.386 0.136 282)', 'oklch(0.292 0.102 282)'],
  coral: ['oklch(0.953 0.017 41)', 'oklch(0.859 0.061 40)', 'oklch(0.764 0.113 40)', 'oklch(0.623 0.168 38)', 'oklch(0.480 0.132 38)', 'oklch(0.386 0.105 39)', 'oklch(0.291 0.076 38)'],
  pink: ['oklch(0.952 0.020 354)', 'oklch(0.859 0.063 357)', 'oklch(0.764 0.114 359)', 'oklch(0.622 0.167 3)', 'oklch(0.482 0.136 3)', 'oklch(0.387 0.112 3)', 'oklch(0.290 0.084 2)'],
} as const;

export type RampName = keyof typeof colorRamps;

/** Step labels for the 7-entry ramps (light → dark). */
export const RAMP_STEPS = ['50', '100', '200', '400', '600', '800', '900'] as const;

/** Base shade index used for bare `--p31-{ramp}` aliases (= oklch(0.623 0.149 252) for accent). */
export const RAMP_BASE_INDEX = 3;

export const colorTokens = {
  bg: {
    page: 'var(--p31-bg)',
    card: 'var(--p31-surface)',
    elevated: 'var(--p31-surface-s2)',
    glass: 'var(--p31-glass-bg)',
    glassDark: 'var(--p31-glass-bg-strong)',
  },
  text: {
    primary: 'var(--p31-text)',
    secondary: 'var(--p31-text-secondary)',
    muted: 'var(--p31-text-tertiary)',
    accent: 'var(--p31-accent)',
    danger: 'var(--p31-status-error)',
    success: 'var(--p31-status-online)',
    warning: 'var(--p31-status-warning)',
  },
  border: {
    default: '1px solid var(--p31-glass-border)',
    strong: '1px solid var(--p31-glass-border-strong)',
    accent: '1px solid var(--p31-accent)',
    danger: '1px solid var(--p31-status-error)',
  },
} as const;
