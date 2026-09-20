/**
 * @p31/canon — theming/theme-store.ts
 * ==============================================================
 * THE file that was a ghost in @p31/ui (exported as
 * "./theming/theme-store" but never present on disk).
 *
 * In CANON this file is REAL. It is the single source of truth
 * for theme identity: every theme id, every label, every token
 * value. Nothing else in the canon may define a theme id.
 *
 * It also can never ghost again — the generate-exports ghost gate
 * hard-fails the build if this file is removed while any consumer
 * still imports the specifier, and the generator refuses to emit a
 * specifier whose target file is missing. Structural closure.
 */

/** Nine themes, one identity registry. */
export type ThemeId =
  | 'cipher'
  | 'garden'
  | 'retro'
  | 'ocean'
  | 'sunset'
  | 'mono'
  | 'aurora'
  | 'zen'
  | 'volt';

export const THEME_IDS: readonly ThemeId[] = [
  'cipher',
  'garden',
  'retro',
  'ocean',
  'sunset',
  'mono',
  'aurora',
  'zen',
  'volt',
] as const;

export const DEFAULT_THEME: ThemeId = 'ocean';

/**
 * Legacy alias → canon id. Consumers that shipped the OLD id (before
 * canon) can keep shipping the old id; the store normalizes it here.
 * There is exactly ONE place that owns this mapping, and it is here.
 */
export const THEME_ALIASES = {
  rebel: 'ocean',
  quantum: 'cipher',
  dusk: 'sunset',
  caretaker: 'cipher',
} as const;

export function resolveThemeId(input: string | null | undefined): ThemeId {
  if (!input) return DEFAULT_THEME;
  if ((THEME_IDS as readonly string[]).includes(input)) return input as ThemeId;
  const alias = THEME_ALIASES[input as keyof typeof THEME_ALIASES];
  return alias ?? DEFAULT_THEME;
}

/** Base semantic tokens shared by every theme ("Layer 2 base").
 * Exported so gen:tokens can derive primitives from it — the only
 * writer of all derived artifacts. */
export const BASE = {
  '--p31-base': '16px',
  '--p31-scale-xs': 'calc(var(--p31-base) * 0.75)',
  '--p31-scale-sm': 'var(--p31-base)',
  '--p31-scale-md': 'calc(var(--p31-base) * 1.3333)',
  '--p31-scale-lg': 'calc(var(--p31-base) * 1.7777)',
  '--p31-scale-xl': 'calc(var(--p31-base) * 2.3703)',
  '--p31-scale-2xl': 'calc(var(--p31-base) * 3.1604)',
  '--p31-radius-sm': '8px',
  '--p31-radius-md': '16px',
  '--p31-radius-lg': '24px',
  '--p31-radius-full': '9999px',
  '--p31-font-sans': "'Space Grotesk', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  '--p31-font-mono': "'JetBrains Mono', ui-monospace, 'SF Mono', 'Fira Code', monospace",
};

/**
 * The theme registry. This is the actual payload that was verified-good
 * by reverse-engineering the vendored tarball: the cipher theme
 * (cyan/violet on void) is the canonical face. Token values use OKLCH
 * throughout — no hex pipelines, no raw sRGB drift.
 */
export interface P31Theme {
  id: ThemeId;
  label: string;
  emoji: string;
  description: string;
  tokens: Record<string, string>;
}

