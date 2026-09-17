import { create } from 'zustand';
import type { ThemeId } from './types';

const THEME_ORDER: ThemeId[] = ['garden', 'ocean', 'aurora', 'zen', 'volt'];

interface ThemeState {
  theme: ThemeId;
  syncFromDom: () => void;
  applyTheme: () => void;
  cycleTheme: () => ThemeId;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'ocean',
  syncFromDom: () => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('p31:theme') : null;
    if (stored && THEME_ORDER.includes(stored as ThemeId)) {
      set({ theme: stored as ThemeId });
    }
  },
  applyTheme: () => {
    const theme = get().theme;
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  },
  cycleTheme: () => {
    const current = get().theme;
    const idx = THEME_ORDER.indexOf(current);
    const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length];
    set({ theme: next });
    if (typeof window !== 'undefined') {
      localStorage.setItem('p31:theme', next);
    }
    return next;
  },
}));
