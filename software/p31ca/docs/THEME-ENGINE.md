# P31 Fluid Design System

**Version:** 2.0.0  
**Schema:** `p31.fluidDesign/2.0.0` / `p31.themeEngine/2.0.0`

A smart, flowing, adaptive design system for p31ca.org with 6 themes, 5 adaptive modes, and fluid animations.

---

## Features

- **6 Curated Themes:** Hub, Org, Midnight, Genesis, Paper, Matrix
- **5 Adaptive Modes:** Default, Focus, Calm, Vibrant, Muted
- **Fluid Motion Library:** 8 easing curves, 6 animation presets
- **Auto-Appearance:** Respects system light/dark preference
- **Reduced Motion Support:** Automatic accessibility adaptation
- **Instant Swapping:** Zero-FOMO theme transitions
- **Smart Contrast:** Automatic accessibility compliance

---

## Quick Start

### 1. Link the CSS

```html
<!-- Base tokens -->
<link rel="stylesheet" href="/p31-style.css">

<!-- Fluid design system -->
<link rel="stylesheet" href="/lib/p31-fluid.css">

<!-- Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### 2. Initialize Theme Engine

```html
<script type="module">
  import { P31ThemeController } from '/lib/p31-theme-engine.mjs';
  
  const theme = new P31ThemeController({
    defaultTheme: 'hub',
    defaultMode: 'default',
    autoSync: true  // saves to localStorage
  });
</script>
```

### 3. Use Tokens

```css
.my-component {
  background: var(--p31-surface);
  color: var(--p31-cloud);
  padding: var(--p31-space-4);
  border-radius: var(--p31-radius-lg);
  transition: var(--p31-transition-all);
}
```

---

## Themes

| Theme | Scheme | Best For |
|-------|--------|----------|
| **hub** | Dark | Default technical work |
| **org** | Light | Public-facing content |
| **midnight** | Dark | Deep focus, reduced blue |
| **genesis** | Dark | Creative sessions |
| **paper** | Light | Reading, documentation |
| **matrix** | Dark | Terminal vibes, retro |

---

## JavaScript API

### ThemeController

```javascript
// Set theme
theme.setTheme('genesis');

// Set adaptive mode
theme.setMode('focus');  // higher contrast, cooler

// Set appearance
theme.setAppearance('auto');  // auto, light, dark

// Cycle through themes
theme.cycleTheme();
theme.cycleMode();

// Listen for changes
theme.onChange(({ theme, mode, state }) => {
  console.log(`Now using: ${theme.label} in ${mode} mode`);
});

// Get current state
const state = theme.getCurrentState();
```

### Programmatic Usage

```javascript
import { P31_THEMES, P31_MODES, P31_FLUID } from '/lib/p31-theme-engine.mjs';

// Access theme definitions
console.log(P31_THEMES.hub.colors.void);  // #0f1115

// Access fluid timings
console.log(P31_FLUID.duration.smooth);   // 300ms
console.log(P31_FLUID.easing.spring);     // cubic-bezier
```

---

## CSS Tokens Reference

### Colors

```css
/* Surfaces */
--p31-void        /* Page background */
--p31-surface     /* Card background */
--p31-surface2    /* Elevated */
--p31-surface3    /* Pressed */

/* Content */
--p31-paper       /* Headings */
--p31-cloud       /* Body text */
--p31-muted       /* Secondary */

/* Accents */
--p31-coral       /* Warmth */
--p31-teal        /* Trust */
--p31-cyan        /* Live status */
--p31-butter      /* Soft attention */
--p31-lavender    /* Wonder */
--p31-phosphorus  /* Success */
--p31-phosphor    /* Glow */

/* Dynamic emphasis (changes with theme) */
--p31-primary     /* Theme primary */
--p31-secondary   /* Theme secondary */
--p31-accent      /* Glow accent */
```

### Spacing

```css
--p31-space-1     /* 0.25rem - 0.5rem fluid */
--p31-space-2     /* 0.5rem - 1rem fluid */
--p31-space-4     /* 1rem - 2rem fluid */
--p31-space-6     /* 1.5rem - 3rem fluid */
--p31-space-8     /* 2rem - 4rem fluid */
```

### Typography

```css
--p31-font-sans   /* Atkinson Hyperlegible */
--p31-font-mono   /* JetBrains Mono */