export const THEMES: Record<ThemeId, P31Theme> = {
  cipher: {
    id: 'cipher',
    label: 'Cipher',
    emoji: '🔮',
    description: 'Quantum cyan and violet on void',
    tokens: {
      ...BASE,
      '--p31-bg': 'oklch(10% 0.01 240)',
      '--p31-surface': 'oklch(15% 0.015 240)',
      '--p31-surface2': 'oklch(22% 0.02 240)',
      '--p31-accent': 'oklch(65% 0.18 195)',
      '--p31-accent-cyan': 'oklch(65% 0.18 195)',
      '--p31-accent-violet': 'oklch(65% 0.18 285)',
      '--p31-accent-gold': 'oklch(65% 0.18 15)',
      '--p31-accent-green': 'oklch(65% 0.18 105)',
      '--p31-accent-red': 'oklch(65% 0.18 30)',
      '--p31-accent-iris': 'oklch(65% 0.18 255)',
      '--p31-text-primary': 'oklch(96% 0.005 240)',
      '--p31-text-secondary': 'oklch(75% 0.01 240)',
      '--p31-text-tertiary': 'oklch(55% 0.01 240)',
      '--p31-glass-bg': 'oklch(100% 0.01 240 / 0.05)',
      '--p31-glass-border': 'oklch(100% 0.01 240 / 0.1)',
      '--p31-glass-shadow': '0 8px 32px rgba(0, 0, 0, 0.2)',
    },
  },

  garden: {
    id: 'garden',
    label: 'Garden',
    emoji: '🌿',
    description: 'Warm soil greens — growth and calm',
    tokens: {
      ...BASE,
      '--p31-bg': 'oklch(12% 0.02 140)',
      '--p31-surface': 'oklch(18% 0.025 140)',
      '--p31-surface2': 'oklch(25% 0.03 140)',
      '--p31-accent': 'oklch(70% 0.15 145)',
      '--p31-accent-cyan': 'oklch(70% 0.15 145)',
      '--p31-accent-violet': 'oklch(70% 0.15 185)',
      '--p31-accent-gold': 'oklch(75% 0.15 85)',
      '--p31-accent-green': 'oklch(70% 0.15 145)',
      '--p31-accent-red': 'oklch(65% 0.15 30)',
      '--p31-accent-iris': 'oklch(70% 0.15 220)',
      '--p31-text-primary': 'oklch(95% 0.02 120)',
      '--p31-text-secondary': 'oklch(78% 0.02 130)',
      '--p31-text-tertiary': 'oklch(55% 0.02 130)',
      '--p31-glass-bg': 'oklch(100% 0.01 120 / 0.04)',
      '--p31-glass-border': 'oklch(100% 0.01 120 / 0.1)',
      '--p31-glass-shadow': '0 8px 32px rgba(0, 0, 0, 0.2)',
    },
  },

  retro: {
    id: 'retro',
    label: 'Retro',
    emoji: '🕹️',
    description: 'CRT amber — warm glow, terminal vibes',
    tokens: {
      ...BASE,
      '--p31-bg': 'oklch(8% 0.02 60)',
      '--p31-surface': 'oklch(12% 0.025 60)',
      '--p31-surface2': 'oklch(18% 0.03 60)',
      '--p31-accent': 'oklch(75% 0.18 80)',
      '--p31-accent-cyan': 'oklch(75% 0.18 80)',
      '--p31-accent-violet': 'oklch(70% 0.18 320)',
      '--p31-accent-gold': 'oklch(78% 0.18 70)',
      '--p31-accent-green': 'oklch(65% 0.18 140)',
      '--p31-accent-red': 'oklch(70% 0.18 30)',
      '--p31-accent-iris': 'oklch(70% 0.18 310)',
      '--p31-text-primary': 'oklch(95% 0.05 80)',
      '--p31-text-secondary': 'oklch(78% 0.04 75)',
      '--p31-text-tertiary': 'oklch(52% 0.03 70)',
      '--p31-glass-bg': 'oklch(100% 0.02 60 / 0.05)',
      '--p31-glass-border': 'oklch(100% 0.02 60 / 0.12)',
      '--p31-glass-shadow': '0 8px 32px rgba(255, 180, 0, 0.08)',
    },
  },

  ocean: {
    id: 'ocean',
    label: 'Ocean',
    emoji: '🌊',
    description: 'Deep blue depths — teal and coral',
    tokens: {
      ...BASE,
      '--p31-bg': 'oklch(10% 0.03 240)',
      '--p31-surface': 'oklch(15% 0.04 240)',
      '--p31-surface2': 'oklch(22% 0.045 240)',
      '--p31-accent': 'oklch(70% 0.15 200)',
      '--p31-accent-cyan': 'oklch(70% 0.15 200)',
      '--p31-accent-violet': 'oklch(65% 0.15 250)',
      '--p31-accent-gold': 'oklch(72% 0.15 40)',
      '--p31-accent-green': 'oklch(70% 0.15 160)',
      '--p31-accent-red': 'oklch(70% 0.15 20)',
      '--p31-accent-iris': 'oklch(70% 0.15 230)',
      '--p31-text-primary': 'oklch(95% 0.02 230)',
      '--p31-text-secondary': 'oklch(78% 0.02 235)',
      '--p31-text-tertiary': 'oklch(55% 0.02 235)',
      '--p31-glass-bg': 'oklch(100% 0.01 230 / 0.04)',
      '--p31-glass-border': 'oklch(100% 0.01 230 / 0.08)',
      '--p31-glass-shadow': '0 8px 32px rgba(0, 100, 200, 0.1)',
    },
  },

  sunset: {
    id: 'sunset',
    label: 'Sunset',
    emoji: '🌅',
    description: 'Warm dusk — orange and rose gold',
    tokens: {
      ...BASE,
      '--p31-bg': 'oklch(12% 0.03 30)',
      '--p31-surface': 'oklch(17% 0.035 30)',
      '--p31-surface2': 'oklch(23% 0.04 30)',
      '--p31-accent': 'oklch(72% 0.18 40)',
      '--p31-accent-cyan': 'oklch(72% 0.18 40)',
      '--p31-accent-violet': 'oklch(70% 0.18 360)',
      '--p31-accent-gold': 'oklch(75% 0.18 60)',
      '--p31-accent-green': 'oklch(65% 0.18 140)',
      '--p31-accent-red': 'oklch(72% 0.18 25)',
      '--p31-accent-iris': 'oklch(70% 0.18 340)',
      '--p31-text-primary': 'oklch(95% 0.03 50)',
      '--p31-text-secondary': 'oklch(78% 0.03 40)',
      '--p31-text-tertiary': 'oklch(55% 0.03 35)',
      '--p31-glass-bg': 'oklch(100% 0.01 30 / 0.06)',
      '--p31-glass-border': 'oklch(100% 0.01 30 / 0.1)',
      '--p31-glass-shadow': '0 8px 32px rgba(200, 100, 0, 0.08)',
    },
  },

  mono: {
    id: 'mono',
    label: 'Mono',
    emoji: '⚪',
    description: 'Clean monochrome — black, white, gray',
    tokens: {
      ...BASE,
      '--p31-bg': 'oklch(8% 0 0)',
      '--p31-surface': 'oklch(14% 0 0)',
      '--p31-surface2': 'oklch(20% 0 0)',
      '--p31-accent': 'oklch(80% 0 0)',
      '--p31-accent-cyan': 'oklch(75% 0 0)',
      '--p31-accent-violet': 'oklch(70% 0 0)',
      '--p31-accent-gold': 'oklch(78% 0 0)',
      '--p31-accent-green': 'oklch(72% 0 0)',
      '--p31-accent-red': 'oklch(68% 0 0)',
      '--p31-accent-iris': 'oklch(74% 0 0)',
      '--p31-text-primary': 'oklch(95% 0 0)',
      '--p31-text-secondary': 'oklch(75% 0 0)',
      '--p31-text-tertiary': 'oklch(50% 0 0)',
      '--p31-glass-bg': 'oklch(100% 0 0 / 0.05)',
      '--p31-glass-border': 'oklch(100% 0 0 / 0.1)',
      '--p31-glass-shadow': '0 8px 32px rgba(0, 0, 0, 0.2)',
    },
  },

  aurora: {
    id: 'aurora',
    label: 'Aurora',
    emoji: '🌌',
    description: 'Nebula bloom — greens and violets in motion',
    tokens: {
      ...BASE,
      '--p31-bg': 'oklch(9% 0.03 260)',
      '--p31-surface': 'oklch(14% 0.035 260)',
      '--p31-surface2': 'oklch(20% 0.04 260)',
      '--p31-accent': 'oklch(72% 0.16 250)',
      '--p31-accent-cyan': 'oklch(65% 0.16 225)',
      '--p31-accent-violet': 'oklch(72% 0.16 250)',
      '--p31-accent-gold': 'oklch(75% 0.16 65)',
      '--p31-accent-green': 'oklch(70% 0.16 160)',
      '--p31-accent-red': 'oklch(70% 0.16 25)',
      '--p31-accent-iris': 'oklch(72% 0.16 290)',
      '--p31-text-primary': 'oklch(95% 0.03 260)',
      '--p31-text-secondary': 'oklch(78% 0.03 260)',
      '--p31-text-tertiary': 'oklch(55% 0.03 260)',
      '--p31-glass-bg': 'oklch(100% 0.02 260 / 0.05)',
      '--p31-glass-border': 'oklch(100% 0.02 260 / 0.1)',
      '--p31-glass-shadow': '0 8px 32px rgba(100, 50, 200, 0.12)',
    },
  },

  zen: {
    id: 'zen',
    label: 'Zen',
    emoji: '🧘',
    description: 'Still earth — warm neutrals, minimal contrast',
    tokens: {
      ...BASE,
      '--p31-bg': 'oklch(14% 0.01 75)',
      '--p31-surface': 'oklch(19% 0.012 75)',
      '--p31-surface2': 'oklch(25% 0.015 75)',
      '--p31-accent': 'oklch(72% 0.1 75)',
      '--p31-accent-cyan': 'oklch(68% 0.1 190)',
      '--p31-accent-violet': 'oklch(70% 0.1 300)',
      '--p31-accent-gold': 'oklch(75% 0.12 75)',
      '--p31-accent-green': 'oklch(68% 0.1 140)',
      '--p31-accent-red': 'oklch(68% 0.12 25)',
      '--p31-accent-iris': 'oklch(70% 0.1 250)',
      '--p31-text-primary': 'oklch(93% 0.01 75)',
      '--p31-text-secondary': 'oklch(75% 0.012 75)',
      '--p31-text-tertiary': 'oklch(55% 0.01 75)',
      '--p31-glass-bg': 'oklch(100% 0.01 75 / 0.05)',
      '--p31-glass-border': 'oklch(100% 0.01 75 / 0.1)',
      '--p31-glass-shadow': '0 8px 32px rgba(120, 100, 70, 0.1)',
    },
  },

  volt: {
    id: 'volt',
    label: 'Volt',
    emoji: '⚡',
    description: 'Electric — sharp cyan and violet, high contrast',
    tokens: {
      ...BASE,
      '--p31-bg': 'oklch(12% 0.02 270)',
      '--p31-surface': 'oklch(18% 0.025 270)',
      '--p31-surface2': 'oklch(25% 0.03 270)',
      '--p31-accent': 'oklch(75% 0.17 190)',
      '--p31-accent-cyan': 'oklch(75% 0.17 190)',
      '--p31-accent-violet': 'oklch(72% 0.17 300)',
      '--p31-accent-gold': 'oklch(78% 0.17 60)',
      '--p31-accent-green': 'oklch(72% 0.17 150)',
      '--p31-accent-red': 'oklch(72% 0.17 20)',
      '--p31-accent-iris': 'oklch(73% 0.17 260)',
      '--p31-text-primary': 'oklch(96% 0.01 270)',
      '--p31-text-secondary': 'oklch(80% 0.01 270)',
      '--p31-text-tertiary': 'oklch(58% 0.01 270)',
      '--p31-glass-bg': 'oklch(100% 0.01 270 / 0.05)',
      '--p31-glass-border': 'oklch(100% 0.01 270 / 0.12)',
      '--p31-glass-shadow': '0 8px 32px rgba(0, 160, 220, 0.12)',
    },
  },
};

