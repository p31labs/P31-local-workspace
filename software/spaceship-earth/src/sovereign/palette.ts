/**
 * P31 Andromeda - Global Theme Palette
 * Single source of truth for TypeScript/React component styling.
 * Maps directly to styles.css variables for automatic theme swapping.
 */

export const P = {
  // Core Colors
  cyan: 'var(--cyan)',
  magenta: 'var(--magenta)',
  violet: 'var(--violet)',
  amber: 'var(--amber)',

  // Extended Accents
  coral: 'var(--coral)',
  mint: 'var(--mint)',
  pink: 'var(--pink)',
  orange: 'var(--orange)',

  // Neutrals
  text: 'var(--text)',
  dim: 'var(--dim)',
  void: 'var(--void)',

  // Neons & Opacities
  neon: 'var(--neon)',
  neonDim: 'var(--neon-dim)',
  neonFaint: 'var(--neon-faint)',
  neonGhost: 'var(--neon-ghost)',

  // Surfaces
  surface: 'var(--surface)',
  s1: 'var(--s1)',
  s2: 'var(--s2)',
  s3: 'var(--s3)',

  // Glow presets (for React inline textShadow where utilities don't fit)
  glowCyan: 'var(--glow-cyan)',
  glowAmber: 'var(--glow-amber)',
  glowViolet: 'var(--glow-violet)',
  glowMagenta: 'var(--glow-magenta)',

  // Layout tokens
  radiusSm: 'var(--radius-sm)',
  radiusMd: 'var(--radius-md)',
  radiusLg: 'var(--radius-lg)',
} as const;
