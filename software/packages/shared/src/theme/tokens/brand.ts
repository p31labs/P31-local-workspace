// packages/shared/src/theme/tokens/brand.ts

export const BRAND_COLORS = {
  // P31 Core Brand Colors
  phosphor: '#00FF88',
  phosphorMuted: '#00E68A',
  quantumCyan: '#00D4FF',
  quantumViolet: '#7A27FF',
  phosphorOrange: '#FF6600',
  calciumAmber: '#F59E0B',
  dangerRed: '#EF4444',
  
  // Supporting brand colors
  phosphorGreen: '#00FF88',
  quantumBlue: '#00D4FF',
  quantumPurple: '#7A27FF',
  phosphorRed: '#FF6600',
  calciumGold: '#F59E0B',
  dangerCoral: '#EF4444',
} as const;

export type BrandColorKey = keyof typeof BRAND_COLORS;