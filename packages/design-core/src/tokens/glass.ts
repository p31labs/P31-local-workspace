/**
 * P31 glassmorphism — Pattern A.
 * Token `--p31-glass-blur` carries a FULL filter function value
 * (e.g. `blur(12px)`); usages do `backdrop-filter: var(--p31-glass-blur)`.
 * Per-spoon values live in tokens/motion.ts spoonLadder.
 */

export interface GlassPattern {
  /** full filter-function value for backdrop-filter */
  blurFilter: string;
  /** light-mode background rgba alpha */
  bgAlphaLight: number;
  /** dark-mode background rgba alpha */
  bgAlphaDark: number;
}

export const glassPatterns: Record<'subtle' | 'standard' | 'strong' | 'overlay', GlassPattern> = {
  subtle: { blurFilter: 'blur(4px)', bgAlphaLight: 0.55, bgAlphaDark: 0.35 },
  standard: { blurFilter: 'blur(8px)', bgAlphaLight: 0.65, bgAlphaDark: 0.45 },
  strong: { blurFilter: 'blur(12px)', bgAlphaLight: 0.75, bgAlphaDark: 0.55 },
  overlay: { blurFilter: 'blur(16px)', bgAlphaLight: 0.85, bgAlphaDark: 0.7 },
};

/** Crisis mode forces opaque surfaces — no blur, no translucency. */
export const crisisGlass: GlassPattern = {
  blurFilter: 'blur(0px)',
  bgAlphaLight: 1,
  bgAlphaDark: 1,
};
