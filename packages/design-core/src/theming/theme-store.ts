// theme-store.ts — P31 Chameleon: 5 themes × 3 age tiers + sensory modes.
// Single source of truth for the P31 design system.
// Drives CSS cascade via data-theme + data-age on <html>.
// Sensory modes (muted / warmLight) are pure OKLCH math: chroma scaled with
// lightness held constant (contrast invariant by construction), hue blended
// toward amber (dusk) when warmLight is active.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { parse, formatCss, oklch as toOklch } from 'culori';

export type ThemeId = 'garden' | 'ocean' | 'aurora' | 'zen' | 'volt';
export type AgeTier = 'child' | 'teen' | 'adult';
export type BrandId = 'p31ca' | 'phos' | 'phosphorus31' | 'willow' | 'bonding';

interface BrandToken {
  $extends?: ThemeId;
  [key: string]: string | undefined;
}

interface ThemeState {
  theme: ThemeId;
  age: AgeTier;
  brand: BrandId | null;
  muted: boolean;
  warmLight: boolean;
  setTheme: (theme: ThemeId) => void;
  setAge: (age: AgeTier) => void;
  setBrand: (brand: BrandId | null) => void;
  setMuted: (muted: boolean) => void;
  setWarmLight: (warmLight: boolean) => void;
  applyTheme: () => void;
}

/** Star colors feed the jitterbug molecular background. */
declare global {
  interface Window {
    __P31_STAR_COLORS__?: { warm: string; cool: string };
  }
}

