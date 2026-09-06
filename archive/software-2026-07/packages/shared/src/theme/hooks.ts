// packages/shared/src/theme/hooks.ts

import { useCallback, useMemo } from 'react';
import { useThemeStore } from './store';
import type { ThemeConfig, ThemeMode, SkinPreset, ContrastLevel, DensityLevel } from './types';
import {
  THEME_PRESETS,
  type ThemePresetKey,
  OPERATOR_THEME,
  KIDS_THEME,
  GRAY_ROCK_THEME,
  AURORA_THEME,
  HIGH_CONTRAST_THEME,
  LOW_MOTION_THEME,
} from './presets';

/**
 * Hook to access the current theme configuration
 */
export const useTheme = (): ThemeConfig => {
  return useThemeStore((state) => state.config);
};

/**
 * Hook to get the current theme mode
 */
export const useThemeMode = (): ThemeMode => {
  return useThemeStore((state) => state.config.mode);
};

/**
 * Hook to get the current skin preset
 */
export const useSkin = (): SkinPreset => {
  return useThemeStore((state) => state.config.skin);
};

/**
 * Hook to get the current contrast level
 */
export const useContrast = (): ContrastLevel => {
  return useThemeStore((state) => state.config.contrast);
};

/**
 * Hook to get the current density level
 */
export const useDensity = (): DensityLevel => {
  return useThemeStore((state) => state.config.density);
};

/**
 * Hook to get theme actions
 */
export const useThemeActions = () => {
  const setSkin = useThemeStore((state) => state.setSkin);
  const setMode = useThemeStore((state) => state.setMode);
  const setContrast = useThemeStore((state) => state.setContrast);
  const setDensity = useThemeStore((state) => state.setDensity);
  const setSkinOverride = useThemeStore((state) => state.setSkinOverride);
  const importTheme = useThemeStore((state) => state.importTheme);
  const exportTheme = useThemeStore((state) => state.exportTheme);
  const reset = useThemeStore((state) => state.reset);

  return {
    setSkin,
    setMode,
    setContrast,
    setDensity,
    setSkinOverride,
    importTheme,
    exportTheme,
    reset,
  };
};

/**
 * Hook to check if motion should be reduced
 */
export const useReduceMotion = (): boolean => {
  const config = useTheme();
  return config.skinOverride?.reduceMotion ?? false;
};

/**
 * Hook to get CSS custom property values
 */
export const useThemeTokens = () => {
  const config = useTheme();
  
  return {
    // Colors
    color: config.tokens.color,
    
    // Typography
    fontSize: config.tokens.typography.fontSize,
    fontWeight: config.tokens.typography.fontWeight,
    
    // Spacing
    spacing: config.tokens.spacing,
    
    // Animation
    duration: config.tokens.animation.duration,
    easing: config.tokens.animation.easing,
    
    // Skin overrides
    skin: config.skinOverride || {},
  };
};

/**
 * Hook to get computed CSS custom property values
 */
export const useComputedThemeTokens = () => {
  const config = useTheme();
  
  return {
    // Computed color values
    colors: {
      background: config.skinOverride?.background || config.tokens.color.void,
      foreground: config.skinOverride?.foreground || config.tokens.color.textPrimary,
      primary: config.skinOverride?.primary || config.tokens.color.phosphor,
      secondary: config.skinOverride?.secondary || config.tokens.color.quantumCyan,
      accent: config.skinOverride?.accent || config.tokens.color.quantumViolet,
      muted: config.skinOverride?.muted || config.tokens.color.textMuted,
      border: config.tokens.color.border,
      textPrimary: config.tokens.color.textPrimary,
      textSecondary: config.tokens.color.textSecondary,
      textMuted: config.tokens.color.textMuted,
      success: config.tokens.color.success,
      warning: config.tokens.color.warning,
      error: config.tokens.color.error,
      info: config.tokens.color.info,
    },
    
    // Computed spacing values
    spacing: {
      xs: config.tokens.spacing.xs,
      sm: config.tokens.spacing.sm,
      md: config.tokens.spacing.md,
      lg: config.tokens.spacing.lg,
      xl: config.tokens.spacing.xl,
      '2xl': config.tokens.spacing['2xl'],
      '3xl': config.tokens.spacing['3xl'],
    },
    
    // Computed typography values
    typography: {
      fontFamily: {
        mono: config.tokens.typography.fontFamily.mono,
        sans: config.tokens.typography.fontFamily.sans,
        display: config.tokens.typography.fontFamily.display,
      },
      fontSize: config.tokens.typography.fontSize,
      fontWeight: config.tokens.typography.fontWeight,
      lineHeight: config.tokens.typography.lineHeight,
    },
    
    // Computed animation values
    animation: {
      duration: config.tokens.animation.duration,
      easing: config.tokens.animation.easing,
    },
    
    // Computed skin values
    skin: {
      glassOpacity: config.skinOverride?.glassOpacity ?? 0.15,
      borderRadius: config.skinOverride?.borderRadius ?? '8px',
      reduceMotion: config.skinOverride?.reduceMotion ?? false,
    },
  };
};

/**
 * Lazy load a theme preset on demand
 * Useful for reducing initial bundle size
 */
// Presets are statically imported — this map resolves synchronously.
const PRESET_MAP: Record<ThemePresetKey, ThemeConfig> = {
  OPERATOR: OPERATOR_THEME,
  KIDS: KIDS_THEME,
  GRAY_ROCK: GRAY_ROCK_THEME,
  AURORA: AURORA_THEME,
  HIGH_CONTRAST: HIGH_CONTRAST_THEME,
  LOW_MOTION: LOW_MOTION_THEME,
};

export const useLazyThemePreset = (presetKey: ThemePresetKey) => {
  const preset = PRESET_MAP[presetKey] ?? null;

  const loadPreset = useCallback(async () => {
    if (!preset) throw new Error(`Unknown preset: ${presetKey}`);
    return preset;
  }, [presetKey, preset]);

  return useMemo(() => ({
    preset,
    isLoading: false,
    error: preset ? null : new Error(`Unknown preset: ${presetKey}`),
    loadPreset,
  }), [preset, presetKey, loadPreset]);
};

/**
 * Preload multiple theme presets in background
 * Does not block rendering
 */
// Presets are statically imported — preloading is a no-op.
export const usePreloadThemePresets = (presetKeys: ThemePresetKey[]) => {
  const loadedPresets = useMemo(
    () => new Set(presetKeys.filter(k => k in PRESET_MAP)),
    [presetKeys],
  );
  return { loadedPresets, isLoading: false };
};