--p31-text-sm     /* 0.875rem - 1rem fluid */
--p31-text-base   /* 1rem - 1.125rem fluid */
--p31-text-lg     /* 1.125rem - 1.5rem fluid */
--p31-text-xl     /* 1.25rem - 1.75rem fluid */
```

### Motion

```css
--p31-duration-fast     /* 150ms */
--p31-duration-normal   /* 250ms */
--p31-duration-slow     /* 400ms */
--p31-duration-cinematic /* 800ms */

--p31-ease-smooth       /* Standard transitions */
--p31-ease-fluid        /* Natural motion */
--p31-ease-spring       /* Bouncy feedback */
--p31-ease-snap         /* Quick cuts */
```

---

## Utility Classes

### Layout

```html
<div class="p31-container p31-container-lg"> <!-- Max-width container -->
<div class="p31-stack p31-stack-lg">      <!-- Vertical spacing -->
<div class="p31-cluster">                  <!-- Flex with gap -->
<div class="p31-grid p31-grid-auto">       <!-- Auto-fit grid -->
```

### Cards

```html
<div class="p31-card">           <!-- Standard card -->
<div class="p31-card-glass">     <!-- Glass morphism -->
```

### Buttons

```html
<button class="p31-btn p31-btn-primary">Primary</button>
<button class="p31-btn p31-btn-secondary">Secondary</button>
<button class="p31-btn p31-btn-ghost">Ghost</button>
```

### Animations

```html
<div class="p31-animate-fade-up">     <!-- Fade + slide up -->
<div class="p31-animate-scale-in">    <!-- Scale with bounce -->
<div class="p31-animate-slide-in">    <!-- Slide from right -->
<div class="p31-animate-float">       <!-- Infinite float -->
<div class="p31-animate-pulse">       <!-- Glow pulse -->
<div class="p31-stagger">             <!-- Stagger children -->
```

---

## Accessibility

### Reduced Motion

```css
/* Respects prefers-reduced-motion automatically */
@media (prefers-reduced-motion: reduce) {
  /* All durations become 0ms or minimal */
}
```

### Keyboard Navigation

```html
<button class="p31-btn p31-btn-primary p31-focus-ring">
  Focus Visible Support
</button>
```

### Screen Readers

```html
<a href="#main" class="p31-sr-only-focusable">
  Skip to main content
</a>
<span class="p31-sr-only">Hidden label</span>
```

---

## Advanced Usage

### Custom Theme

```javascript
// Extend with custom theme
const myTheme = {
  id: 'custom',
  label: 'Custom',
  scheme: 'dark',
  colors: {
    void: '#000000',
    surface: '#111111',
    // ... all required colors
  },
  emphasis: { primary: 'teal', secondary: 'coral', accent: 'phosphor' }
};

// Register and use
P31_THEMES.custom = myTheme;
theme.setTheme('custom');
```

### Mode Adjustments

Modes apply automatic adjustments:
- **focus:** +10% contrast, -10% saturation, cooler (-5 warmth)
- **calm:** -5% contrast, -15% saturation, warmer (+10 warmth)
- **vibrant:** +5% contrast, +15% saturation
- **muted:** -10% contrast, -30% saturation, warmer (+5 warmth)

### Theme Widget

Auto-initializes with floating widget. Keyboard shortcut: `T` to cycle themes.

```javascript
import { P31ThemeSwitcher } from '/lib/p31-theme-switcher.mjs';

const switcher = new P31ThemeSwitcher({
  position: 'bottom-right',  // or bottom-left, top-right, top-left
  themeController: theme
});
```

---

## Files

| File | Purpose |
|------|---------|
| `/lib/p31-theme-engine.mjs` | Core theme controller |
| `/lib/p31-fluid.css` | Design tokens + utilities |
| `/lib/p31-theme-switcher.mjs` | Floating widget |
| `/theme-showcase.html` | Demo page |

---

## Browser Support

- Chrome 88+ (CSS backdrop-filter)
- Firefox 103+ (full custom properties)
- Safari 14+ (CSS cascade layers)
- Edge 88+

---

## Schema

```json
{
  "$schema": "p31.themeEngine/2.0.0",
  "themes": ["hub", "org", "midnight", "genesis", "paper", "matrix"],
  "modes": ["default", "focus", "calm", "vibrated", "muted"],
  "features": [
    "adaptive-contrast",
    "fluid-motion",
    "reduced-motion-support",
    "auto-appearance",
    "localStorage-sync"
  ]
}
```

---

*Built for P31 Labs. Everything flows.*
