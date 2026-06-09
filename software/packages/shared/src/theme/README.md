# P31 Theme Engine

A comprehensive, runtime theme switching system for the P31 ecosystem built with TypeScript, Zustand, and CSS custom properties.

## Overview

The P31 Theme Engine provides a complete theming solution that supports:

- **Runtime theme switching** with instant updates
- **Multiple theme presets** (Operator, Kids, Gray Rock, Aurora, High Contrast, Low Motion)
- **Dark/Light/System mode** detection and switching
- **Custom theme import/export** via JSON
- **CSS-in-JS integration** with theme tokens
- **Accessibility features** including high contrast and reduced motion
- **Responsive design** with viewport-based sizing
- **Glass morphism effects** and modern UI patterns

## Architecture

### Core Components

1. **Theme Types** (`types.ts`) - TypeScript interfaces and type definitions
2. **Token System** (`tokens/`) - Color, typography, spacing, and animation tokens
3. **Theme Presets** (`presets/`) - Pre-configured theme configurations
4. **State Management** (`store.ts`) - Zustand store with persistence
5. **React Hooks** (`hooks.ts`) - React integration hooks
6. **Utilities** (`utils.ts`) - Helper functions and validation
7. **CSS Variables** (`css-variables.css`) - CSS custom properties and utilities

### Theme Structure

```typescript
interface ThemeConfig {
  id: string;
  name: string;
  mode: 'dark' | 'light' | 'system';
  skin: 'OPERATOR' | 'KIDS' | 'GRAY_ROCK' | 'AURORA' | 'HIGH_CONTRAST' | 'LOW_MOTION';
  contrast: 'normal' | 'high';
  density: 'compact' | 'comfortable' | 'spacious';
  tokens: ThemeTokens;
  skinOverride?: Partial<SkinTokens>;
}
```

## Usage

### Basic Setup

```typescript
import { useTheme, useThemeActions } from '@p31/shared/theme';

function MyComponent() {
  const theme = useTheme();
  const { setSkin, setMode } = useThemeActions();
  
  return (
    <div>
      <button onClick={() => setSkin('KIDS')}>
        Switch to Kids Theme
      </button>
      <button onClick={() => setMode('light')}>
        Switch to Light Mode
      </button>
    </div>
  );
}
```

### CSS-in-JS Integration

```typescript
import { createThemedStyles } from '@p31/shared/theme';

const styles = createThemedStyles((tokens) => ({
  container: {
    backgroundColor: tokens.colors.background,
    color: tokens.colors.textPrimary,
    padding: tokens.spacing.md,
    borderRadius: tokens.skin.borderRadius,
  },
  button: {
    backgroundColor: tokens.colors.primary,
    color: tokens.colors.foreground,
    border: `1px solid ${tokens.colors.border}`,
  },
}));
```

### CSS Custom Properties

```css
.my-component {
  background-color: var(--skin-background);
  color: var(--skin-foreground);
  border: 1px solid var(--color-border);
  padding: var(--spacing-md);
  border-radius: var(--skin-border-radius);
  transition: all var(--duration-normal) var(--easing-default);
}
```

## Theme Presets

### Operator (Default)
- P31 brand colors with dark theme
- Comfortable density and normal contrast
- Modern glass effects and smooth animations

### Kids
- Warmer, friendlier color palette
- Larger text sizes for readability
- Slower animations for better comprehension
- More rounded corners

### Gray Rock
- Desaturated grayscale theme
- Compact density for maximum screen real estate
- Minimal visual stimulation
- Sharp corners and fast animations

### Aurora
- Vibrant and saturated colors
- Deep space aesthetic
- Dramatic animations and effects
- Premium visual experience

### High Contrast
- Maximum contrast for accessibility
- Larger text sizes
- Bold typography
- No transparency or glass effects

### Low Motion
- Calming, stable color palette
- Minimal animations
- Reduced visual stimulation
- Comfortable reading experience

## API Reference

### Hooks

- `useTheme()` - Get current theme configuration
- `useThemeMode()` - Get current theme mode
- `useSkin()` - Get current skin preset
- `useContrast()` - Get current contrast level
- `useDensity()` - Get current density level
- `useThemeActions()` - Get theme manipulation actions
- `useReduceMotion()` - Check if motion should be reduced
- `useThemeTokens()` - Get raw theme tokens
- `useComputedThemeTokens()` - Get computed theme values

### Actions

- `setSkin(skin)` - Switch to a theme preset
- `setMode(mode)` - Set dark/light/system mode
- `setContrast(contrast)` - Set contrast level
- `setDensity(density)` - Set density level
- `setSkinOverride(override)` - Override specific skin properties
- `importTheme(json)` - Import theme from JSON
- `exportTheme()` - Export current theme to JSON
- `reset()` - Reset to default theme

### Utilities

- `getCurrentTheme()` - Get current theme (outside React)
- `setThemeSkin(skin)` - Set skin (outside React)
- `setThemeMode(mode)` - Set mode (outside React)
- `shouldReduceMotion()` - Check motion preference (outside React)
- `getCSSVariable(name, fallback)` - Get CSS custom property value
- `createThemedStyles(styles)` - Create CSS-in-JS styles with theme tokens
- `validateThemeConfig(config)` - Validate theme configuration
- `mergeThemeConfigs(base, override)` - Merge theme configurations

## CSS Utilities

