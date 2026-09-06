# @p31/skin-willow

Green accent, compact glass, emerald glow. Mobile-first companion app skin.

## Tokens

| Token | Value |
|-------|-------|
| `--p31-void-deep` | `#030608` |
| `--p31-void` | `#070d0a` |
| `--p31-surface` | `#0d1812` |
| `--p31-surface2` | `#132018` |
| `--p31-accent` | `#34d399` |
| `--p31-text-primary` | `#f0f2f5` |
| `--p31-text-secondary` | `rgba(240,242,245,0.42)` |
| `--p31-text-tertiary` | `rgba(240,242,245,0.18)` |
| `--p31-glass-surface` | `rgba(7,13,10,0.9)` |
| `--p31-glass-border` | `rgba(52,211,153,0.12)` |
| `--p31-glass-radius` | `14px` |
| `--p31-blur-standard` | `18px` |
| `--p31-blur-strong` | `24px` |
| `--p31-glow-cyan` | `0 0 20px rgba(52,211,153,0.25)` |
| `--p31-glow-green` | `0 0 20px rgba(52,211,153,0.4)` |
| `--p31-nav-h` | `46px` |

## Usage

```bash
pnpm add @p31/skin-willow
```

```ts
// Build-time
import '@p31/skin-willow';

// Runtime (preview)
import { applySkin } from '@p31/skin-system';
applySkin('willow');
```

## Used By

- WILLOW (main app + preview)
- tetra-ops catalog (preview)
