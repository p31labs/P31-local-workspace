// packages/shared/src/theme/utils.ts

import type { ThemeConfig, ThemeMode, SkinPreset, ContrastLevel, DensityLevel } from './types';
import { useThemeStore } from './store';

/**
 * Utility to get the current theme configuration
 */
export const getCurrentTheme = (): ThemeConfig => {
  return useThemeStore.getState().config;
};

/**
 * Utility to set the theme skin
 */
export const setThemeSkin = (skin: SkinPreset): void => {
  useThemeStore.getState().setSkin(skin);
};

/**
 * Utility to set the theme mode
 */
export const setThemeMode = (mode: ThemeMode): void => {
  useThemeStore.getState().setMode(mode);
};

/**
 * Utility to set the theme contrast
 */
export const setThemeContrast = (contrast: ContrastLevel): void => {
  useThemeStore.getState().setContrast(contrast);
};

/**
 * Utility to set the theme density
 */
export const setThemeDensity = (density: DensityLevel): void => {
  useThemeStore.getState().setDensity(density);
};

/**
 * Utility to set theme skin overrides
 */
export const setThemeSkinOverride = (override: Partial<any>): void => {
  useThemeStore.getState().setSkinOverride(override);
};

/**
 * Utility to import a theme from JSON
 */
export const importTheme = (json: string): boolean => {
  return useThemeStore.getState().importTheme(json);
};

/**
 * Utility to export the current theme to JSON
 */
export const exportTheme = (): string => {
  return useThemeStore.getState().exportTheme();
};

/**
 * Utility to reset the theme to default
 */
export const resetTheme = (): void => {
  useThemeStore.getState().reset();
};

/**
 * Utility to check if motion should be reduced
 */
export const shouldReduceMotion = (): boolean => {
  const config = getCurrentTheme();
  return config.skinOverride?.reduceMotion ?? false;
};

/**
 * Utility to get a CSS custom property value
 */
export const getCSSVariable = (name: string, fallback?: string): string => {
  const root = document.documentElement;
  const value = getComputedStyle(root).getPropertyValue(`--${name}`);
  return value.trim() || fallback || '';
};

/**
 * Utility to get a theme color value
 */
export const getThemeColor = (colorKey: string, fallback?: string): string => {
  return getCSSVariable(`color-${colorKey}`, fallback);
};

/**
 * Utility to get a theme spacing value
 */
export const getThemeSpacing = (spacingKey: string, fallback?: string): string => {
  return getCSSVariable(`spacing-${spacingKey}`, fallback);
};

/**
 * Utility to get a theme font size value
 */
export const getThemeFontSize = (sizeKey: string, fallback?: string): string => {
  return getCSSVariable(`font-size-${sizeKey}`, fallback);
};

/**
 * Utility to get a theme animation duration value
 */
export const getThemeDuration = (durationKey: string, fallback?: string): string => {
  return getCSSVariable(`duration-${durationKey}`, fallback);
};

/**
 * Utility to get a theme animation easing value
 */
export const getThemeEasing = (easingKey: string, fallback?: string): string => {
  return getCSSVariable(`easing-${easingKey}`, fallback);
};

/**
 * Utility to get a theme skin value
 */
export const getThemeSkin = (skinKey: string, fallback?: string): string => {
  return getCSSVariable(`skin-${skinKey}`, fallback);
};

/**
 * Utility to generate CSS-in-JS styles with theme tokens
 */
export const createThemedStyles = <T extends Record<string, any>>(
  styles: (tokens: any) => T
): T => {
  const config = getCurrentTheme();
  
  const tokens = {
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
    spacing: config.tokens.spacing,
    typography: config.tokens.typography,
    animation: config.tokens.animation,
    skin: {
      glassOpacity: config.skinOverride?.glassOpacity ?? 0.15,
      borderRadius: config.skinOverride?.borderRadius ?? '8px',
      reduceMotion: config.skinOverride?.reduceMotion ?? false,
    },
  };
  
  return styles(tokens);
};

/**
 * Utility to create a CSS class name with theme tokens
 */
export const createThemedClassName = (className: string, styles: Record<string, any>): string => {
  // This is a simplified version - in a real implementation, you might want to
  // integrate with a CSS-in-JS library or generate actual CSS classes
  return className;
};

/**
 * Utility to validate a theme configuration
 */
export const validateThemeConfig = (config: ThemeConfig): boolean => {
  try {
    // Basic validation
    if (!config.id || !config.name) {
      console.error('Theme config must have id and name');
      return false;
    }
    
    if (!config.tokens || !config.tokens.color) {
      console.error('Theme config must have color tokens');
      return false;
    }
    
    // Validate required color tokens
    const requiredColors: (keyof import('./types').ColorTokens)[] = [
      'phosphor', 'quantumCyan', 'quantumViolet', 'void', 'surface', 
      'textPrimary', 'textSecondary', 'border'
    ];
    
    for (const color of requiredColors) {
      if (!config.tokens.color[color]) {
        console.error(`Theme config missing required color token: ${color}`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error validating theme config:', error);
    return false;
  }
};

/**
 * Utility to merge theme configurations
 */
export const mergeThemeConfigs = (
  baseConfig: ThemeConfig, 
  overrideConfig: Partial<ThemeConfig>
): ThemeConfig => {
  return {
    ...baseConfig,
    ...overrideConfig,
    tokens: {
      ...baseConfig.tokens,
      ...overrideConfig.tokens,
      color: {
        ...baseConfig.tokens.color,
        ...overrideConfig.tokens?.color,
      },
      typography: {
        ...baseConfig.tokens.typography,
        ...overrideConfig.tokens?.typography,
      },
      spacing: {
        ...baseConfig.tokens.spacing,
        ...overrideConfig.tokens?.spacing,
      },
      animation: {
        ...baseConfig.tokens.animation,
        ...overrideConfig.tokens?.animation,
      },
    },
    skinOverride: {
      ...baseConfig.skinOverride,
      ...overrideConfig.skinOverride,
    },
  };
};