# @p31/design-core

Canonical P31 Design System — tokens, primitives, compositions, recipes, MCP server, agentic intent pipeline.

## Install

```bash
# From monorepo root (canonical)
pnpm -C packages/design-core install

# Or as vendored tarball in consuming portals
pnpm add file:./vendor/p31-design-core-2.2.0.tgz
```

## Quick Start

```tsx
import {
  SectionStrip,
  CommandPalette,
  Chameleon,
  PageHeader,
  Topbar,
  BottomNav,
  Button,
  GlassCard,
  GlassPanel,
  StatusBadge,
  SpoonDial,
  Starfield,
  CrisisOverlay,
} from '@p31/design-core/compositions';

import '@p31/design-core/css/all.css';
```

## Commands

```bash
pnpm typecheck          # TypeScript strict mode
pnpm test               # Unit tests (31 contrast tests)
pnpm gen:tokens         # Regenerate all token artifacts (CSS, TS, DTCG JSON)
pnpm generate           # Regenerate multi-framework component artifacts
pnpm convert            # Convert components between frameworks
pnpm audit:components   # Scan monorepo for CSS class usage vs recipes.css
pnpm audit:semantic     # Scan for semantic CSS classes
pnpm mcp                # Start stdio MCP server
pnpm build              # TypeScript compilation
```

## Architecture

### Single Source of Truth
All visual decisions flow from **one file**:
```
src/theming/theme-store.ts
```

### Token Tiers
1. **Primitives**: Raw OKLCH values (`color.palette.ocean.500`)
2. **Semantic**: Meaningful assignments (`color.surface.primary`)
3. **Component**: Component-specific (`button.primary.background`)

### Themes
- 5 worlds: `garden`, `ocean`, `aurora`, `zen`, `volt`
- 3 ages: `child`, `teen`, `adult`
- 2 sensory modes: `muted`, `warmLight`
- Total: 30 visual variants

### Chrome Compositions (v2.2.0+)
- **SectionStrip** — Desktop pill navigation strip
- **CommandPalette** — Keyboard-first command palette (⌘K)
- **Chameleon** — Adaptive theme controls (brand × world × age × sensory)
- **PageHeader** — Inner-page hero: eyebrow, gradient title, lede

All compositions are router-agnostic, token-driven, and exported from `@p31/design-core/compositions`.

## MCP Server

```bash
# Stdio transport (local IDE)
pnpm mcp

# Cloudflare Worker (HTTP)
cd workers/design-mcp && pnpm dev
```

### Available Tools (19)
| Category | Tools |
|----------|-------|
| Tokens | `list_tokens`, `search_tokens`, `resolve_token`, `list_tokens_dtc` |
| Components | `list_components`, `get_component`, `get_component_metadata`, `validate_component`, `generate_component`, `convert_component` |
| Recipes | `list_recipes`, `get_recipe` |
| CSS Audit | `audit_css`, `validate_parity` |
| Principles | `get_ui_principles`, `get_review_rules` |
| Brands | `resolve_brand` |

## Generation Pipeline

```bash
# Generate multi-framework artifacts from cli/tokens/components.yml
pnpm generate

# Outputs:
# - src/generated/           — React (.tsx + .test.tsx + .stories.tsx)
# - src/generated-astro/     — Astro components (.astro)
# - src/generated-html/      — HTML previews (.html)
# - src/generated-wc/        — Web Components (.wc.js + p31-tokens.css)
# - src/generated-html-snapshots/
# - src/generated-html-tokenized/
```

## Design Portal Integration

The design portal (`production/portals/design`) consumes design-core as a vendored tarball:

```bash
# In portal directory
pnpm sync:vendor    # Regenerates vendor tarball + auto-refreshes deps
pnpm typecheck      # Verify types
pnpm test           # Run portal tests
pnpm build          # Build for deploy
```

### Vendored Tarball Flow
1. Edit canonical `packages/design-core`
2. `pnpm sync:vendor` (regenerates `vendor/p31-design-core-2.2.0.tgz`)
3. `pnpm install` (auto-refreshes if tarball content changed via SHA512 manifest)
4. `pnpm typecheck && pnpm test && pnpm build`

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm typecheck` | TypeScript strict mode |
| `pnpm test` | Unit tests (31 contrast tests) |
| `pnpm gen:tokens` | Regenerate CSS, TS, DTCG token artifacts |
| `pnpm generate` | Regenerate multi-framework component artifacts |
| `pnpm convert` | Convert components between frameworks |
| `pnpm audit:components` | Scan monorepo for CSS class usage |
| `pnpm audit:semantic` | Scan for semantic CSS classes |
| `pnpm mcp` | Start stdio MCP server |
| `pnpm build` | TypeScript compilation |

## Exports

```json
{
  ".": "./src/index.ts",
  "./compositions": "./src/compositions/index.ts",
  "./css/all.css": "./src/css/all.css",
  "./css/chrome.css": "./src/css/chrome.css",
  "./mcp": "./src/mcp/server.ts",
  "./theming/theme-store": "./src/theming/theme-store.ts"
}
```

## Governance

- Token ownership: `@p31/design-core` maintainers
- Component lifecycle: propose → review → build → document → release → measure
- Deprecation: 3-month warning, `$deprecated` flag in DTCG JSON
- Semantic versioning: MAJOR.MINOR.PATCH

## Links

- Design portal: https://design.p31ca.org
- MCP server: https://mcp.p31ca.org
- W3C DTCG spec: https://design-tokens.github.io/community-group/format/1.0.0
- WCAG 2.2: https://www.w3.org/TR/WCAG22/