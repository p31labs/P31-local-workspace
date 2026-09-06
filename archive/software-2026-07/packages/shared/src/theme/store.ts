// packages/shared/src/theme/store.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ThemeConfig, ThemeState } from './types';
import { OPERATOR_THEME } from './presets';

interface ThemeStore extends ThemeState {
  // Internal state
  _config: ThemeConfig;
  
  // Actions
  _updateConfig: (updater: (config: ThemeConfig) => ThemeConfig) => void;
  _applyTheme: (config: ThemeConfig) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // Initial state
      config: OPERATOR_THEME,
      _config: OPERATOR_THEME,
      
      // Actions
      setSkin: (skin) => {
        get()._updateConfig((config) => ({ ...config, skin }));
      },
      
      setMode: (mode) => {
        get()._updateConfig((config) => ({ ...config, mode }));
      },
      
      setContrast: (contrast) => {
        get()._updateConfig((config) => ({ ...config, contrast }));
      },
      
      setDensity: (density) => {
        get()._updateConfig((config) => ({ ...config, density }));
      },
      
      setSkinOverride: (override) => {
        get()._updateConfig((config) => ({
          ...config,
          skinOverride: { ...config.skinOverride, ...override }
        }));
      },
      
      importTheme: (json) => {
        try {
          const importedConfig = JSON.parse(json);
          get()._updateConfig(() => importedConfig);
          return true;
        } catch (error) {
          console.error('Failed to import theme:', error);
          return false;
        }
      },
      
      exportTheme: () => {
        return JSON.stringify(get().config, null, 2);
      },
      
      reset: () => {
        get()._updateConfig(() => OPERATOR_THEME);
      },
      
      // Internal actions
      _updateConfig: (updater) => {
        const currentConfig = get()._config;
        const newConfig = updater(currentConfig);
        set({ config: newConfig, _config: newConfig });
        get()._applyTheme(newConfig);
      },
      
      _applyTheme: (config) => {
        // Apply CSS variables
        const root = document.documentElement;
        
        // Apply color tokens
        Object.entries(config.tokens.color).forEach(([key, value]) => {
          root.style.setProperty(`--color-${key}`, value);
        });
        
        // Apply typography tokens
        Object.entries(config.tokens.typography.fontSize).forEach(([key, value]) => {
          root.style.setProperty(`--font-size-${key}`, value);
        });
        
        Object.entries(config.tokens.typography.fontWeight).forEach(([key, value]) => {
          root.style.setProperty(`--font-weight-${key}`, value.toString());
        });
        
        // Apply spacing tokens
        Object.entries(config.tokens.spacing).forEach(([key, value]) => {
          if (typeof value === 'string') {
            root.style.setProperty(`--spacing-${key}`, value);
          }
        });
        
        // Apply animation tokens
        Object.entries(config.tokens.animation.duration).forEach(([key, value]) => {
          root.style.setProperty(`--duration-${key}`, value);
        });
        
        Object.entries(config.tokens.animation.easing).forEach(([key, value]) => {
          root.style.setProperty(`--easing-${key}`, value);
        });
        
        // Apply skin overrides
        if (config.skinOverride) {
          const {
            background,
            foreground,
            primary,
            secondary,
            accent,
            muted,
            glassOpacity,
            borderRadius,
            reduceMotion,
          } = config.skinOverride;
          
          if (background) root.style.setProperty('--skin-background', background);
          if (foreground) root.style.setProperty('--skin-foreground', foreground);
          if (primary) root.style.setProperty('--skin-primary', primary);
          if (secondary) root.style.setProperty('--skin-secondary', secondary);
          if (accent) root.style.setProperty('--skin-accent', accent);
          if (muted) root.style.setProperty('--skin-muted', muted);
          if (glassOpacity !== undefined) root.style.setProperty('--skin-glass-opacity', glassOpacity.toString());
          if (borderRadius) root.style.setProperty('--skin-border-radius', borderRadius);
          root.style.setProperty('--skin-reduce-motion', reduceMotion ? '1' : '0');
        }
        
        // Apply system mode
        if (config.mode === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.body.classList.toggle('dark', prefersDark);
          document.body.classList.toggle('light', !prefersDark);
        } else {
          document.body.classList.toggle('dark', config.mode === 'dark');
          document.body.classList.toggle('light', config.mode === 'light');
        }
        
        // Apply density
        document.body.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
        document.body.classList.add(`density-${config.density}`);
        
        // Apply contrast
        document.body.classList.remove('contrast-normal', 'contrast-high');
        document.body.classList.add(`contrast-${config.contrast}`);
      },
    }),
    {
      name: 'p31-theme',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        config: {
          skin: state.config.skin,
          mode: state.config.mode,
          contrast: state.config.contrast,
          density: state.config.density,
          skinOverride: state.config.skinOverride,
        },
      }),
      onRehydrateStorage: () => (state) => {
        // Apply theme after rehydration
        if (state) {
          state._applyTheme(state.config);
        }
      },
    }
  )
);

// Initialize theme on mount
if (typeof window !== 'undefined') {
  // Apply initial theme
  useThemeStore.getState()._applyTheme(useThemeStore.getState().config);
  
  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    const state = useThemeStore.getState();
    if (state.config.mode === 'system') {
      document.body.classList.toggle('dark', e.matches);
      document.body.classList.toggle('light', !e.matches);
    }
  });
}