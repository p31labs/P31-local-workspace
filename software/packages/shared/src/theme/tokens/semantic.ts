// packages/shared/src/theme/tokens/semantic.ts

export const SEMANTIC_COLORS = {
  // UI Layers
  void: '#050510',
  voidLight: '#0B0F19',
  surface: '#0A0A1A',
  surfaceElevated: '#111122',
  border: '#2A2A40',
  borderSubtle: '#1F1F33',
  
  // Text Colors
  textPrimary: '#E8EECF4',
  textSecondary: '#B8C1D6',
  textMuted: '#8A94A8',
  textInverse: '#FFFFFF',
  
  // Semantic Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Semantic variants
  successPrimary: '#10B981',
  successSecondary: '#34D399',
  warningPrimary: '#F59E0B',
  warningSecondary: '#FBBF24',
  errorPrimary: '#EF4444',
  errorSecondary: '#F87171',
  infoPrimary: '#3B82F6',
  infoSecondary: '#60A5FA',
} as const;

export type SemanticColorKey = keyof typeof SEMANTIC_COLORS;