/** Stable ordered list of all themes for pickers, docs, MCP surface. */
export const THEME_LIST: readonly P31Theme[] = THEME_IDS.map((id) => THEMES[id]);

// ============================================================================
// SEMANTIC TIER — role-named tokens that component contracts reference.
// ============================================================================
//
// Each entry maps a semantic path (e.g. 'color.action.primary') to the palette
// key that supplies its value. This map applies uniformly to every theme. A
// component contract never names a palette key directly — it names a semantic
// path, and this map resolves it.
//
// Token paths here appear in DTCG as `p31.<path>`. Adding a token here makes
// it resolvable by every contract; removing one breaks every contract that
// references it — validate-contracts hard-fails.
//
// This is source-authoring, not regeneration. THEMES and THEME_IDS are the
// palette; SEMANTIC_MAP is the role layer on top.

export interface SemanticSlot {
  /** Palette key in THEMES[id].tokens, e.g. 'accent'. Mutually exclusive with `literal`. */
  palette?: string;
  /** A literal value used identically across every theme. */
  literal?: string;
  /** DTCG $type. */
  type: 'color' | 'dimension' | 'duration' | 'cubicBezier' | 'number';
  /** Optional opacity multiplier applied to the palette value's OKLCH alpha channel. */
  opacity?: number;
  /** Optional target OKLCH chroma for a muted/desaturated variant of a palette color. */
  chroma?: number;
}

