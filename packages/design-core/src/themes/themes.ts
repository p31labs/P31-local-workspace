/**
 * P31 Theme System — multi-identity token variants
 * Each theme redefines the same --p31-* CSS variables.
 * Swap themes instantly by changing a data attribute.
 */

export interface P31Theme {
  id: string;
  label: string;
  emoji: string;
  description: string;
  tokens: Record<string, string>;
}

const BASE = {
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

export const THEMES: Record<string, P31Theme> = {
  cipher: {
    id: 'cipher',
    label: 'Cipher',
    emoji: '🔮',
    description: 'Quantum cyber — cyan and violet on void',
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
      '--p31-glass-bg': 'oklch(100% 0.01 240 / 0.04)',
      '--p31-glass-border': 'oklch(100% 0.01 240 / 0.08)',
      '--p31-glass-shadow': '0 8px 32px oklch(NaN NaN NaN)',
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
      '--p31-accent-iris': 'oklch(70% 0.15 225)',
      '--p31-text-primary': 'oklch(95% 0.02 120)',
      '--p31-text-secondary': 'oklch(78% 0.02 130)',
      '--p31-text-tertiary': 'oklch(55% 0.02 130)',
      '--p31-glass-bg': 'oklch(100% 0.01 120 / 0.06)',
      '--p31-glass-border': 'oklch(100% 0.01 120 / 0.1)',
      '--p31-glass-shadow': '0 8px 32px oklch(NaN NaN NaN)',
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
      '--p31-accent-violet': 'oklch(70% 0.18 330)',
      '--p31-accent-gold': 'oklch(78% 0.18 70)',
      '--p31-accent-green': 'oklch(65% 0.18 140)',
      '--p31-accent-red': 'oklch(70% 0.18 30)',
      '--p31-accent-iris': 'oklch(70% 0.18 280)',
      '--p31-text-primary': 'oklch(92% 0.05 80)',
      '--p31-text-secondary': 'oklch(75% 0.04 70)',
      '--p31-text-tertiary': 'oklch(50% 0.03 70)',
      '--p31-glass-bg': 'oklch(100% 0.01 60 / 0.05)',
      '--p31-glass-border': 'oklch(100% 0.01 60 / 0.12)',
      '--p31-glass-shadow': '0 8px 32px oklch(NaN NaN NaN)',
      '--p31-font-mono': "'VT323', 'Fira Code', ui-monospace, monospace",
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
      '--p31-glass-shadow': '0 8px 32px oklch(NaN NaN NaN)',
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
      '--p31-glass-shadow': '0 8px 32px oklch(NaN NaN NaN)',
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
      '--p31-glass-shadow': '0 8px 32px oklch(NaN NaN NaN)',
    },
  },
};

export function applyTheme(themeId: string): void {
  const map: Record<string, string> = { hub:'cipher', org:'willow', midnight:'cipher', genesis:'ocean', paper:'mono', matrix:'retro', dark:'cipher', light:'mono' };
  const skinId = map[themeId] || themeId || 'cipher';
  const root = document.documentElement;
  root.setAttribute('data-theme', skinId);
  root.setAttribute('data-theme-label', skinId);
  const tokens: Record<string, string> = {
    cipher: { '--p31-bg':'oklch(0.147 0.011 285)','--p31-surface':'oklch(0.186 0.016 285)','--p31-accent':'oklch(0.870 0.148 203)','--p31-accent-violet':'oklch(0.709 0.159 294)','--p31-accent-gold':'oklch(0.837 0.164 84)','--p31-text-primary':'oklch(0.971 0.003 286)' },
    willow: { '--p31-bg':'oklch(0.151 0.012 164)','--p31-surface':'oklch(0.196 0.020 160)','--p31-accent':'oklch(0.773 0.153 163)','--p31-text-primary':'oklch(0.960 0.005 258)','--p31-glass-bg':'oklch(NaN NaN NaN)','--p31-glass-border':'oklch(NaN NaN NaN)' },
    ocean:  { '--p31-bg':'oklch(0.213 0.039 250)','--p31-surface':'oklch(0.237 0.039 248)','--p31-accent':'oklch(0.797 0.147 221)','--p31-accent-violet':'oklch(0.714 0.143 255)' },
    mono:   { '--p31-bg':'oklch(0.145 0.000 90)','--p31-surface':'oklch(0.218 0.000 90)','--p31-accent':'oklch(0.738 0.000 90)','--p31-accent-violet':'oklch(0.627 0.000 90)' },
    retro:  { '--p31-bg':'oklch(0.145 0.000 90)','--p31-accent':'oklch(0.865 0.177 90)','--p31-accent-violet':'oklch(0.734 0.215 343)' },
  }[skinId] || { '--p31-bg':'oklch(0.147 0.011 285)','--p31-surface':'oklch(0.186 0.016 285)','--p31-accent':'oklch(0.870 0.148 203)','--p31-accent-violet':'oklch(0.709 0.159 294)','--p31-text-primary':'oklch(0.971 0.003 286)' };
  for (const [key, val] of Object.entries(tokens)) {
    root.style.setProperty(key, val as string);
  }
  localStorage.setItem('p31-theme', skinId);
}

export function loadSavedTheme(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('p31-theme');
}

export function getRandomTheme(): string {
  const ids = Object.keys(THEMES);
  return ids[Math.floor(Math.random() * ids.length)];
}