### Theme Classes

```css
.theme-background { background-color: var(--skin-background); }
.theme-foreground { color: var(--skin-foreground); }
.theme-primary { color: var(--skin-primary); }
.theme-secondary { color: var(--skin-secondary); }
.theme-accent { color: var(--skin-accent); }
.theme-muted { color: var(--skin-muted); }
.theme-border { border-color: var(--color-border); }
.theme-text-primary { color: var(--color-text-primary); }
.theme-text-secondary { color: var(--color-text-secondary); }
.theme-text-muted { color: var(--color-text-muted); }
```

### Spacing Utilities

```css
.spacing-xs { margin: var(--spacing-xs); }
.spacing-sm { margin: var(--spacing-sm); }
.spacing-md { margin: var(--spacing-md); }
.spacing-lg { margin: var(--spacing-lg); }
.spacing-xl { margin: var(--spacing-xl); }
.spacing-2xl { margin: var(--spacing-2xl); }
.spacing-3xl { margin: var(--spacing-3xl); }

/* Directional variants: -top, -bottom, -left, -right */
.spacing-md-top { margin-top: var(--spacing-md); }
.spacing-md-bottom { margin-bottom: var(--spacing-md); }
.spacing-md-left { margin-left: var(--spacing-md); }
.spacing-md-right { margin-right: var(--spacing-md); }
```

### Typography Utilities

```css
.text-xs { font-size: var(--font-size-xs); }
.text-sm { font-size: var(--font-size-sm); }
.text-base { font-size: var(--font-size-base); }
.text-lg { font-size: var(--font-size-lg); }
.text-xl { font-size: var(--font-size-xl); }
.text-2xl { font-size: var(--font-size-2xl); }
.text-3xl { font-size: var(--font-size-3xl); }
.text-4xl { font-size: var(--font-size-4xl); }

.font-mono { font-family: var(--font-family-mono); }
.font-sans { font-family: var(--font-family-sans); }
.font-display { font-family: var(--font-family-display); }

.font-normal { font-weight: var(--font-weight-normal); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.font-bold { font-weight: var(--font-weight-bold); }

.leading-tight { line-height: var(--line-height-tight); }
.leading-normal { line-height: var(--line-height-normal); }
.leading-relaxed { line-height: var(--line-height-relaxed); }
```

### Animation Utilities

```css
.transition-fast { transition: all var(--duration-fast) var(--easing-default); }
.transition-normal { transition: all var(--duration-normal) var(--easing-default); }
.transition-slow { transition: all var(--duration-slow) var(--easing-default); }

.animate-in { animation: fadeIn var(--duration-normal) var(--easing-enter); }
.animate-out { animation: fadeOut var(--duration-normal) var(--easing-exit); }

.glass {
  background: rgba(var(--skin-primary-rgb, 0, 255, 136), var(--skin-glass-opacity, 0.15));
  border: 1px solid rgba(var(--color-border-rgb, 42, 42, 64), 0.3);
  border-radius: var(--skin-border-radius, 8px);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}
```

## Browser Support

- **Modern browsers** with CSS custom properties support
- **Safari** with vendor prefixes for backdrop-filter
- **Reduced motion** support via `prefers-reduced-motion` media query
- **System theme detection** via `prefers-color-scheme` media query

## Performance

- **CSS-in-JS optimization** - Theme tokens are computed once and cached
- **CSS custom properties** - Native browser performance for theme switching
- **Zustand persistence** - Minimal re-renders with selective subscriptions
- **Lazy loading** - Theme system only loads when needed

## Accessibility

- **High contrast mode** with maximum color contrast
- **Reduced motion** support for users with motion sensitivity
- **Semantic color tokens** for meaningful color relationships
- **Font size scaling** with viewport-based responsive typography
- **Focus indicators** and keyboard navigation support

## Migration Guide

### From Spaceship Earth Theme System

1. **Replace theme imports**:
   ```typescript
   // Old
   import { useTheme } from 'spaceship-earth/theme';
   
   // New
   import { useTheme } from '@p31/shared/theme';
   ```

2. **Update theme usage**:
   ```typescript
   // Old
   const { colors, spacing } = useTheme();
   
   // New
   const theme = useTheme();
   const { colors, spacing } = useComputedThemeTokens();
   ```

3. **Update CSS-in-JS**:
   ```typescript
   // Old
   const styles = useThemeStyles((theme) => ({
     container: {
       backgroundColor: theme.colors.background,
     },
   }));
   
   // New
   const styles = createThemedStyles((tokens) => ({
     container: {
       backgroundColor: tokens.colors.background,
     },
   }));
   ```

## Development

### Adding New Theme Presets

1. Create a new preset file in `presets/`
2. Export the theme configuration
3. Add to `THEME_PRESETS` object in `presets/index.ts`
4. Update TypeScript types if needed

### Adding New Theme Tokens

1. Add token definitions to appropriate token file
2. Update TypeScript interfaces in `types.ts`
3. Add CSS custom properties to `css-variables.css`
4. Update theme presets to use new tokens

### Testing

```bash
# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run tests (when available)
npm test
```

## Contributing

1. Follow TypeScript strict mode
2. Maintain backward compatibility
3. Add tests for new features
4. Update documentation for API changes
5. Use semantic versioning for breaking changes

## License

P31 Theme Engine is part of the P31 ecosystem and follows the project's licensing terms.