export const SEMANTIC_MAP: Record<string, SemanticSlot> = {
  // -------------------------------------------------------------------------
  // Action — the Button contract's primary dependency
  // -------------------------------------------------------------------------
  'color.action.primary':        { palette: 'accent',       type: 'color' },
  'color.action.primary-hover':  { palette: 'accent',       type: 'color', opacity: 0.8 },
  'color.action.primary-text':   { palette: 'text-primary', type: 'color' },
  'color.action.secondary':      { palette: 'surface2',     type: 'color' },
  'color.action.secondary-text': { palette: 'text-primary', type: 'color' },
  'color.action.ghost':          { literal: 'transparent',  type: 'color' },
  'color.action.ghost-hover':    { palette: 'glass-bg',     type: 'color' },

  // -------------------------------------------------------------------------
  // Spacing — a fixed scale, theme-agnostic
  // -------------------------------------------------------------------------
  'space.inline.sm': { literal: '8px',  type: 'dimension' },
  'space.inline.md': { literal: '16px', type: 'dimension' },
  'space.inline.lg': { literal: '24px', type: 'dimension' },

  // -------------------------------------------------------------------------
  // Radius — component-level slots
  // -------------------------------------------------------------------------
  'radius.md': { literal: '16px', type: 'dimension' },

  // -------------------------------------------------------------------------
  // Typography — component-level sizes
  // -------------------------------------------------------------------------
  'font.size.sm': { literal: '14px', type: 'dimension' },
  'font.size.md': { literal: '16px', type: 'dimension' },
  'font.size.lg': { literal: '20px', type: 'dimension' },

  // -------------------------------------------------------------------------
  // Motion — timing and easing
  // -------------------------------------------------------------------------
  'motion.duration.fast':   { literal: '150ms',                            type: 'duration' },
  'motion.easing.standard': { literal: 'cubic-bezier(0.4, 0, 0.2, 1)',     type: 'cubicBezier' },

  // -------------------------------------------------------------------------
  // Frame — the four nominal trace categories. Okabe-Ito colorblind-safe set,
  // converted to OKLCH (cool/warm temperature alternation). No polarity.
  // -------------------------------------------------------------------------
  'frame.structure':  { literal: 'oklch(73.5% 0.117 236.2)', type: 'color' },
  'frame.connection': { literal: 'oklch(75.3% 0.158 76.8)',  type: 'color' },
  'frame.rhythm':     { literal: 'oklch(67.9% 0.118 346.3)', type: 'color' },
  'frame.creation':   { literal: 'oklch(62% 0.13 165.5)',    type: 'color' },

  // -------------------------------------------------------------------------
  // Muted accents — chroma-reduced variants of the per-theme accent palette.
  // Same hue + lightness, reduced chroma, so a "muted" surface de-saturates
  // without shifting hue identity. Consumed by [data-saturation='muted'].
  // -------------------------------------------------------------------------
  'color.accent.muted':        { palette: 'accent',        type: 'color', chroma: 0.05 },
  'color.accent.violet.muted': { palette: 'accent-violet', type: 'color', chroma: 0.05 },
  'color.accent.gold.muted':   { palette: 'accent-gold',   type: 'color', chroma: 0.05 },
  'color.accent.green.muted':  { palette: 'accent-green',  type: 'color', chroma: 0.05 },
  'color.accent.red.muted':    { palette: 'accent-red',    type: 'color', chroma: 0.05 },

  // -------------------------------------------------------------------------
  // Layout — the spacing scale and the density factor. Canon owns the base
  // scale; the Loom's presentation axes scale it at runtime (density, motion).
  // -------------------------------------------------------------------------
  'layout.spacing.xs': { literal: '4px',  type: 'dimension' },
  'layout.spacing.sm': { literal: '8px',  type: 'dimension' },
  'layout.spacing.md': { literal: '16px', type: 'dimension' },
  'layout.spacing.lg': { literal: '24px', type: 'dimension' },
  'layout.spacing.xl': { literal: '32px', type: 'dimension' },
  'layout.density.factor': { literal: '1', type: 'number' },
};

