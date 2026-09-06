# P31 Skin System

## Overview

The P31 skin system enables runtime theming by injecting CSS custom property overrides on `document.documentElement`. Each skin is a set of `--p31-*` token overrides defined in a CSS file (`@p31/skin-*/index.css`) and mirrored in a JavaScript registry (`@p31/skin-system/src/registry.ts`).

## Architecture

```
@p31/design-core            # Base tokens (primitive values)
       ↓
@p31/skin-willow/index.css  # Skin overrides (semantic + component tokens)
       ↓
@p31/skin-system            # Runtime engine: applySkin(), resetSkin()
```

## Token Taxonomy (W3C DTCG-aligned)

| Tier | Example | Where Defined |
|------|---------|---------------|
| **Primitive** | `--p31-accent: #00F0FF` | `design-core/base.css` |
| **Semantic** | `--color-quantum-cyan: var(--p31-accent)` | App `@theme` blocks |
| **Component** | `--p31-nav-h: 46px` | Skin CSS (`@p31/skin-*/index.css`) |

## API

```ts
import { applySkin, resetSkin, listSkins } from '@p31/skin-system';

// List available skins
listSkins();  // → [{ id: 'willow', name: 'WILLOW', ... }, ...]

// Apply a skin (injects CSS var overrides on <html>)
applySkin('willow');  // turns accent green, void to green-black, etc.

// Reset to defaults (removes injected overrides)
resetSkin();

// Read current skin
import { getCurrentSkin } from '@p31/skin-system';
getCurrentSkin();  // → 'willow' | null
```

## Available Skins

| Skin | Accent | Glass | Nav Height | Package |
|------|--------|-------|------------|---------|
| **WILLOW** | `#34d399` (green) | `rgba(7,13,10,0.9)` | 46px | `@p31/skin-willow` |
| **PHOS** | `#a78bfa` (violet) | Default | Default | `@p31/skin-phos` |
| **TETRA** | `#00f0ff` (cyan) | `rgba(10,13,20,0.92)` | Default | `@p31/skin-tetra` |
| **APEX** | `#fbbf24` (gold) | `rgba(10,13,20,0.92)` | Default | `@p31/skin-apex` |

## Creating a New Skin

1. **Create the CSS file**: `packages/skin-myskin/src/index.css`
   ```css
   :root {
     --p31-accent: #ff6600;
     --p31-void: #0a0805;
     --p31-nav-h: 48px;
   }
   ```

2. **Register in the runtime**: Add to `packages/skin-system/src/registry.ts`
   ```ts
   myskin: {
     id: 'myskin',
     name: 'MYSKIN',
     description: 'Custom orange accent skin.',
     tokenOverrides: {
       '--p31-accent': '#ff6600',
       '--p31-void': '#0a0805',
       '--p31-nav-h': '48px',
     },
   },
   ```

3. **Add to the catalog**: Add entry to `apps/tetra-ops/src/data/components.ts` (or the skin catalog if separate).

4. **Test**: `applySkin('myskin')` in browser console.

## Usage in Apps

**Build-time (production):** Import the skin CSS in the app's entrypoint.
```ts
import '@p31/skin-willow';
```

**Runtime (preview):** Use `applySkin()` to switch skins without reloading.
```ts
import { applySkin } from '@p31/skin-system';
applySkin('willow');
```
