# P31 System-Wide Theme Engine Architecture

## Executive Summary

This document outlines a comprehensive plan for implementing a centralized theme engine across the P31 Labs monorepo. The theme engine will provide consistent visual design tokens, runtime theming, and cross-application compatibility for bonding, spaceship-earth, and all shared packages.

---

## 1. Current State Analysis

### 1.1 Existing Theme Infrastructure

**Spaceship Earth** (`software/spaceship-earth/src/stores/themeStore.ts`):
- Zustand store with persist middleware
- 6 preset themes: OPERATOR, KIDS, GRAY_ROCK, AURORA, HIGH_CONTRAST, LOW_MOTION
- Import/export JSON functionality
- `data-theme` attribute on document root for CSS cascade
- Partial config with background, primary, secondary, accent, glassOpacity, reduceMotion

**BONDING** (`software/bonding/src/index.css`):
- Tailwind CSS v4 with `@theme` block
- Custom design tokens: void, phosphor, amber, cyan, rose, violet, love, green, seed, sprout, sapling
- Toast animations and touch optimization
- No runtime theme switching

**Frontend** (`software/frontend/src/styles.css`):
- Vanilla CSS with `:root` variables
- Simple palette: void, bg, phosphorus, teal, coral, gold, purple, text, panel-bg, panel-border

### 1.2 P31 Brand Palette (from Cognitive Passport)

| Token | Hex | Usage |
|-------|-----|-------|
| Phosphor Green | #00FF88 / #00E68A | Primary accent, deployed state |
| Quantum Cyan | #00D4FF | Secondary accent, links |
| Quantum Violet | #7A27FF | Tertiary, emphasis |
| Phosphor Orange | #FF6600 | P31 element color, alerts |
| Calcium Amber | #F59E0B | Calcium/gold accent |
| Danger Red | #EF4444 | Alerts, warnings, crisis states |
| Void | #050510 / #0B0F19 | Backgrounds |
| Text Primary | #E8EECF4 | Main text |
| Body axis | #FF9944 | Health, medication, cognition |
| Mesh axis | #44AAFF | People, relationships, community |
| Forge axis | #44FFAA | Products, code, infrastructure |
| Shield axis | #FF4466 | Legal, benefits, protection |

---

## 2. Theme Data Structure

### 2.1 Token Hierarchy

```
tokens/
├── base/
│   ├── color/
│   │   ├── brand/           # P31 core identity
│   │   ├── axis/            # Four-axis system
│   │   ├── semantic/        # success, warning, error, info
│   │   └── ui/              # backgrounds, surfaces, borders
│   ├── typography/
│   │   ├── fontFamily/
│   │   ├── fontSize/
│   │   ├── lineHeight/
│   │   └── fontWeight/
│   ├── spacing/
│   │   ├── scale/           # 0-1000 (design system)
│   │   └── semantic/         # xs, sm, md, lg, xl, 2xl, 3xl
│   ├── sizing/
│   │   └── component/        # button-height, input-height, icon-size
│   ├── radius/
│   └── animation/
│       ├── duration/
│       └── easing/
│
├── semantic/
│   ├── mode/                # light, dark (future)
│   ├── density/             # compact, comfortable, spacious
│   └── contrast/           # normal, high
│
└── skin/
    ├── OPERATOR/            # Core P31 experience
    ├── KIDS/                # Child-friendly
    ├── GRAY_ROCK/           # Minimized visual noise
    ├── AURORA/              # Full spectrum
    ├── HIGH_CONTRAST/       # Accessibility
    └── LOW_MOTION/          # Reduced animation
```

### 2.2 TypeScript Interface

```typescript
// packages/shared/src/theme/types.ts

export type ThemeMode = 'dark' | 'light' | 'system';
export type SkinPreset = 'OPERATOR' | 'KIDS' | 'GRAY_ROCK' | 'AURORA' | 'HIGH_CONTRAST' | 'LOW_MOTION';
export type ContrastLevel = 'normal' | 'high';
export type DensityLevel = 'compact' | 'comfortable' | 'spacious';

export interface ColorTokens {
  // Brand
  phosphor: string;
  phosphorMuted: string;
  quantumCyan: string;
  quantumViolet: string;
  phosphorOrange: string;
  calciumAmber: string;
  dangerRed: string;
  
  // Axis (from cognitive passport)
  body: string;      // Health/cognition
  mesh: string;      // Relationships
  forge: string;     // Products/code
  shield: string;    // Legal/protection
  
  // UI Layers
  void: string;
  voidLight: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderSubtle: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  
  // Semantic
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
```