// ============================================================================
// design-core compatibility layer — Phase 1 absorption
// ============================================================================
// Ported VERBATIM from @p31/design-core/src/css/tokens.css so canon can become
// the sole token writer. Nothing here is reconciled against canon's palette:
// the 27 names both systems define keep their divergent values until the
// deliberate redesign (Phase 4). GLOBAL_COMPAT tokens are theme-agnostic and
// are emitted once in :root. CONDITIONAL_CSS reproduces design-core's brand /
// spoon / dark / light / portal override blocks and is emitted UNLAYERED after
// the layered theme blocks so the cascade matches design-core exactly.

export const GLOBAL_COMPAT: Record<string, string> = {
  '--p31-accent-alt': 'oklch(65% 0.18 285)',
  '--p31-text': 'oklch(96% 0.005 240)',
  '--p31-glass-border-hover': 'oklch(100% 0.01 240 / 0.15)',
  '--p31-glass-blur': 'blur(12px)',
  '--p31-glass-bg-strong': 'oklch(100% 0.01 75 / 0.22)',
  '--p31-glass-bg-overlay': 'oklch(100% 0.01 75 / 0.10)',
  '--p31-glass-bg-light': 'oklch(100% 0.01 75 / 0.10)',
  '--p31-glass-border-strong': 'oklch(100% 0.01 75 / 0.16)',
  '--p31-glass-border-strong-hover': 'oklch(100% 0.01 75 / 0.25)',
  '--p31-glow-cyan': '0 0 20px rgba(0,240,255,0.25)',
  '--p31-glow-neon': '0 0 6px oklch(90.5% 0.155 194.8), 0 0 20px oklch(90.5% 0.155 194.8 / 0.3)',
  '--p31-glow-magenta': '0 0 6px oklch(70.2% 0.322 328.4), 0 0 20px oklch(70.2% 0.322 328.4 / 0.3)',
  '--p31-glow-violet': '0 0 6px oklch(67.0% 0.234 309.1), 0 0 20px oklch(67.0% 0.234 309.1 / 0.3)',
  '--p31-glow-amber': '0 0 6px oklch(88.7% 0.182 95.3), 0 0 20px oklch(88.7% 0.182 95.3 / 0.3)',
  '--p31-glow-mint': '0 0 6px oklch(87.6% 0.228 152.5), 0 0 20px oklch(87.6% 0.228 152.5 / 0.3)',
  '--p31-glow-coral': '0 0 6px oklch(71.2% 0.181 22.8), 0 0 20px oklch(71.2% 0.181 22.8 / 0.3)',
  '--p31-neon': 'oklch(90.5% 0.155 194.8)',
  '--p31-neon-dim': 'oklch(90.5% 0.155 194.8 / 0.35)',
  '--p31-neon-faint': 'oklch(90.5% 0.155 194.8 / 0.08)',
  '--p31-neon-ghost': 'oklch(90.5% 0.155 194.8 / 0.03)',
  '--p31-neon-cyan': 'oklch(90.5% 0.155 194.8)',
  '--p31-neon-magenta': 'oklch(70.2% 0.322 328.4)',
  '--p31-neon-violet': 'oklch(67.0% 0.234 309.1)',
  '--p31-neon-amber': 'oklch(88.7% 0.182 95.3)',
  '--p31-neon-mint': 'oklch(87.6% 0.228 152.5)',
  '--p31-neon-coral': 'oklch(71.2% 0.181 22.8)',
  '--p31-neon-orange': 'oklch(75.4% 0.164 50.4)',
  '--p31-neon-blue': 'oklch(80.4% 0.146 219.5)',
  '--p31-neon-lavender': 'oklch(62% 0.279 290.8)',
  '--p31-neon-pink': 'oklch(67.4% 0.293 340.4)',
  '--p31-surface-s1': 'oklch(0% 0 0)',
  '--p31-surface-s2': 'oklch(4.9% 0 0)',
  '--p31-surface-s3': 'oklch(6.9% 0 0)',
  '--p31-surface-s4': 'oklch(10.5% 0 0)',
  '--p31-status-online': 'oklch(65% 0.18 105)',
  '--p31-status-offline': 'oklch(78% 0.01 240)',
  '--p31-status-warning': 'oklch(65% 0.18 15)',
  '--p31-status-error': 'oklch(65% 0.18 20)',
  '--p31-status-info': 'oklch(65% 0.18 195)',
  '--p31-scale-3xl': 'calc(var(--p31-base) * 4.2139)',
  '--p31-scale-4xl': 'calc(var(--p31-base) * 5.6186)',
  '--p31-type-caption': 'clamp(var(--p31-scale-xs), 0.8vw, var(--p31-scale-sm))',
  '--p31-type-body': 'clamp(calc(var(--p31-base) * 0.95), 1vw + 0.5rem, var(--p31-scale-sm))',
  '--p31-type-label': 'var(--p31-scale-sm)',
  '--p31-type-h3': 'clamp(var(--p31-scale-md), 2vw, var(--p31-scale-lg))',
  '--p31-type-h2': 'clamp(var(--p31-scale-lg), 3.5vw, var(--p31-scale-xl))',
  '--p31-type-h1': 'clamp(var(--p31-scale-xl), 5.6vw, var(--p31-scale-2xl))',
  '--p31-type-display': 'clamp(var(--p31-scale-2xl), 7vw, var(--p31-scale-3xl))',
  '--p31-font-display': "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  '--p31-duration-fast': '100ms',
  '--p31-duration-normal': '300ms',
  '--p31-duration-slow': '500ms',
  '--p31-easing-smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
  '--p31-easing-snappy': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  '--p31-easing-linear': 'linear',
  '--p31-speed-factor': '1',
  '--p31-starfield-hearth': 'oklch(55% 0.15 35)',
  '--p31-starfield-teal': 'oklch(60% 0.08 185)',
  '--p31-starfield-remembrance': 'oklch(95% 0.01 80)',
  '--p31-starfield-particle-teal': 'oklch(70% 0.12 185 / 0.6)',
  '--p31-starfield-particle-coral': 'oklch(65% 0.14 40 / 0.5)',
  '--p31-blur-subtle': '8px',
  '--p31-blur-standard': '12px',
  '--p31-blur-strong': '24px',
  '--p31-space-xs': 'clamp(var(--p31-scale-xs), 1vw, var(--p31-scale-sm))',
  '--p31-space-sm': 'clamp(var(--p31-scale-sm), 1.5vw, var(--p31-scale-md))',
  '--p31-space-md': 'clamp(var(--p31-scale-md), 2.5vw, var(--p31-scale-lg))',
  '--p31-space-lg': 'clamp(var(--p31-scale-lg), 3.5vw, var(--p31-scale-xl))',
  '--p31-space-xl': 'clamp(var(--p31-scale-xl), 5vw, var(--p31-scale-2xl))',
  '--p31-space-2xl': 'clamp(var(--p31-scale-2xl), 6.5vw, var(--p31-scale-3xl))',
  '--p31-space-tiny': '2px',
  '--p31-radius-xl': 'calc(var(--p31-scale-xl) / 2)',
  '--p31-radius-candy': '24px',
  '--p31-touch-min': '48px',
  '--p31-touch-recommended': '56px',
  '--p31-touch-large': '64px',
  '--p31-z-starfield': '0',
  '--p31-z-topbar': '10',
  '--p31-z-toast': '9999',
  '--p31-z-crisis': '99999',
  '--p31-z-skip-link': '100',
  '--p31-topbar-height': '64px',
  '--p31-z-content': '1',
  '--p31-z-floating': '60',
  '--p31-space-3xl': '64px',
  '--p31-void': '#0A0A0F',
  '--p31-cloud': '#A1A1AA',
  '--p31-glass-surface': 'oklch(100% 0.01 240 / 0.04)',
  '--p31-glass-surface-hover': 'oklch(100% 0.01 240 / 0.06)',
  '--p31-glass-radius': '24px',
  '--p31-spacing-xs': '4px',
  '--p31-spacing-sm': '8px',
  '--p31-spacing-md': '16px',
  '--p31-spacing-lg': '24px',
  '--p31-spacing-xl': '32px',
  '--p31-spacing-xxl': '64px',
  '--p31-radius-none': '0',
  '--p31-h1': '51px',
  '--p31-h2': '38px',
  '--p31-h3': '28px',
  '--p31-h4': '21px',
  '--p31-body': '16px',
  '--p31-body-sm': '14px',
  '--p31-label': '12px',
  '--p31-caption': '7px',
  '--p31-duration-instant': '62.5ms',
  '--p31-duration-standard': '250ms',
  '--p31-duration-slower': '1000ms',
  '--p31-easing-standard': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  '--p31-easing-decelerate': 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  '--p31-easing-accelerate': 'cubic-bezier(0.4, 0.0, 1.0, 1)',
  '--p31-card-padding': '24px',
};

