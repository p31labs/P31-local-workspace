// packages/shared/src/theme/types.ts

export type ThemeMode = 'dark' | 'light' | 'system';
export type SkinPreset = 'OPERATOR' | 'KIDS' | 'GRAY_ROCK' | 'AURORA' | 'HIGH_CONTRAST' | 'LOW_MOTION';
export type ContrastLevel = 'normal' | 'high';
export type DensityLevel = 'compact' | 'comfortable' | 'spacious';

export interface ColorTokens {
  // Brand colors (P31 core identity)
  phosphor: string;
  phosphorMuted: string;
  quantumCyan: string;
  quantumViolet: string;
  phosphorOrange: string;
  calciumAmber: string;
  dangerRed: string;
  
  // Axis colors (from cognitive passport)
  body: string;      // Health/cognition
  mesh: string;      // Relationships
  forge: string;     // Products/code
  shield: string;    // Legal/protection
  
  // UI layers
  void: string;
  voidLight: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderSubtle: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  
  // Semantic colors
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface TypographyTokens {
  fontFamily: {
    mono: string;
    sans: string;
    display: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
}

export interface SpacingTokens {
  scale: number[];  // [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128]
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

export interface AnimationTokens {
  duration: {
    instant: string;
    fast: string;
    normal: string;
    slow: string;
    slowest: string;
  };
  easing: {
    default: string;
    enter: string;
    exit: string;
    bounce: string;
  };
}

export interface SkinTokens {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  glassOpacity: number;
  borderRadius: string;
  reduceMotion: boolean;
}

export interface ThemeTokens {
  color: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  animation: AnimationTokens;
}

export interface ThemeConfig {
  id: string;
  name: string;
  mode: ThemeMode;
  skin: SkinPreset;
  contrast: ContrastLevel;
  density: DensityLevel;
  tokens: ThemeTokens;
  skinOverride?: Partial<SkinTokens>;
}

/**
 * Alias for ThemeConfig - represents a complete theme preset
 */
export type ThemePreset = ThemeConfig;

export interface ThemeState {
  config: ThemeConfig;
  setSkin: (skin: SkinPreset) => void;
  setMode: (mode: ThemeMode) => void;
  setContrast: (level: ContrastLevel) => void;
  setDensity: (level: DensityLevel) => void;
  setSkinOverride: (override: Partial<SkinTokens>) => void;
  importTheme: (json: string) => boolean;
  exportTheme: () => string;
  reset: () => void;
}