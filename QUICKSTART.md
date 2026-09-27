# P31 Labs — Quick Start

Welcome to the P31 ecosystem. This guide gets you from zero to a running app in under 10 minutes.

## Prerequisites

- [Node.js 24+](https://nodejs.org)
- [pnpm](https://pnpm.io) (`npm install -g pnpm`)
- A Cloudflare account (for deployment)

## Clone & Install

```bash
git clone https://github.com/p31labs/P31-local-workspace.git
cd P31-local-workspace
pnpm install
```

## The Lay of the Land

| Directory | What |
|-----------|------|
| `packages/design-core/` | Design tokens, glass, motion, typography, starfield |
| `packages/ui/` | Shared React component library (AppNav, BrandMark, GlassCard, etc.) |
| `packages/skin-system/` | Runtime skin engine (applySkin, resetSkin) |
| `packages/skin-*/` | Skin packages (willow, phos, tetra, apex) |
| `apps/phos/` | PHOS — ambient workspace (Vite React 19 SPA) |
| `apps/willow/` | WILLOW — child companion app (Vite React 19 SPA) |
| `apps/phosphorus31/` | phosphorus31 — nonprofit site (Astro) |
| `apps/p31ca/` | P31 Technical Hub (Astro) |
| `apps/tetra-ops/` | TETRA Ops — ecosystem dashboard (Vite React 19 SPA) |

## Run an App Locally

```bash
# PHOS
cd apps/phos && pnpm dev

# WILLOW
cd apps/willow && pnpm dev

# phosphorus31
cd apps/phosphorus31 && pnpm dev

# p31ca
cd apps/p31ca && pnpm dev

# TETRA Ops (catalog)
cd apps/tetra-ops && pnpm dev
```

## Build & Deploy

```bash
# Build PHOS (Vite)
cd apps/phos && pnpm build

# Deploy PHOS to Cloudflare Pages
cd apps/phos && npx wrangler pages deploy "$(pwd)/dist" --project-name phos --commit-dirty=true

# Build + deploy WILLOW
cd apps/willow && pnpm build && npx wrangler pages deploy dist --project-name willow --commit-dirty=true
```

## Using the Design System

```ts
// Import a component
import { BrandMark, SpoonDial, GlassCard, GlowButton } from '@p31ca/ui/chrome';

// Apply a skin
import '@p31/skin-willow';

// Use runtime skin switching (catalog preview)
import { applySkin, resetSkin } from '@p31/skin-system';
applySkin('phos');
```

## Key Concepts

- **Spoon-aware**: All UI respects `data-spoons` (0–5) on `<html>`. Spoon 0 hides chrome.
- **Token-first**: Never hardcode colors or sizes. Use `var(--p31-accent)`, `var(--p31-void)`, etc.
- **One core, many skins**: `@p31ca/design-core` is the immutable source. Skins override tokens.
- **Catalog**: Browse components, apps, and skins at `hub.p31ca.org`.

## Where to Go Next

- [Design System Governance](packages/DESIGN_SYSTEM.md)
- [Skin System Docs](packages/skin-system/README.md)
- [WILLOW Skin](packages/skin-willow/README.md)
- [Component Catalog](https://p31ca-ops.pages.dev)

## Community

- [GitHub](https://github.com/p31labs)
- [Discord](https://discord.gg/uYW5rTCuZ)
- [Ko-fi](https://ko-fi.com/trimtab69420)

## License

MIT. No tracking. No ads. Open source.