---

## 3. Architecture

### 3.1 Package Structure

```
packages/shared/src/theme/
├── index.ts              # Public API exports
├── types.ts              # All TypeScript interfaces
├── tokens/
│   ├── index.ts          # Token definitions
│   ├── brand.ts          # P31 brand colors
│   ├── axis.ts           # Four-axis colors
│   ├── semantic.ts       # Semantic colors
│   ├── typography.ts     # Font stacks, sizes
│   └── animation.ts       # Durations, easings
├── presets/
│   ├── index.ts          # Preset exports
│   ├── operator.ts       # Default P31
│   ├── kids.ts           # Child-friendly
│   ├── grayRock.ts       # Minimal
│   ├── aurora.ts         # Full spectrum
│   ├── highContrast.ts   # Accessibility
│   └── lowMotion.ts      # Reduced animation
├── engine/
│   ├── createThemeEngine.ts    # Factory function
│   ├── resolveTokens.ts        # Token resolution logic
│   ├── applyCSSVars.ts         # DOM application
│   └── buildCSS.ts             # Generate stylesheet
├── hooks/
│   ├── useTheme.ts       # React hook
│   ├── useThemeTokens.ts # Token access hook
│   └── useReducedMotion.ts  # Accessibility hook
└── utils/
    ├── cssVarify.ts      # Convert tokens to CSS vars
    ├── exportTheme.ts    # JSON export
    ├── importTheme.ts    # JSON import
    └── colorUtils.ts     # Color manipulation
```

### 3.2 Integration with Existing Code

**Phase 1: Create shared package** (`packages/shared/src/theme/`)

The theme engine will be built in packages/shared so it can be imported by:
- `spaceship-earth` (replace existing themeStore.ts)
- `bonding` (add runtime theming to existing Tailwind)
- `frontend` (migrate from :root to theme tokens)
- Any future applications

**Phase 2: Backward Compatibility**

The existing themeStore.ts in spaceship-earth already uses `data-theme` attribute. The new engine will:
1. Maintain the same attribute for CSS cascade compatibility
2. Add `data-mode`, `data-density`, `data-contrast` for fine-grained control
3. Generate CSS custom properties on `:root` that can be consumed by both vanilla CSS and Tailwind

---

## 4. Runtime Theme Switching

### 4.1 Zustand Store Implementation

```typescript
// packages/shared/src/theme/engine/createThemeStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { THEME_PRESETS } from '../presets';
import type { ThemeState, ThemeConfig, SkinPreset, ThemeMode, ContrastLevel, DensityLevel } from '../types';

export const createThemeStore = (storageKey = 'p31-theme') => {
  return create<ThemeState>()(
    persist(
      (set, get) => ({
        config: THEME_PRESETS.OPERATOR,

        setSkin: (skin: SkinPreset) => {
          const preset = THEME_PRESETS[skin];
          if (!preset) return;
          set({ config: { ...get().config, ...preset, skin } });
          applyThemeAttributes(skin);
        },

        setMode: (mode: ThemeMode) => {
          set((s) => ({ config: { ...s.config, mode } }));
        },

        setContrast: (contrast: ContrastLevel) => {
          set((s) => ({ config: { ...s.config, contrast } }));
        },

        setDensity: (density: DensityLevel) => {
          set((s) => ({ config: { ...s.config, density } }));
        },

        setSkinOverride: (override) => {
          set((s) => ({
            config: {
              ...s.config,
              skinOverride: { ...s.config.skinOverride, ...override }
            }
          }));
        },

        importTheme: (json: string) => {
          try {
            const parsed = JSON.parse(json);
            // Validate structure
            if (!parsed.id || !parsed.tokens) return false;
            set({ config: parsed });
            return true;
          } catch {
            return false;
          }
        },

        exportTheme: () => JSON.stringify(get().config, null, 2),

        reset: () => set({ config: THEME_PRESETS.OPERATOR }),
      }),
      { name: storageKey }
    )
  );
};

// Apply data-* attributes to document root for CSS cascade
function applyThemeAttributes(skin: SkinPreset) {
  document.documentElement.setAttribute('data-theme', skin.toLowerCase());
}
```

