# @p31ca/design-core — Changelog

## 3.0.0 — 2026-09-24

### Breaking
- **Quantum Material color stance.** All design sources migrated from raw hex / rgba to OKLCH and
  `color-mix(in oklch, …)`. Canonical base neutrals shifted to the hue-270 quantum-material family
  (void/surface/surface2/text), matching the reference consumer `production/portals/workspace`.
- `scripts/token-audit.mjs` is now a hard gate: no `#hex` or `rgba()`/`rgb()` literals may exist in design
  sources (`src/css`, token sources, recipe data, theme data, generated component styles, manifest).
  Run `node scripts/token-audit.mjs` before any release.
- The W3C DTCG `manifest.json` and `tokens/tokens.json` carry `oklch()` color values (DTCG 2025.10 color
  module). Glass tokens use `oklch(L C H / α)` and `color-mix(in oklch, …)`.

### Migration
- Point consumers at the 3.0.0 tarball (`file:vendor/p31-design-core-3.0.0.tgz`). No runtime API changes;
  the change is visual + token-stance only. `pnpm gen:tokens` preserves OKLCH on regeneration.

## 2.2.0 — 2026-09-09

### Added
- **Storybook + Components Manifest** — `.storybook/main.ts` + `preview.ts` with `@storybook/react-vite`, `@storybook/addon-docs`, `@storybook/addon-a11y`, `@storybook/addon-mcp`, and `features: { componentsManifest: true }`. Canonical chrome/components stories live in `src/compositions/__stories__/` (one CSF per component). `pnpm storybook:build` emits `storybook-static/manifests/components.json` (41 documented components).
- **Agent-facing GenUI Catalog** — `scripts/storybook-to-catalog.mts` merges the Storybook manifest with canonical `COMPONENT_DEFS` into `src/genui/catalog.ts` (Zod-validated: `CatalogSchema`, `ComponentEntrySchema`) plus a `catalog.json` sidecar. 33 entries (15 canonical + 18 generated), each with props, tokens, variants, accessibility, AI guidance, and Storybook stories/snippets.
- **MCP Catalog Tools** — `component_catalog` (full catalog, optional category filter) and `search_catalog` (name/description/CSS class/category/tokens/guidance keyword search). `get_component_metadata` and `component_schema` now also return the matching `catalog` entry.
- **Chrome Compositions** — Four new router-agnostic compositions exported from `@p31ca/design-core/compositions`:
  - `SectionStrip` — Desktop pill navigation strip with `items` + `onSelect` callback
  - `CommandPalette` — Keyboard-first command palette (⌘K) with fuzzy search, keyboard nav, controlled `open`/`onClose`
  - `Chameleon` — Adaptive theme controls: brand × world × age × sensory modes, zero-reload token swaps via theme-store
  - `PageHeader` — Inner-page hero with eyebrow, gradient title, lede, and optional action cluster
- **Chrome CSS Grammar** — New `src/css/chrome.css` (imported via `all.css` and exported as `./css/chrome.css`) containing:
  - Section strip grammar (`.section-strip`, `.section-tab`)
  - Command palette grammar (`.cmdk-overlay`, `.cmdk-panel`, `.cmdk-input`, `.cmdk-list`, `.cmdk-item`, `.cmdk-trigger`)
  - Chameleon grammar (`.chameleon-trigger`, `.chameleon-panel`, `.brand-chip`, `.world-dot`, `.seg`, `.toggle`)
  - Page header grammar (`.page-header-route`, `.hero-eyebrow`, `.page-lede`, `.page-actions`)
  - Brand chip utility (`.brand-chip`)
- **MCP Tool Expansion** — 19 tools now available (up from 13):
  - Component tools: `list_components`, `get_component`, `get_component_metadata`, `validate_component`, `generate_component`, `convert_component`
  - Token tools: `list_tokens`, `search_tokens`, `resolve_token`, `list_tokens_dtc`, `resolve_brand`
  - CSS auditing: `audit_css`, `validate_parity`
  - Design principles: `get_ui_principles`, `get_review_rules`
  - Recipes: `list_recipes`, `get_recipe`
- **Brand Token Resolution** — `resolveBrandTokens(brand)` now available via MCP (`resolve_brand` tool) and bundled in worker data (`BRAND_TOKENS_RESOLVED`)
- **Multi-framework Generation** — Chrome compositions now generate to React (`.tsx`), Astro (`.astro`), Web Components (`.wc.js`), and HTML (`.html`) via the generator pipeline
- **Vendored Tarball Sync Fix** — `sync-vendor.mjs` now tracks tarball SHA512 and runs `pnpm update` on content change, eliminating "Already up to date" staleness

### Changed
- `all.css` now imports `chrome.css` (`@import './chrome.css';`)
- `package.json` exports now include `./css/chrome.css` and expanded composition exports
- Design portal `sync:vendor` now auto-refreshes dependencies on tarball content change
- Design portal test mock for `theme-store` now spreads real `THEME_TOKENS` to support Chameleon
- Worker `build.mjs` now bundles canonical `BRAND_TOKENS` and resolved brand tokens
- Worker `index.ts` now uses canonical `COMPONENT_DEFS` for all component tools

### Fixed
- Portal `pnpm install` staleness when vendored tarball content changed (sync-vendor now auto-refreshes)
- Chameleon `swatch()` undefined crash in tests (mock now provides real `THEME_TOKENS`)
- Portal `sync:vendor` idempotency — only refreshes when tarball SHA512 changes

---

## 2.1.0 — 2026-07-19

### Added
- `./css/link-glow.css` — new named export for the canonical `link-glow` hover
  utility. Import directly: `@import '@p31ca/design-core/css/link-glow.css';`
  Also included in `all.css` (no breaking change).

### Changed
- `all.css` now includes `link-glow.css` in its barrel import list.

---

## 2.0.0

Initial stable release of the canonical P31 design token system
(CSS custom properties, glass, motion, typography, size-class, ambient,
container, starfield, crisis-overlay, device-class hooks).