/**
 * Compat root values — design-core's exact `:root` values for the 18
 * divergent shared names. Emitted at `:root` ONLY, so the theme-less surface
 * matches design-core byte-for-byte while `[data-theme="ocean"]` etc. keep
 * canon's values. This is the appearance-preserving baseline for the flip;
 * removing it is the deliberate Phase 4 redesign.
 */
export const COMPAT_ROOT: Record<string, string> = {
  '--p31-bg': 'oklch(10% 0.01 240)',
  '--p31-surface': 'oklch(15% 0.015 240)',
  '--p31-surface2': 'oklch(22% 0.02 240)',
  '--p31-accent': 'oklch(65% 0.18 195)',
  '--p31-accent-violet': 'oklch(65% 0.18 285)',
  '--p31-accent-gold': 'oklch(65% 0.18 15)',
  '--p31-accent-green': 'oklch(65% 0.18 105)',
  '--p31-accent-red': 'oklch(65% 0.18 20)',
  '--p31-accent-iris': 'oklch(65% 0.18 270)',
  '--p31-text-secondary': 'oklch(80% 0.01 240)',
  '--p31-text-tertiary': 'oklch(78% 0.01 240)',
  '--p31-text-primary': 'oklch(96% 0.005 240)',
  '--p31-glass-bg': 'oklch(100% 0.01 240 / 0.04)',
  '--p31-glass-border': 'oklch(100% 0.01 240 / 0.08)',
  '--p31-glass-shadow': '0 8px 32px rgba(0,0,0,0.15)',
  '--p31-font-sans': "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  '--p31-font-mono': "ui-monospace, SFMono-Regular, 'Fira Code', 'Fira Mono', 'Roboto Mono', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace",
  '--p31-radius-md': 'calc(var(--p31-scale-md) / 2)',
  '--p31-radius-lg': 'calc(var(--p31-scale-lg) / 2)',
};