### 4.2 CSS Variable Application

```typescript
// packages/shared/src/theme/engine/applyCSSVars.ts

import { cssVarify } from '../utils/cssVarify';
import { resolveTokens } from './resolveTokens';
import type { ThemeConfig } from '../types';

export function applyThemeVars(config: ThemeConfig) {
  const resolved = resolveTokens(config);
  const vars = cssVarify(resolved);
  
  const root = document.documentElement;
  
  // Set each CSS custom property
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
  
  // Apply data attributes for cascade control
  root.setAttribute('data-theme', config.skin.toLowerCase());
  root.setAttribute('data-mode', config.mode);
  root.setAttribute('data-density', config.density);
  root.setAttribute('data-contrast', config.contrast);
}
```

---

## 5. Dark/Light Mode & Custom Theming

### 5.1 System Preference Detection

```typescript
// packages/shared/src/theme/utils/systemPreference.ts

export function getSystemThemePreference(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  return mediaQuery.matches ? 'dark' : 'light';
}

export function watchSystemTheme(callback: (theme: 'dark' | 'light') => void) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };
  
  mediaQuery.addEventListener('change', handler);
  return () => mediaQuery.removeEventListener('change', handler);
}
```

### 5.2 Custom Theme Creation

```typescript
// Example: Creating a custom theme at runtime

const customTheme: ThemeConfig = {
  id: 'custom-midnight',
  name: 'Midnight',
  mode: 'dark',
  skin: 'OPERATOR',
  contrast: 'normal',
  density: 'comfortable',
  tokens: { /* ... */ },
  skinOverride: {
    primary: '#00FFFF',
    secondary: '#FF00FF',
    background: '#0a0a1a',
  }
};

// Import via JSON
useThemeStore.getState().importTheme(JSON.stringify(customTheme));
```

---

## 6. CSS Integration

### 6.1 Tailwind v4 Integration (BONDING)

BONDING already uses Tailwind v4 with `@theme` block. The theme engine will generate CSS variables that Tailwind can consume:

```css
/* packages/shared/src/theme/engine/generated-theme.css */
@theme {
  /* Generated from theme tokens */
  --color-phosphor: var(--phosphor);
  --color-phosphor-muted: var(--phosphor-muted);
  --color-quantum-cyan: var(--quantum-cyan);
  /* ... etc */
  
  /* Semantic */
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-error: var(--error);
  
  /* Spacing */
  --spacing-xs: var(--spacing-xs);
  --spacing-sm: var(--spacing-sm);
  /* ... */
  
  /* Typography */
  --font-mono: var(--font-mono);
  --text-xs: var(--text-xs);
  /* ... */
}

/* Skin-specific overrides via data attributes */
[data-theme="operator"] {
  --phosphor: #00FF88;
  --background: #050510;
}

[data-theme="kids"] {
  --phosphor: #E9C46A;
  --background: #1e1b4b;
}

[data-theme="high-contrast"] {
  --phosphor: #00FFFF;
  --background: #000000;
}
```

### 6.2 Vanilla CSS Migration (Frontend/Spaceship Earth)

Existing `:root` variables will be replaced with theme tokens:

```css
/* Before */
:root {
  --void: #050510;
  --phosphorus: #2dffa0;
}

/* After - use CSS vars */
:root {
  --void: var(--void);
  --phosphorus: var(--phosphor);
}
```

### 6.3 Runtime CSS Generation

```typescript
// Generate theme-specific CSS for runtime injection

export function generateThemeCSS(config: ThemeConfig): string {
  const vars = cssVarify(resolveTokens(config));
  
  return `
:root {
${Object.entries(vars).map(([k, v]) => `  --${k}: ${v};`).join('\n')}
}

[data-theme="${config.skin.toLowerCase()}"] {
  /* Skin-specific overrides */
}
`;
}
```

---

## 7. Component Access Patterns

### 7.1 React Hook

```typescript
// packages/shared/src/theme/hooks/useTheme.ts

import { useThemeStore } from '../engine/createThemeStore';
import { applyThemeVars } from '../engine/applyCSSVars';
import { useEffect } from 'react';

export function useTheme() {
  const { config, setSkin, setMode, setContrast, setDensity, importTheme, exportTheme, reset } = useThemeStore();
  
  // Apply CSS variables on config change
  useEffect(() => {
    applyThemeVars(config);
  }, [config]);
  
  return {
    config,
    skin: config.skin,
    mode: config.mode,
    contrast: config.contrast,
    density: config.density,
    setSkin,
    setMode,
    setContrast,
    setDensity,
    importTheme,
    exportTheme,
    reset,
  };
}
```

