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
  '--p31-font-sans': "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  '--p31-font-mono': "ui-monospace, 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
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
  type: 'color' | 'dimension' | 'duration' | 'cubicBezier';
  /** Optional opacity multiplier applied to the palette value's OKLCH alpha channel. */
  opacity?: number;
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
};
