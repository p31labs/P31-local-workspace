// ═══════════════════════════════════════════════════════════════
// WCD-29.1: Zustand Theme Store
// P31 Labs — Spaceship Earth
//
// Theme configuration with presets, import/export, and persistence.
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SkinTheme } from '../sovereign/types';

export interface ThemeConfig {
  name: string;
  skin: SkinTheme;
  background: string;
  primary: string;
  secondary: string;
  accent: string;
  glassOpacity: number;
  reduceMotion: boolean;
}

export const THEME_CONFIG_PRESETS: Record<SkinTheme, ThemeConfig> = {
  OPERATOR: {
    name: 'Operator',
    skin: 'OPERATOR',
    background: '#020617',
    primary: '#22d3ee',    // cyan
    secondary: '#d946ef',  // magenta
    accent: '#C9B1FF',    // soft lavender
    glassOpacity: 0.15,
    reduceMotion: false,
  },
  KIDS: {
    name: 'Kids',
    skin: 'KIDS',
    background: '#1e1b4b',
    primary: '#E9C46A',   // butter yellow
    secondary: '#E76F51', // soft coral
    accent: '#2A9D8F',    // warm teal
    glassOpacity: 0.25,
    reduceMotion: false,
  },
  GRAY_ROCK: {
    name: 'Gray Rock',
    skin: 'GRAY_ROCK',
    background: '#1a1a2e',
    primary: '#64748B',
    secondary: '#475569',
    accent: '#94a3b8',
    glassOpacity: 0.05,
    reduceMotion: true, // ZERO animations in Gray Rock
  },
};

interface ThemeState {
  config: ThemeConfig;
  setSkin: (skin: SkinTheme) => void;
  setAccentColor: (color: string) => void;
  setConfig: (partial: Partial<ThemeConfig>) => void;
  importTheme: (json: string) => boolean;
  exportTheme: () => string;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      config: THEME_CONFIG_PRESETS.OPERATOR,

      setSkin: (skin) => {
        const preset = THEME_CONFIG_PRESETS[skin];
        if (!preset) return;
        set({ config: preset });
        // Apply data-theme attribute for CSS cascade
        document.documentElement.setAttribute('data-theme', skin.toLowerCase());
      },

      setAccentColor: (color) => {
        if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return; // Validate hex
        set((s) => ({ config: { ...s.config, accent: color } }));
      },

      setConfig: (partial) => {
        set((s) => ({ config: { ...s.config, ...partial } }));
      },

      importTheme: (json) => {
        try {
          const parsed = JSON.parse(json);
          // Validate required fields
          const required = ['name', 'skin', 'background', 'primary', 'secondary', 'accent'];
          for (const key of required) {
            if (!(key in parsed)) return false;
          }
          // Validate hex colors
          const hexFields = ['background', 'primary', 'secondary', 'accent'];
          for (const key of hexFields) {
            if (!/^#[0-9A-Fa-f]{6}$/.test(parsed[key])) return false;
          }
          // Validate skin
          if (!(parsed.skin in THEME_CONFIG_PRESETS)) return false;
          set({ config: { ...THEME_CONFIG_PRESETS[parsed.skin as SkinTheme], ...parsed } });
          return true;
        } catch {
          return false;
        }
      },

      exportTheme: () => JSON.stringify(get().config, null, 2),
    }),
    { name: 'p31-theme' }
  )
);