export const THEME_TOKENS: Record<ThemeId, Record<string, string>> = {
  garden: {
    '--p31-accent': 'oklch(76% 0.14 45)',
    '--p31-accent-alt': 'oklch(0.69 0.09 150)',
    '--p31-accent-green': 'oklch(0.68 0.12 152)',
    '--p31-accent-red': 'oklch(0.71 0.13 22)',
    '--p31-accent-gold': 'oklch(0.7 0.135 88)',
    '--p31-accent-violet': 'oklch(0.71 0.1 28)',
    '--p31-bg': 'oklch(14% 0.014 75)',
    '--p31-void': 'oklch(4% 0.008 75)',
    '--p31-surface': 'oklch(15% 0.017 74)',
    '--p31-surface2': 'oklch(15% 0.02 72)',
    '--p31-text': 'oklch(93% 0.012 80)',
    '--p31-text-secondary': 'oklch(83% 0.018 75)',
    '--p31-text-tertiary': 'oklch(76% 0.015 75)',
    '--p31-glass-bg': 'oklch(12% 0.015 74 / 0.90)',
    '--p31-glass-bg-subtle': 'oklch(12% 0.015 74 / 0.70)',
    '--p31-glass-bg-strong': 'oklch(12% 0.015 74 / 0.95)',
    '--p31-glass-border': 'oklch(100% 0.01 75 / 0.16)',
    '--p31-glass-border-subtle': 'oklch(100% 0.01 75 / 0.10)',
    '--p31-glass-border-strong': 'oklch(100% 0.01 75 / 0.25)',
    '--p31-notif-gold': 'oklch(0.7 0.135 88)',
    '--p31-notif-green': 'oklch(0.68 0.12 152)',
    '--p31-notif-violet': 'oklch(0.71 0.1 28)',
    '--p31-notif-cyan': 'oklch(0.69 0.09 150)',
    '--p31-notif-rose': 'oklch(0.71 0.13 22)',
    '--p31-star-warm': 'oklch(0.747 0.101 66)',
    '--p31-star-cool': 'oklch(0.589 0.033 70)',
    '--p31-accent-gradient': 'linear-gradient(135deg, oklch(76% 0.14 45) 0%, oklch(0.70 0.135 88) 55%, oklch(0.68 0.12 152) 100%)',
    '--p31-hero-gradient': 'linear-gradient(160deg, oklch(76% 0.14 45 / 0.9) 0%, oklch(0.70 0.135 88 / 0.85) 50%, oklch(0.68 0.12 152 / 0.9) 100%)',
  },
  ocean: {
    '--p31-accent': 'oklch(73% 0.18 195)',
    '--p31-accent-alt': 'oklch(0.71 0.18 285)',
    '--p31-accent-green': 'oklch(0.69 0.18 105)',
    '--p31-accent-red': 'oklch(0.71 0.18 20)',
    '--p31-accent-gold': 'oklch(0.71 0.18 15)',
    '--p31-accent-violet': 'oklch(0.7 0.14 275)',
    '--p31-bg': 'oklch(10% 0.01 240)',
    '--p31-void': 'oklch(4% 0.005 240)',
    '--p31-surface': 'oklch(12% 0.015 240)',
    '--p31-surface2': 'oklch(13% 0.02 240)',
    '--p31-text': 'oklch(96% 0.005 240)',
    '--p31-text-secondary': 'oklch(83% 0.01 240)',
    '--p31-text-tertiary': 'oklch(76% 0.01 240)',
    '--p31-glass-bg': 'oklch(10% 0.012 240 / 0.90)',
    '--p31-glass-bg-subtle': 'oklch(10% 0.012 240 / 0.70)',
    '--p31-glass-bg-strong': 'oklch(10% 0.012 240 / 0.95)',
    '--p31-glass-border': 'oklch(100% 0.01 240 / 0.16)',
    '--p31-glass-border-subtle': 'oklch(100% 0.01 240 / 0.10)',
    '--p31-glass-border-strong': 'oklch(100% 0.01 240 / 0.25)',
    '--p31-notif-gold': 'oklch(0.71 0.18 15)',
    '--p31-notif-green': 'oklch(0.69 0.18 105)',
    '--p31-notif-violet': 'oklch(0.7 0.14 275)',
    '--p31-notif-cyan': 'oklch(0.71 0.18 195)',
    '--p31-notif-rose': 'oklch(0.71 0.18 20)',
    '--p31-star-warm': 'oklch(0.797 0.134 212)',
    '--p31-star-cool': 'oklch(0.606 0.219 293)',
    '--p31-accent-gradient': 'linear-gradient(135deg, oklch(73% 0.18 195) 0%, oklch(0.70 0.14 275) 55%, oklch(0.71 0.18 285) 100%)',
    '--p31-hero-gradient': 'linear-gradient(160deg, oklch(73% 0.18 195 / 0.9) 0%, oklch(0.70 0.14 275 / 0.85) 50%, oklch(0.71 0.18 285 / 0.9) 100%)',
  },
  aurora: {
    '--p31-accent': 'oklch(71% 0.22 160)',
    '--p31-accent-alt': 'oklch(0.72 0.22 330)',
    '--p31-accent-green': 'oklch(0.68 0.2 130)',
    '--p31-accent-red': 'oklch(0.72 0.22 350)',
    '--p31-accent-gold': 'oklch(0.7 0.18 90)',
    '--p31-accent-violet': 'oklch(0.74 0.22 280)',
    '--p31-bg': 'oklch(12% 0.025 250)',
    '--p31-void': 'oklch(5% 0.012 250)',
    '--p31-surface': 'oklch(14% 0.025 200)',
    '--p31-surface2': 'oklch(15% 0.025 180)',
    '--p31-text': 'oklch(95% 0.01 100)',
    '--p31-text-secondary': 'oklch(82% 0.02 130)',
    '--p31-text-tertiary': 'oklch(76% 0.02 180)',
    '--p31-glass-bg': 'oklch(11% 0.02 200 / 0.90)',
    '--p31-glass-bg-subtle': 'oklch(11% 0.02 200 / 0.70)',
    '--p31-glass-bg-strong': 'oklch(11% 0.02 200 / 0.95)',
    '--p31-glass-border': 'oklch(100% 0.01 180 / 0.16)',
    '--p31-glass-border-subtle': 'oklch(100% 0.01 180 / 0.10)',
    '--p31-glass-border-strong': 'oklch(100% 0.01 180 / 0.25)',
    '--p31-notif-gold': 'oklch(0.7 0.18 90)',
    '--p31-notif-green': 'oklch(0.68 0.2 130)',
    '--p31-notif-violet': 'oklch(0.74 0.22 280)',
    '--p31-notif-cyan': 'oklch(0.72 0.22 330)',
    '--p31-notif-rose': 'oklch(0.72 0.22 350)',
    '--p31-star-warm': 'oklch(0.709 0.159 294)',
    '--p31-star-cool': 'oklch(0.754 0.139 233)',
    '--p31-accent-gradient': 'linear-gradient(135deg, oklch(71% 0.22 160) 0%, oklch(0.68 0.2 130) 55%, oklch(0.74 0.22 280) 100%)',
    '--p31-hero-gradient': 'linear-gradient(160deg, oklch(71% 0.22 160 / 0.9) 0%, oklch(0.68 0.2 130 / 0.85) 50%, oklch(0.74 0.22 280 / 0.9) 100%)',
  },
  zen: {
    '--p31-accent': 'oklch(74% 0.01 100)',
    '--p31-accent-alt': 'oklch(0.69 0.01 100)',
    '--p31-accent-green': 'oklch(0.69 0.01 150)',
    '--p31-accent-red': 'oklch(0.69 0.005 30)',
    '--p31-accent-gold': 'oklch(0.69 0.01 90)',
    '--p31-accent-violet': 'oklch(0.69 0.005 280)',
    '--p31-bg': 'oklch(10% 0.005 100)',
    '--p31-void': 'oklch(3% 0.003 100)',
    '--p31-surface': 'oklch(13% 0.005 100)',
    '--p31-surface2': 'oklch(15% 0.005 100)',
    '--p31-text': 'oklch(92% 0.005 100)',
    '--p31-text-secondary': 'oklch(82% 0.005 100)',
    '--p31-text-tertiary': 'oklch(76% 0.005 100)',
    '--p31-glass-bg': 'oklch(11% 0.004 100 / 0.90)',
    '--p31-glass-bg-subtle': 'oklch(11% 0.004 100 / 0.70)',
    '--p31-glass-bg-strong': 'oklch(11% 0.004 100 / 0.95)',
    '--p31-glass-border': 'oklch(100% 0.002 100 / 0.16)',
    '--p31-glass-border-subtle': 'oklch(100% 0.002 100 / 0.10)',
    '--p31-glass-border-strong': 'oklch(100% 0.002 100 / 0.25)',
    '--p31-notif-gold': 'oklch(0.69 0.01 90)',
    '--p31-notif-green': 'oklch(0.69 0.01 150)',
    '--p31-notif-violet': 'oklch(0.69 0.005 280)',
    '--p31-notif-cyan': 'oklch(0.69 0.01 100)',
    '--p31-notif-rose': 'oklch(0.69 0.005 30)',
    '--p31-star-warm': 'oklch(0.554 0.041 257)',
    '--p31-star-cool': 'oklch(0.446 0.037 257)',
    '--p31-accent-gradient': 'linear-gradient(135deg, oklch(74% 0.01 100) 0%, oklch(0.69 0.01 90) 55%, oklch(0.69 0.005 280) 100%)',
    '--p31-hero-gradient': 'linear-gradient(160deg, oklch(74% 0.01 100 / 0.9) 0%, oklch(0.69 0.01 90 / 0.85) 50%, oklch(0.69 0.005 280 / 0.9) 100%)',
  },
  volt: {
    '--p31-accent': 'oklch(85% 0.22 105)',
    '--p31-accent-alt': 'oklch(0.69 0.18 80)',
    '--p31-accent-green': 'oklch(0.67 0.2 130)',
    '--p31-accent-red': 'oklch(0.7 0.18 30)',
    '--p31-accent-gold': 'oklch(0.68 0.2 90)',
    '--p31-accent-violet': 'oklch(0.7 0.18 280)',
    '--p31-bg': 'oklch(5% 0.01 240)',
    '--p31-void': 'oklch(2% 0.005 240)',
    '--p31-surface': 'oklch(9% 0.015 240)',
    '--p31-surface2': 'oklch(13% 0.02 240)',
    '--p31-text': 'oklch(98% 0.015 105)',
    '--p31-text-secondary': 'oklch(84% 0.01 100)',
    '--p31-text-tertiary': 'oklch(76% 0.01 100)',
    '--p31-glass-bg': 'oklch(8% 0.012 240 / 0.90)',
    '--p31-glass-bg-subtle': 'oklch(8% 0.012 240 / 0.70)',
    '--p31-glass-bg-strong': 'oklch(8% 0.012 240 / 0.95)',
    '--p31-glass-border': 'oklch(100% 0.01 100 / 0.16)',
    '--p31-glass-border-subtle': 'oklch(100% 0.01 100 / 0.10)',
    '--p31-glass-border-strong': 'oklch(100% 0.01 100 / 0.25)',
    '--p31-notif-gold': 'oklch(0.68 0.2 90)',
    '--p31-notif-green': 'oklch(0.67 0.2 130)',
    '--p31-notif-violet': 'oklch(0.7 0.18 280)',
    '--p31-notif-cyan': 'oklch(0.69 0.18 80)',
    '--p31-notif-rose': 'oklch(0.7 0.18 30)',
    '--p31-star-warm': 'oklch(0.837 0.164 84)',
    '--p31-star-cool': 'oklch(0.769 0.165 70)',
    '--p31-accent-gradient': 'linear-gradient(135deg, oklch(85% 0.22 105) 0%, oklch(0.68 0.2 90) 55%, oklch(0.7 0.18 280) 100%)',
    '--p31-hero-gradient': 'linear-gradient(160deg, oklch(85% 0.22 105 / 0.9) 0%, oklch(0.68 0.2 90 / 0.85) 50%, oklch(0.7 0.18 280 / 0.9) 100%)',
  },
};

