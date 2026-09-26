/**
 * P31 typography — two weights only (400 body / 500 emphasis).
 * Heading hierarchy comes from SIZE (type-scale tokens), never weight.
 */

export const fontStacks = {
  sans: "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, 'SF Mono', monospace",
  display: "'Inter', system-ui, sans-serif",
} as const;

/** The ONLY two weights permitted anywhere in the system. */
export const fontWeightTokens = {
  body: 400,
  emphasis: 500,
} as const;

export const typographyScale = {
  caption: '11px',
  label: '12px',
  body: '14px',
  h3: '16px',
  h2: '20px',
  h1: '26px',
  display: '34px',
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.65,
} as const;