/** design-core conditional override blocks, reproduced verbatim. Emitted
 *  unlayered so their cascade position matches design-core's tokens.css.
 *  NOTE: design-core nests [data-brand] INSIDE :root, so it compiles to the
 *  descendant selector `:root [data-brand=…]` (it cannot match the attribute
 *  on <html>). Reproduced nested here so the flip is behavior-preserving;
 *  un-nesting is a deliberate later change, not a migration side effect. */
export const CONDITIONAL_CSS = `
:root {
  [data-brand="p31ca"] {
    --p31-glass-bg: oklch(14% 0.02 260 / 0.35);
    --p31-glass-border: oklch(100% 0.01 240 / 0.12);
    --p31-glass-border-hover: oklch(100% 0.01 240 / 0.25);
    --p31-glass-blur: blur(24px);
  }
  [data-brand="phosphorus31"] {
    --p31-glass-bg: oklch(99% 0.01 85 / 0.55);
    --p31-glass-border: oklch(80% 0.02 75 / 0.3);
    --p31-glass-border-hover: oklch(70% 0.03 70 / 0.4);
    --p31-glass-blur: blur(16px);
  }
  [data-brand="willow"] {
    --p31-glass-bg: rgba(255, 248, 240, 0.7);
    --p31-glass-border: rgba(200, 180, 160, 0.25);
    --p31-glass-blur: blur(16px);
    --p31-text: oklch(25% 0.02 80);
    --p31-text-secondary: oklch(55% 0.02 75);
    --p31-accent: oklch(65% 0.18 45);
    --p31-accent-alt: oklch(60% 0.15 200);
    --p31-accent-gold: oklch(72% 0.14 80);
    --p31-accent-green: oklch(70% 0.12 120);
    --p31-accent-red: oklch(62% 0.15 10);
    --p31-font-sans: "Comic Sans MS", "Chalkboard SE", cursive, sans-serif;
    --p31-font-display: "Comic Sans MS", "Chalkboard SE", cursive;
    --p31-radius-sm: 12px;
    --p31-radius-md: 20px;
    --p31-radius-lg: 28px;
    --p31-radius-xl: 40px;
    --p31-radius-full: 9999px;
    --p31-space-xs: 0.5rem;
    --p31-space-sm: 0.75rem;
    --p31-space-md: 1.25rem;
    --p31-space-lg: 2rem;
    --p31-space-xl: 2.5rem;
    --p31-space-2xl: 4rem;
    --p31-duration-fast: 200ms;
    --p31-duration-normal: 400ms;
    --p31-duration-slow: 600ms;
    --p31-easing-smooth: cubic-bezier(0.34, 1.56, 0.64, 1);
    --p31-easing-snappy: cubic-bezier(0.34, 1.56, 0.64, 1);
    --p31-touch-min: 56px;
    --p31-touch-recommended: 64px;
  }
}
[data-spoons="0"] { --p31-speed-factor: 0; --p31-glass-blur: none; }
[data-spoons="1"] { --p31-speed-factor: 0; --p31-glass-blur: none; }
[data-spoons="2"] { --p31-speed-factor: 0.25; --p31-glass-blur: blur(8px); }
[data-spoons="3"] { --p31-speed-factor: 0.5; --p31-glass-blur: blur(12px); }
[data-spoons="4"] { --p31-speed-factor: 0.75; --p31-glass-blur: blur(12px); }
[data-spoons="5"] { --p31-speed-factor: 1; --p31-glass-blur: blur(16px); }
@media (prefers-reduced-motion: reduce) {
  :root { --p31-speed-factor: 0; }
}
[data-dark-mode="true"] {
  --p31-glass-bg: rgba(30, 28, 26, 0.8);
  --p31-glass-border: rgba(80, 75, 70, 0.3);
  --p31-text: oklch(90% 0.01 80);
  --p31-text-secondary: oklch(65% 0.02 80);
}
[data-theme="light"] {
  --p31-bg: #F8FAFC;
  --p31-surface: #FFFFFF;
  --p31-surface2: #F1F5F9;
  --p31-text: #0F172A;
  --p31-text-secondary: rgba(15,23,42,0.6);
  --p31-text-tertiary: rgba(15,23,42,0.3);
  --p31-glass-bg: rgba(0,0,0,0.03);
  --p31-glass-border: rgba(0,0,0,0.08);
  --p31-glass-border-hover: rgba(0,0,0,0.15);
}
[data-portal="mesh"] { --p31-portal-accent: var(--p31-accent); --p31-portal-glow: rgba(0, 240, 255, 0.08); }
[data-portal="research"] { --p31-portal-accent: var(--p31-accent-violet); --p31-portal-glow: rgba(167, 139, 250, 0.08); }
[data-portal="quantum"] { --p31-portal-accent: var(--p31-accent-alt); --p31-portal-glow: rgba(139, 92, 246, 0.08); }
[data-portal="build"] { --p31-portal-accent: var(--p31-accent-green); --p31-portal-glow: rgba(52, 211, 153, 0.08); }
[data-portal="blog"] { --p31-portal-accent: var(--p31-accent); --p31-portal-glow: rgba(0, 240, 255, 0.06); }
[data-portal="passport"] { --p31-portal-accent: var(--p31-accent-iris); --p31-portal-glow: rgba(139, 92, 246, 0.08); }
[data-portal="care"] { --p31-portal-accent: var(--p31-accent-gold); --p31-portal-glow: rgba(251, 191, 36, 0.08); }
[data-portal] main,
[data-portal] .portal-content { position: relative; z-index: 1; }
`;