export const BRAND_TOKENS: Record<BrandId, BrandToken> = {
  p31ca: {
    $extends: 'ocean',
    '--p31-accent': 'oklch(70% 0.16 195)',
    '--p31-accent-alt': 'oklch(0.72 0.16 285)',
  },
  phos: {
    $extends: 'aurora',
    '--p31-accent': 'oklch(72% 0.24 160)',
    '--p31-accent-alt': 'oklch(0.74 0.24 330)',
  },
  phosphorus31: {
    $extends: 'garden',
    '--p31-accent': 'oklch(74% 0.15 45)',
    '--p31-accent-alt': 'oklch(0.70 0.10 150)',
  },
  willow: {
    $extends: 'zen',
    '--p31-accent': 'oklch(72% 0.01 100)',
    '--p31-accent-alt': 'oklch(0.70 0.01 100)',
  },
  bonding: {
    $extends: 'volt',
    '--p31-accent': 'oklch(82% 0.20 105)',
    '--p31-accent-alt': 'oklch(0.70 0.16 80)',
  },
};

export function resolveBrandTokens(brand: BrandId): Record<string, string> {
  const def = BRAND_TOKENS[brand];
  if (!def) throw new Error(`Unknown brand: ${brand}`);
  const base = def.$extends ? { ...THEME_TOKENS[def.$extends] } : {};
  for (const [key, value] of Object.entries(def)) {
    if (key === '$extends') continue;
    if (value !== undefined) base[key] = value;
  }
  return base;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
  theme: 'ocean',
  age: 'adult',
  brand: null,
  muted: false,
  warmLight: false,

  setTheme: (theme) => { set({ theme }); get().applyTheme(); },
  setAge: (age) => { set({ age }); get().applyTheme(); },
  setBrand: (brand) => { set({ brand }); get().applyTheme(); },
  setMuted: (muted) => { set({ muted }); get().applyTheme(); },
  setWarmLight: (warmLight) => { set({ warmLight }); get().applyTheme(); },

  applyTheme: () => {
    const { theme, age, brand, muted, warmLight } = get();
    const tokens = brand ? resolveBrandTokens(brand) : THEME_TOKENS[theme];
    const root = document.documentElement;

    Object.entries(tokens).forEach(([key, value]) => {
      root.style.setProperty(key, transformToken(value, { muted, warmLight }));
    });

    root.setAttribute('data-theme', theme);
    root.setAttribute('data-age', age);
    root.setAttribute('data-brand', brand ?? '');
    window.__P31_STAR_COLORS__ = {
      warm: tokens['--p31-star-warm'] ?? 'oklch(0.747 0.101 66)',
      cool: tokens['--p31-star-cool'] ?? 'oklch(0.589 0.033 70)',
    };

    // Age-specific font scaling
    root.style.fontSize = age === 'child' ? '17px' : '15px';
  },
    }),
    { name: 'p31-portal-theme' }
  )
);

// ─── Sensory OKLCH transform ───
const MUTED_CHROMA = 0.45;
const WARM_HUE = 60; // amber
const WARM_BLEND = 0.5;

function blendHue(h: number, target: number, t: number): number {
  const d = ((target - h + 540) % 360) - 180;
  return (h + d * t + 360) % 360;
}

function transformToken(value: string, sensory: { muted: boolean; warmLight: boolean }): string {
  if (!sensory.muted && !sensory.warmLight) return value;
  const parsed = parse(value);
  if (!parsed) return value;

  let color: { mode: 'oklch'; l: number; c: number; h?: number; alpha?: number } =
    parsed.mode === 'oklch' ? (parsed as never) : (toOklch(parsed as never) as never);

  if (sensory.muted) color = { ...color, c: Math.max(0, color.c * MUTED_CHROMA) };
  if (sensory.warmLight && color.h !== undefined) {
    color = { ...color, h: blendHue(color.h, WARM_HUE, WARM_BLEND) };
  }
  return formatCss(color);
}
