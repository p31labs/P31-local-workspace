/**
 * Lazy Theme Loading System for P31 Labs
 * 
 * Implements lazy loading for theme presets to optimize bundle size
 * and improve application performance.
 */

import type { ThemeConfig, ThemePreset } from './types';
import React from 'react';

export interface LazyThemeLoaderOptions {
  /** Timeout for loading themes (ms) */
  timeout?: number;
  /** Fallback theme if loading fails */
  fallbackTheme?: ThemeConfig;
  /** Enable caching of loaded themes */
  enableCache?: boolean;
}

/**
 * Lazy theme loader with caching and error handling
 */
export class LazyThemeLoader {
  private options: Required<LazyThemeLoaderOptions>;
  private cache: Map<string, ThemePreset> = new Map();
  private loadingPromises: Map<string, Promise<ThemePreset>> = new Map();

  constructor(options: LazyThemeLoaderOptions = {}) {
    this.options = {
      timeout: 5000,
      fallbackTheme: {
        id: 'fallback',
        name: 'Fallback Theme',
        mode: 'system',
        skin: 'OPERATOR',
        contrast: 'normal',
        density: 'comfortable',
        tokens: {
          color: {
            phosphor: '#00FF88',
            phosphorMuted: '#00CC6A',
            quantumCyan: '#00D4FF',
            quantumViolet: '#7A27FF',
            phosphorOrange: '#FF6600',
            calciumAmber: '#F59E0B',
            dangerRed: '#EF4444',
            body: '#ff9944',
            mesh: '#44aaff',
            forge: '#44ffaa',
            shield: '#ff4466',
            void: '#050510',
            voidLight: '#0B0F19',
            surface: '#1a1a2e',
            surfaceElevated: '#252540',
            border: '#3a3a5a',
            borderSubtle: '#2a2a40',
            textPrimary: '#E8ECF4',
            textSecondary: '#A0A8B8',
            textMuted: '#707088',
            textInverse: '#050510',
            success: '#22C55E',
            warning: '#F59E0B',
            error: '#EF4444',
            info: '#3B82F6'
          },
          typography: {
            fontFamily: {
              mono: 'JetBrains Mono, Fira Code, monospace',
              sans: 'Inter, -apple-system, system-ui, sans-serif',
              display: 'Space Grotesk, sans-serif'
            },
            fontSize: {
              xs: '0.75rem',
              sm: '0.875rem',
              base: '1rem',
              lg: '1.125rem',
              xl: '1.25rem',
              '2xl': '1.5rem',
              '3xl': '1.875rem',
              '4xl': '2.25rem'
            },
            lineHeight: {
              tight: 1.25,
              normal: 1.5,
              relaxed: 1.75
            },
            fontWeight: {
              normal: 400,
              medium: 500,
              semibold: 600,
              bold: 700
            }
          },
          spacing: {
            scale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128],
            xs: '0.25rem',
            sm: '0.5rem',
            md: '1rem',
            lg: '1.5rem',
            xl: '2rem',
            '2xl': '3rem',
            '3xl': '4rem'
          },
          animation: {
            duration: {
              instant: '0ms',
              fast: '150ms',
              normal: '300ms',
              slow: '500ms',
              slowest: '1000ms'
            },
            easing: {
              default: 'cubic-bezier(0.4, 0, 0.2, 1)',
              enter: 'cubic-bezier(0, 0, 0.2, 1)',
              exit: 'cubic-bezier(0.4, 0, 1, 1)',
              bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            }
          }
        }
      },
      enableCache: true,
      ...options
    };
  }

  /**
   * Load a theme preset by name with lazy loading
   */
  async loadTheme(name: string): Promise<ThemePreset> {
    // Check cache first
    if (this.options.enableCache && this.cache.has(name)) {
      return this.cache.get(name)!;
    }

    // Check if already loading
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name)!;
    }

    // Create loading promise
    const loadingPromise = this.loadThemeInternal(name);
    this.loadingPromises.set(name, loadingPromise);

    try {
      const theme = await loadingPromise;
      
      // Cache the result
      if (this.options.enableCache) {
        this.cache.set(name, theme);
      }
      
      return theme;
    } finally {
      // Clean up loading promise
      this.loadingPromises.delete(name);
    }
  }

  /**
   * Internal theme loading logic
   */
  private async loadThemeInternal(name: string): Promise<ThemePreset> {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Theme loading timeout for: ${name}`)), this.options.timeout);
      });

      // Try to load the theme
      const themePromise = this.importTheme(name);
      
      // Race between theme loading and timeout
      const theme = await Promise.race([themePromise, timeoutPromise]);
      
      return theme;
    } catch (error) {
      console.warn(`Failed to load theme "${name}":`, error);
      return this.options.fallbackTheme;
    }
  }

  /**
   * Import theme module dynamically
   */
  private async importTheme(name: string): Promise<ThemePreset> {
    // Map theme names to their module paths
    const themePaths: Record<string, string> = {
      'operator': './presets/operator',
      'aurora': './presets/aurora',
      'highContrast': './presets/highContrast',
      'lowMotion': './presets/lowMotion',
      'kids': './presets/kids',
      'grayRock': './presets/grayRock'
    };

    const path = themePaths[name];
    if (!path) {
      throw new Error(`Unknown theme: ${name}`);
    }

    // Dynamic import with proper error handling
    const module = await import(/* webpackChunkName: "theme-[request]" */ `./presets/${name}`);
    
    if (!module.default) {
      throw new Error(`Theme module for "${name}" does not export default`);
    }

    return module.default;
  }

  /**
   * Preload multiple themes in the background
   */
  async preloadThemes(names: string[]): Promise<void> {
    const preloadPromises = names.map(name => this.loadTheme(name));
    await Promise.allSettled(preloadPromises);
  }

  /**
   * Clear theme cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cached theme names
   */
  getCachedThemes(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Check if theme is cached
   */
  isCached(name: string): boolean {
    return this.cache.has(name);
  }
}

/**
 * P31 Labs default lazy theme loader
 */
export const p31ThemeLoader = new LazyThemeLoader({
  timeout: 3000,
  enableCache: true
});

/**
 * Hook for using lazy theme loading in React components
 */
export function useLazyTheme(name: string): ThemePreset | null {
  const [theme, setTheme] = React.useState<ThemePreset | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    async function loadTheme() {
      setLoading(true);
      try {
        const loadedTheme = await p31ThemeLoader.loadTheme(name);
        if (mounted) {
          setTheme(loadedTheme);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadTheme();

    return () => {
      mounted = false;
    };
  }, [name]);

  return loading ? null : theme;
}

/**
 * Higher-order component for theme-aware components
 */
export function withLazyTheme<P extends object>(
  Component: React.ComponentType<P & { theme: ThemePreset | null; loading: boolean }>
) {
  return function ThemedComponent(props: P & { themeName: string }) {
    const { themeName, ...restProps } = props;
    const theme = useLazyTheme(themeName);
    
    return React.createElement(Component, {
      ...restProps as P,
      theme,
      loading: theme === null
    });
  };
}

export default LazyThemeLoader;