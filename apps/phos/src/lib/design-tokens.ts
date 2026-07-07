// ═════════════════════════════════════════════════════════════════════════════
// Design tokens — extracted from DESIGN.md (repo root)
// Source of truth: apps/p31ca/src/styles/global.css
// This file is the machine-readable bridge between the design system and PHOS.
// ═════════════════════════════════════════════════════════════════════════════

export const designTokens = {
  colors: {
    void: '#0A0A0F',
    surface: '#12121A',
    surface2: '#1C1C2A',
    cloud: '#A1A1AA',
    'text-primary': '#F5F5F7',
    'text-secondary': 'rgba(245,245,247,0.6)',
    'text-tertiary': 'rgba(245,245,247,0.3)',
    'quantum-cyan': '#00F0FF',
    'quantum-violet': '#A78BFA',
    'quantum-gold': '#FBBF24',
    'quantum-green': '#34D399',
    'quantum-red': '#FB7185',
    'quantum-iris': '#818CF8',
    'glass-surface': 'rgba(255,255,255,0.04)',
    'glass-border': 'rgba(255,255,255,0.08)',
    'glass-border-hover': 'rgba(255,255,255,0.15)',
    'glass-surface-hover': 'rgba(255,255,255,0.06)',
  },
  typography: {
    sans: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  rounded: {
    sm: '8px',
    md: '12px',
    lg: '24px',
  },
  spacing: {
    sm: '8px',
    md: '16px',
    lg: '24px',
  },
} as const;