### 7.2 Direct Token Access

```typescript
// packages/shared/src/theme/hooks/useThemeTokens.ts

import { useThemeStore } from '../engine/createThemeStore';
import { resolveTokens } from '../engine/resolveTokens';

export function useThemeTokens() {
  const config = useThemeStore((s) => s.config);
  return resolveTokens(config);
}

// Usage in component
function MyComponent() {
  const tokens = useThemeTokens();
  
  return (
    <div style={{ 
      color: tokens.color.textPrimary,
      background: tokens.color.void,
      fontFamily: tokens.typography.fontFamily.mono,
    }}>
      Content
    </div>
  );
}
```

### 7.3 Reduced Motion Hook

```typescript
// packages/shared/src/theme/hooks/useReducedMotion.ts

import { useThemeStore } from '../engine/createThemeStore';
import { useMediaQuery } from '../hooks/useMediaQuery';

export function useReducedMotion(): boolean {
  const config = useThemeStore((s) => s.config);
  const systemPrefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  return config.skin === 'LOW_MOTION' || 
         config.skinOverride?.reduceMotion === true || 
         systemPrefersReduced;
}
```

---

## 8. Inheritance & Overrides

### 8.1 Theme Hierarchy

```
System Preference
       ↓
   Theme Mode (dark/light)
       ↓
    Skin Preset
       ↓
   Skin Override (user customization)
       ↓
   Component-level props
```

### 8.2 Override Resolution

```typescript
// packages/shared/src/theme/engine/resolveTokens.ts

import { THEME_PRESETS } from '../presets';
import type { ThemeConfig, ThemeTokens } from '../types';

export function resolveTokens(config: ThemeConfig): ThemeTokens {
  // Start with base tokens
  const base = getBaseTokens();
  
  // Apply skin preset
  const preset = THEME_PRESETS[config.skin];
  const skinTokens = resolveSkinTokens(preset, config.mode);
  
  // Apply user overrides
  const overridden = config.skinOverride 
    ? applyOverrides(skinTokens, config.skinOverride)
    : skinTokens;
  
  // Apply contrast adjustment
  const contrasted = applyContrast(overridden, config.contrast);
  
  // Apply density adjustment
  const densified = applyDensity(contrasted, config.density);
  
  return densified;
}
```

---

## 9. Phased Implementation

### Phase 1: Foundation (Week 1-2)

**Goal**: Create shared theme package with core types and presets

- [ ] Create `packages/shared/src/theme/` directory structure
- [ ] Define all TypeScript interfaces in `types.ts`
- [ ] Implement token definitions (brand, axis, semantic, typography, animation)
- [ ] Create preset files for all 6 skins
- [ ] Export public API from `index.ts`

**Deliverables**:
- `packages/shared/src/theme/types.ts`
- `packages/shared/src/theme/tokens/`
- `packages/shared/src/theme/presets/`
- `packages/shared/src/theme/index.ts`

### Phase 2: Engine (Week 2-3)

**Goal**: Build runtime theme engine with Zustand

- [ ] Implement `createThemeStore()` with persist middleware
- [ ] Build token resolution logic in `resolveTokens.ts`
- [ ] Create CSS variable application in `applyCSSVars.ts`
- [ ] Implement import/export functionality
- [ ] Add system preference detection

**Deliverables**:
- `packages/shared/src/theme/engine/createThemeStore.ts`
- `packages/shared/src/theme/engine/resolveTokens.ts`
- `packages/shared/src/theme/engine/applyCSSVars.ts`

### Phase 3: Integration - Spaceship Earth (Week 3-4)

**Goal**: Migrate existing themeStore to use shared package

- [ ] Install shared package in spaceship-earth
- [ ] Replace `src/stores/themeStore.ts` with imported hook
- [ ] Update CSS to use generated CSS variables
- [ ] Test all 6 presets work correctly
- [ ] Verify persistence works across sessions

**Deliverables**:
- Migrated theme system in spaceship-earth
- Working theme switching UI
- Cross-session persistence

