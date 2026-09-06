/**
 * @file registry — Skin registry mapping skinId → token overrides.
 * Merged with 8-theme system. All 12 skins available.
 */

export interface SkinDefinition {
  id: string;
  name: string;
  label: string;
  emoji: string;
  description: string;
  tokenOverrides: Record<string, string>;
}

const THEME_TOKENS: Record<string, Record<string, string>> = {
  cipher: {
    '--p31-bg': 'oklch(10% .01 240)', '--p31-surface': 'oklch(15% .015 240)',
    '--p31-accent': 'oklch(65% .18 195)', '--p31-accent-cyan': 'oklch(65% .18 195)',
    '--p31-accent-violet': 'oklch(65% .18 285)', '--p31-accent-gold': 'oklch(65% .18 15)',
    '--p31-accent-green': 'oklch(65% .18 105)', '--p31-accent-red': 'oklch(65% .18 30)',
    '--p31-text-primary': 'oklch(96% .005 240)', '--p31-text-secondary': 'oklch(75% .01 240)',
    '--p31-text-tertiary': 'oklch(55% .01 240)', '--p31-glass-bg': 'oklch(100% .01 240 / .04)',
    '--p31-glass-border': 'oklch(100% .01 240 / .08)',
  },
  garden: {
    '--p31-bg': 'oklch(12% .02 140)', '--p31-surface': 'oklch(18% .025 140)',
    '--p31-accent': 'oklch(70% .15 145)', '--p31-accent-cyan': 'oklch(70% .15 145)',
    '--p31-accent-violet': 'oklch(70% .15 185)', '--p31-accent-gold': 'oklch(75% .15 85)',
    '--p31-accent-green': 'oklch(70% .15 145)', '--p31-accent-red': 'oklch(65% .15 30)',
    '--p31-text-primary': 'oklch(95% .02 120)', '--p31-text-secondary': 'oklch(78% .02 130)',
    '--p31-text-tertiary': 'oklch(55% .02 130)', '--p31-glass-bg': 'oklch(100% .01 120 / .06)',
    '--p31-glass-border': 'oklch(100% .01 120 / .1)',
  },
  retro: {
    '--p31-bg': 'oklch(8% .02 60)', '--p31-surface': 'oklch(12% .025 60)',
    '--p31-accent': 'oklch(75% .18 80)', '--p31-accent-cyan': 'oklch(75% .18 80)',
    '--p31-accent-violet': 'oklch(70% .18 330)', '--p31-accent-gold': 'oklch(78% .18 70)',
    '--p31-accent-green': 'oklch(65% .18 140)', '--p31-accent-red': 'oklch(70% .18 30)',
    '--p31-text-primary': 'oklch(92% .05 80)', '--p31-text-secondary': 'oklch(75% .04 70)',
    '--p31-text-tertiary': 'oklch(50% .03 70)', '--p31-glass-bg': 'oklch(100% .01 60 / .05)',
    '--p31-glass-border': 'oklch(100% .01 60 / .12)',
  },
  ocean: {
    '--p31-bg': 'oklch(10% .03 240)', '--p31-surface': 'oklch(15% .04 240)',
    '--p31-accent': 'oklch(70% .15 200)', '--p31-accent-cyan': 'oklch(70% .15 200)',
    '--p31-accent-violet': 'oklch(65% .15 250)', '--p31-accent-gold': 'oklch(72% .15 40)',
    '--p31-accent-green': 'oklch(70% .15 160)', '--p31-accent-red': 'oklch(70% .15 20)',
    '--p31-text-primary': 'oklch(95% .02 230)', '--p31-text-secondary': 'oklch(78% .02 235)',
    '--p31-text-tertiary': 'oklch(55% .02 235)', '--p31-glass-bg': 'oklch(100% .01 230 / .04)',
    '--p31-glass-border': 'oklch(100% .01 230 / .08)',
  },
  sunset: {
    '--p31-bg': 'oklch(12% .03 30)', '--p31-surface': 'oklch(17% .035 30)',
    '--p31-accent': 'oklch(72% .18 40)', '--p31-accent-cyan': 'oklch(72% .18 40)',
    '--p31-accent-violet': 'oklch(70% .18 360)', '--p31-accent-gold': 'oklch(75% .18 60)',
    '--p31-accent-green': 'oklch(65% .18 140)', '--p31-accent-red': 'oklch(72% .18 25)',
    '--p31-text-primary': 'oklch(95% .03 50)', '--p31-text-secondary': 'oklch(78% .03 40)',
    '--p31-text-tertiary': 'oklch(55% .03 35)', '--p31-glass-bg': 'oklch(100% .01 30 / .06)',
    '--p31-glass-border': 'oklch(100% .01 30 / .1)',
  },
  mono: {
    '--p31-bg': 'oklch(8% 0 0)', '--p31-surface': 'oklch(14% 0 0)',
    '--p31-accent': 'oklch(80% 0 0)', '--p31-accent-cyan': 'oklch(75% 0 0)',
    '--p31-accent-violet': 'oklch(70% 0 0)', '--p31-accent-gold': 'oklch(78% 0 0)',
    '--p31-accent-green': 'oklch(72% 0 0)', '--p31-accent-red': 'oklch(68% 0 0)',
    '--p31-text-primary': 'oklch(95% 0 0)', '--p31-text-secondary': 'oklch(75% 0 0)',
    '--p31-text-tertiary': 'oklch(50% 0 0)', '--p31-glass-bg': 'oklch(100% 0 0 / .05)',
    '--p31-glass-border': 'oklch(100% 0 0 / .1)',
  },
  frost: {
    '--p31-bg': 'oklch(12% .02 250)', '--p31-surface': 'oklch(17% .025 250)',
    '--p31-accent': 'oklch(85% .08 220)', '--p31-accent-cyan': 'oklch(85% .08 220)',
    '--p31-accent-violet': 'oklch(80% .08 270)', '--p31-accent-gold': 'oklch(82% .08 60)',
    '--p31-accent-green': 'oklch(80% .08 150)', '--p31-accent-red': 'oklch(80% .08 10)',
    '--p31-text-primary': 'oklch(98% .02 240)', '--p31-text-secondary': 'oklch(85% .02 245)',
    '--p31-text-tertiary': 'oklch(65% .02 245)', '--p31-glass-bg': 'oklch(100% .01 240 / .06)',
    '--p31-glass-border': 'oklch(100% .01 240 / .08)',
  },
  ember: {
    '--p31-bg': 'oklch(10% .03 20)', '--p31-surface': 'oklch(15% .035 20)',
    '--p31-accent': 'oklch(72% .2 30)', '--p31-accent-cyan': 'oklch(72% .2 30)',
    '--p31-accent-violet': 'oklch(68% .2 350)', '--p31-accent-gold': 'oklch(78% .2 60)',
    '--p31-accent-green': 'oklch(65% .2 140)', '--p31-accent-red': 'oklch(72% .2 25)',
    '--p31-text-primary': 'oklch(95% .03 40)', '--p31-text-secondary': 'oklch(78% .03 35)',
    '--p31-text-tertiary': 'oklch(55% .03 30)', '--p31-glass-bg': 'oklch(100% .01 20 / .06)',
    '--p31-glass-border': 'oklch(100% .01 20 / .1)',
  },
};

function buildSkin(id: string, name: string, emoji: string, description: string): SkinDefinition {
  return {
    id, name, label: name, emoji, description,
    tokenOverrides: THEME_TOKENS[id] ?? {},
  };
}

const SKINS: Record<string, SkinDefinition> = {
  willow: {
    id: 'willow', name: 'WILLOW', label: 'Willow', emoji: '🌿',
    description: 'Green accent, compact glass, emerald glow. Mobile-first companion app.',
    tokenOverrides: {
      '--p31-bg': '#070d0a', '--p31-surface': '#0d1812',
      '--p31-accent': '#34d399', '--p31-text-primary': '#f0f2f5',
      '--p31-glass-bg': 'rgba(7,13,10,0.9)', '--p31-glass-border': 'rgba(52,211,153,0.12)',
    },
  },
  phos: {
    id: 'phos', name: 'PHOS', label: 'Phos', emoji: '💜',
    description: 'Violet accent, workspace-optimized glass.',
    tokenOverrides: { '--p31-accent': '#a78bfa' },
  },
  tetra: {
    id: 'tetra', name: 'TETRA', label: 'Tetra', emoji: '🔷',
    description: 'Cyan/gold gradient, god-view dashboard chrome.',
    tokenOverrides: { '--p31-accent': '#00f0ff', '--p31-glass-bg': 'rgba(10,13,20,0.92)' },
  },
  apex: {
    id: 'apex', name: 'APEX', label: 'Apex', emoji: '⭐',
    description: 'Gold accent, strong glass, technical hub.',
    tokenOverrides: { '--p31-accent': '#fbbf24', '--p31-glass-bg': 'rgba(10,13,20,0.92)' },
  },
  cipher: buildSkin('cipher', 'Cipher', '🔮', 'Quantum cyber — cyan and violet on void'),
  garden: buildSkin('garden', 'Garden', '🌿', 'Warm soil greens — growth and calm'),
  retro: buildSkin('retro', 'Retro', '🕹️', 'CRT amber — warm glow, terminal vibes'),
  ocean: buildSkin('ocean', 'Ocean', '🌊', 'Deep blue depths — teal and coral'),
  sunset: buildSkin('sunset', 'Sunset', '🌅', 'Warm dusk — orange and rose gold'),
  mono: buildSkin('mono', 'Mono', '⚪', 'Clean monochrome — black, white, gray'),
  frost: buildSkin('frost', 'Frost', '❄️', 'Ice blue — cool and crisp'),
  ember: buildSkin('ember', 'Ember', '🔥', 'Warm red — intensity and energy'),
};

export function listSkins(): SkinDefinition[] {
  return Object.values(SKINS);
}

export function getSkin(id: string): SkinDefinition | undefined {
  return SKINS[id];
}

export default SKINS;