### Phase 4: Integration - BONDING (Week 4-5)

**Goal**: Add runtime theming to existing Tailwind setup

- [ ] Install shared package in bonding
- [ ] Generate Tailwind-compatible CSS variables
- [ ] Add theme switching to settings/options
- [ ] Create skin-specific overrides in Tailwind config
- [ ] Test touch interactions with all themes

**Deliverables**:
- Runtime theme switching in BONDING
- 6 working themes with consistent tokens
- Touch-friendly theme picker

### Phase 5: Integration - Frontend (Week 5-6)

**Goal**: Migrate existing :root variables to theme tokens

- [ ] Install shared package in frontend
- [ ] Migrate `styles.css` to use CSS variables
- [ ] Update all components to use tokens
- [ ] Verify consistency with other apps

**Deliverables**:
- Migrated frontend with theme engine
- Consistent styling across all P31 apps

### Phase 6: Polish & Documentation (Week 6-7)

**Goal**: Complete the theme engine with testing and docs

- [ ] Add comprehensive tests for token resolution
- [ ] Test all skin/contrast/density combinations
- [ ] Document API in README.md
- [ ] Create theme creation guide
- [ ] Add Storybook stories for theme preview

**Deliverables**:
- Test coverage for theme engine
- Documentation
- Theme preview component

---

## 10. Recommendations Based on Codebase Analysis

### 10.1 Leverage Existing Infrastructure

The existing `themeStore.ts` in spaceship-earth provides a solid foundation. Key elements to preserve:
- Zustand with persist middleware
- `data-theme` attribute for CSS cascade
- 6 preset themes already defined
- Import/export functionality

### 10.2 Align with P31 Brand Palette

The cognitive passport defines a comprehensive palette. The theme engine must include:
- All 8 brand colors (Phosphor Green, Quantum Cyan, Quantum Violet, etc.)
- 4 axis colors (Body, Mesh, Forge, Shield)
- Semantic colors for accessibility (success, warning, error, info)

### 10.3 Consistent Styling Approach

Given the mixed approach (Tailwind in BONDING, vanilla CSS in others):
- Use CSS custom properties as the source of truth
- Tailwind can consume CSS vars via `@theme` block
- Vanilla CSS uses vars directly
- This provides maximum compatibility

### 10.4 Accessibility First

The existing HIGH_CONTRAST and LOW_MOTION skins demonstrate accessibility awareness. The theme engine should:
- Respect `prefers-reduced-motion` system preference
- Support high contrast mode for visual impairments
- Ensure minimum touch targets (48px) across themes

### 10.5 Persistence Strategy

The current localStorage-based persistence (`name: 'p31-theme'`) should be maintained, but consider:
- Adding IndexedDB fallback for larger theme configurations
- Supporting cross-device sync via P31 mesh (future)

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-------------|
| Token divergence between apps | Inconsistent UI | Centralize all tokens in shared package |
| Performance impact of CSS var updates | Slow theme switching | Use CSS containment and batch updates |
| Break existing BONDING styling | Visual regression | Extensive testing across all skins |
| Missing token coverage | Developers use hardcoded colors | Comprehensive token audit and documentation |
| Theme switching during animation | Glitches | Disable transitions when reducing motion |

---

## 12. Success Metrics

- ✅ All 6 presets work identically across bonding, spaceship-earth, and frontend
- ✅ Theme switching completes in <100ms
- ✅ 100% of hardcoded colors replaced with tokens
- ✅ Accessibility: HIGH_CONTRAST and LOW_MOTION pass WCAG AA
- ✅ Developer documentation complete
- ✅ Theme can be exported/imported as JSON

---

## Appendix: File Mapping

| Source | Destination |
|--------|-------------|
| `spaceship-earth/src/stores/themeStore.ts` | `packages/shared/src/theme/engine/createThemeStore.ts` |
| `spaceship-earth/src/sovereign/types.ts` (SkinTheme) | `packages/shared/src/theme/types.ts` |
| `bonding/src/index.css` (@theme block) | `packages/shared/src/theme/tokens/` |
| `frontend/src/styles.css` (:root) | Migrate to CSS vars |
| Existing hardcoded colors | Replace with tokens |

---

*This architecture document provides a blueprint for a unified theme system across P31 Labs applications. The phased approach allows incremental adoption while maintaining backward compatibility.*