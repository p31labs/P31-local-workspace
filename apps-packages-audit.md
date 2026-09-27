# Full Audit & Inventory: apps/ and packages/

**Workspace:** `/home/p31/P31-local-workspace` (P31 Andromeda monorepo)
**Audit date:** 2026-07-30
**Scope:** `apps/`, `packages/`, plus related workspace-level structures

---

## 1. Workspace Overview

| Attribute | Value |
|-----------|-------|
| Name | p31-andromeda |
| Version | 1.0.0 |
| License | AGPL-3.0 |
| Package manager | pnpm@10.32.1 |
| Node engine | >=20.0.0 |
| Description | P31 Labs monorepo — software, research tooling, and infrastructure |
| Root git repo | Yes (`.git` at workspace root) |
| Build system | Turbo (`turbo.json`) |
| Workspace config | `pnpm-workspace.yaml` |

**pnpm-workspace.yaml packages:**
- `apps/*`
- `workers/*` (66 worker directories at root level)
- `packages/*`
- `cli` (root-level CLI tool)

---

## 2. APPS Directory (`apps/`)

### 2.1 Top-level Summary

| Metric | Value |
|--------|-------|
| Total items | 31 entries (27 apps + 3 special dirs + 1 symlink + 3 md files) |
| Total disk usage (incl. node_modules) | ~3.0 GB (phos dominates at 2.9 GB) |
| Total non-node_modules files | ~8,200 files |
| Symlinks | 1 broken (`design-tokens` → `/home/p31/P31-local-workspace/software/design-tokens` — target missing) |
| Git repos (embedded) | 1 (`counterscale`) |

### 2.2 App Inventory (alphabetical)

| App | Size on disk | Files (excl. node_modules) | Package name | Has package.json | Framework | Key technologies |
|-----|-------------|---------------------------|--------------|-----------------|-----------|-----------------|
| `_template` | 1.8 MB | 50 | `_template` | Yes | Astro | Astro, Cloudflare Workers |
| `a2ui-renderer` | 108 KB | 4 | — | No | Static HTML | HTML, SVG, deploy config |
| `agent-demo` | 44 KB | 4 | — | No (wrangler only) | Wrangler | Cloudflare Workers |
| `app-builder` | 68 KB | 7 | `p31-app-builder` | Yes | Wrangler | Cloudflare Workers, TypeScript |
| `arcade` | 3.3 MB | 75 | `arcade` | Yes | Astro + Wrangler | Astro, Cloudflare Workers |
| `archive` | 48 KB | 1 | — | No | Static | Single HTML file |
| `auth` | 232 KB | 12 | `@p31/auth` | Yes | Wrangler | Cloudflare Workers, TypeScript, Vitest, SQLite |
| `bash` | 1.9 MB | 52 | `@p31/bash` | Yes | Astro | Astro, Cloudflare Workers |
| `bonding` | 2.3 MB | 70 | `bonding` | Yes | Astro + Wrangler | Astro, Cloudflare Workers, Vitest |
| `counterscale` | 7.8 MB | 278 | _(monorepo)_ | Yes (root + 4 sub-pkgs) | Multi | Astro, React, Vite, Vitest, pnpm workspaces, Turbo, Husky, ESLint |
| `design-hub` | 0 KB | 0 | — | No | Empty | Only `.wrangler/` dir exists |
| `design-tokens` | — | — | _(symlink)_ | N/A | Broken symlink | Points to missing `/home/p31/P31-local-workspace/software/design-tokens` |
| `docs` | 920 KB | 9 | `p31-docs` | Yes | Astro | Astro, Cloudflare Workers |
| `game-builder` | 36 KB | 3 | — | No | Wrangler | Minimal — wrangler.toml + p31-integration.md |
| `gateway` | 232 KB | 16 | `gateway` | Yes | Wrangler | Cloudflare Workers, TypeScript, Vitest, SQLite migrations |
| `growth-dashboard` | 944 KB | 26 | `growth-dashboard` | Yes | Vite + Wrangler | React, TypeScript, Vitest |
| `k4-cage` | 248 KB | 39 | `k4-cage` | Yes | Vite + Wrangler | React/TSX, Vitest |
| `passport-www` | 236 KB | 39 | `passport-www` | Yes | Vite + Wrangler | React, TypeScript, Vitest |
| `p31ca` | 211 MB | 1,113 | `p31ca` | Yes | Astro + Wrangler | Astro, Cloudflare Pages, React, Vitest, Playwright, 4 workers |
| `phos` | 2.9 GB | 7,369 | `phos` | Yes | Astro + Tauri + Wrangler | Astro, Tauri (Rust desktop), Cloudflare Workers, Vitest |
| `phosphorus31` | 6.2 MB | 162 | `planetary-planet` | Yes | Astro + Wrangler | Astro, Cloudflare Pages |
| `status` | 168 KB | 10 | `status` | Yes | Wrangler | Cloudflare Workers, TypeScript |
| `storybook` | 4 KB | 1 | — | No | Minimal | Only `wrangler.toml` exists |
| `tetra-ops` | 2.3 MB | 91 | `tetra-ops` | Yes | Astro + Wrangler | Astro, Cloudflare Workers, Vitest, Playwright |
| `website-builder` | 32 KB | 3 | — | No | Wrangler | Minimal — wrangler.toml + p31-integration.md |
| `willow` | 1.4 MB | 102 | `willow` | Yes | Astro + Wrangler | Astro, Cloudflare Pages, Vitest, Playwright |
| `willow-preview` | 820 KB | 12 | `willow-preview` | Yes | Vite + Wrangler | React, TypeScript |

### 2.3 App Categories

**Category A — Full Astro + Wrangler Apps (deployed to Cloudflare Pages/Workers):**
`_template`, `arcade`, `bash`, `bonding`, `docs`, `phosphorus31`, `p31ca`, `tetra-ops`, `willow`

**Category B — Vite/React + Wrangler Apps:**
`growth-dashboard`, `k4-cage`, `passport-www`, `willow-preview`

**Category C — Wrangler Worker-only Apps:**
`app-builder`, `agent-demo`, `auth`, `gateway`, `status`, `storybook`, `game-builder`, `website-builder`

**Category D — Special/Meta:**
`counterscale` (pnpm monorepo with 4 sub-packages), `phos` (Astro + Tauri desktop + Workers), `design-hub` (empty placeholder), `design-tokens` (broken symlink), `archive` (static HTML), `a2ui-renderer` (static deploy config)

### 2.4 Notable Apps

- **phos** (2.9 GB): Largest by far. Includes a Tauri desktop app (`src-tauri/`) with Rust build artifacts in `target/` directories (multiple copies from repeated builds). The actual source code is ~7,369 files but dist/build artifacts inflate the size.
- **p31ca** (211 MB): Second largest. A full Astro site with 3 Cloudflare Workers (fhir, glass-box-ws, sync, passkey) and extensive Playwright e2e tests.
- **counterscale** (7.8 MB): A standalone pnpm monorepo embedded within `apps/`. Contains 4 sub-packages: `cli`, `eslint-config`, `server`, `tracker`. Has its own `.git`, `pnpm-workspace.yaml`, `turbo.json`, `pnpm-lock.yaml`. Well-structured with comprehensive testing (unit + integration + e2e).

---

## 3. PACKAGES Directory (`packages/`)

### 3.1 Top-level Summary

| Metric | Value |
|--------|-------|
| Total items | 24 packages + 1 DESIGN_SYSTEM.md |
| Total disk usage (incl. node_modules) | ~22 MB |
| Total non-node_modules files | ~1,720 files |
| Symlinks | None |
| Git repos (embedded) | 2 (`forge-sdk`, `mcp-membrane`) |
| Broken structures | None |

### 3.2 Package Inventory (alphabetical)

| Package | Size | Files (excl. node_modules) | Package name (npm) | Version | Type | Scripts | Purpose |
|---------|------|---------------------------|-------------------|---------|------|---------|---------|
| `bonding` | 8.5 MB / 307 files | 307 | `@p31/bonding` | 0.1.0 | module | 9 scripts | Full Astro + Wrangler app with bonding functionality, workers, hud component |
| `design-core` | 1.3 MB / 202 files | 202 | `@p31ca/design-core` | 2.1.0 | module | _(none listed)_ | Design token system, Astro components, CSS, TS/TSX source |
| `design-validator` | 72 KB / 6 files | 6 | `@p31/design-validator` | 0.1.0 | module | 3 scripts | Validation utility for design tokens |
| `forge-sdk` | 380 KB / 35 files | 35 | `@p31ca/forge-sdk` | 1.0.0 | module | 3 scripts | SDK for forging/building p31 artifacts |
| `game-engine` | 536 KB / 76 files | 76 | `@p31ca/game-engine` | 0.2.0-alpha.0 | module | 3 scripts | Game engine core library |
| `game-generator` | 44 KB / 6 files | 6 | `@p31/game-generator` | 0.1.0-alpha.0 | module | _(none)_ | Game generation utilities |
| `gamification` | 88 KB / 10 files | 10 | `@p31ca/gamification` | 1.0.0 | module | _(none)_ | Gamification logic |
| `interface-generator` | 236 KB / 28 files | 28 | `@p31/interface-generator` | 0.1.0 | module | 2 scripts | UI interface generation |
| `mcp-justice` | 28 KB / 2 files | 2 | `@p31ca/mcp-justice` | 1.0.0 | module | 1 script | MCP (Model Context Protocol) server — public package |
| `mcp-membrane` | 392 KB / 34 files | 34 | `@p31ca/mcp-membrane` | 1.0.0 | module | 3 scripts | MCP membrane/bridge |
| `p31-mcp` | 24 KB / 2 files | 2 | `@p31ca/mcp-vibe` | 1.0.0 | module | 1 script | MCP server — public package |
| `quantum-core` | 104 KB / 18 files | 18 | `@p31ca/quantum-core` | 0.1.0 | module | _(none)_ | Quantum computing core library |
| `shared` | 3.2 MB / 580 files | 580 | `@p31/shared` | 0.0.1 | module | 8 scripts | Shared utilities, most files of any package |
| `skin-apex` | 8 KB / 2 files | 2 | `@p31/skin-apex` | 1.0.0 | module | _(none)_ | CSS skin/theming for Apex |
| `skin-phos` | 8 KB / 2 files | 2 | `@p31/skin-phos` | 1.0.0 | module | _(none)_ | CSS skin/theming for Phos |
| `skin-system` | 28 KB / 4 files | 4 | `@p31/skin-system` | 1.0.0 | module | _(none)_ | CSS skin/theming system |
| `skin-tetra` | 8 KB / 2 files | 2 | `@p31/skin-tetra` | 1.0.0 | module | _(none)_ | CSS skin/theming for Tetra |
| `skin-willow` | 12 KB / 3 files | 3 | `@p31/skin-willow` | 1.0.0 | module | _(none)_ | CSS skin/theming for Willow |
| `sovereign` | 48 KB / 8 files | 8 | `@p31/sovereign` | 0.0.2 | module | _(none)_ | Sovereign infrastructure |
| `spaceship-earth` | 4.5 MB / 196 files | 196 | `@p31/spaceship-earth` | 0.0.1 | module | 4 scripts | Full Astro app with webgpu, workers, landing page |
| `ui` | 3.3 MB / 103 files | 103 | `@p31ca/ui` | 1.3.0 | module | 2 scripts | Component library (main UI package), Astro components |
| `ui-mcp` | 60 KB / 7 files | 7 | `@p31/ui-mcp` | 0.1.0 | module | 2 scripts | UI MCP bridge |
| `vibe-sdk` | 40 KB / 4 files | 4 | `@p31ca/vibe-sdk` | 1.0.0 | module | _(none)_ | Public SDK package |

### 3.3 Package Categories

**UI/Design System (core):**
- `ui` (@p31ca/ui) — v1.3.0 — 103 files, Astro components
- `design-core` (@p31ca/design-core) — v2.1.0 — 202 files, design tokens & CSS
- `design-validator` (@p31/design-validator) — v0.1.0 — 6 files, validation
- `skin-*` (5 packages) — per-app theming CSS

**MCP (Model Context Protocol) Servers:**
- `mcp-justice` (@p31ca/mcp-justice) — public, v1.0.0
- `p31-mcp` (@p31ca/mcp-vibe) — public, v1.0.0
- `mcp-membrane` (@p31ca/mcp-membrane) — v1.0.0
- `ui-mcp` (@p31/ui-mcp) — v0.1.0

**SDK/Build Tools:**
- `forge-sdk` (@p31ca/forge-sdk) — v1.0.0 — build/forge utilities
- `vibe-sdk` (@p31ca/vibe-sdk) — v1.0.0 — public SDK
- `interface-generator` (@p31/interface-generator) — v0.1.0
- `game-generator` (@p31/game-generator) — v0.1.0-alpha.0

**Game/Entertainment:**
- `game-engine` (@p31ca/game-engine) — v0.2.0-alpha.0
- `gamification` (@p31ca/gamification) — v1.0.0
- `spaceship-earth` (@p31/spaceship-earth) — v0.0.1

**Utility/Infrastructure:**
- `shared` (@p31/shared) — v0.0.1 — 580 files, most files in any package
- `quantum-core` (@p31ca/quantum-core) — v0.1.0
- `sovereign` (@p31/sovereign) — v0.0.2
- `bonding` (@p31/bonding) — v0.1.0 (also a full app)

**Skin/Theming (CSS-only):**
`skin-apex`, `skin-phos`, `skin-system`, `skin-tetra`, `skin-willow` — all CSS/SCSS packages with no scripts, no dependencies, 2-4 files each.

---

## 4. Related Workspace Structures

### 4.1 `workers/` Directory (root level)

66 worker directories referenced in `pnpm-workspace.yaml`. Notable ones:
- `command-center` (49 files, 916 KB)
- `creation-accountant` (495 files, 82 MB — largest)
- `personal-swarm` (33 files)
- `design-mcp` (24 files, 206 MB)
- `intent-resolver` (24 files)
- `ledger-bridge` (17 files)
- `federation-bridge` (15 files)
- `p31-mcp-server` (also exists as `p31-mcp` in packages/)

### 4.2 Root-Level `cli/` Directory

- Package: `andromeda-cli` v1.1.2
- 53 files
- Described as "Sovereign, agent-native CLI for the P31 ecosystem"
- Depends on `@p31ca/design-core`, `@p31/design-validator`, `@p31ca/quantum-core`, `@p31/interface-generator` (all workspace packages)
- Provides TUI (blessed), MCP server, and `--agent` JSON mode

### 4.3 Other Root-Level Directories
- `e2e/` — Playwright e2e test suite (7 files)
- `production/` — Empty except for `production/shared/`
- `agents/` — Empty directory

---

## 5. Key Findings & Issues

### 5.1 Broken Symlink
- `apps/design-tokens` → `/home/p31/P31-local-workspace/software/design-tokens` (target does not exist; `software/` directory is missing)

### 5.2 Empty/Placeholder Apps
- `design-hub/` — 0 files, only empty `.wrangler/` directory
- `storybook/` — 1 file (`wrangler.toml` only)
- `archive/` — 1 file (single HTML)
- `game-builder/`, `website-builder/`, `app-builder/` — minimal wrangler setups with `p31-integration.md`

### 5.3 Phos Size Anomaly
- `phos/` at 2.9 GB is overwhelmingly build artifacts from `src-tauri/target/` (multiple Rust build copies). The actual source is ~7,369 files totaling a few MB.

### 5.4 Duplicate/Alternative Files
- Several apps have both `index.html` and `index.html.bak` (p31ca, phosphorus31, phos)
- `p31ca/index1.html` exists alongside `index.html`
- `README (1).md` at workspace root suggests a merge conflict or duplicate

### 5.5 Version Inconsistencies
- `bonding` app (in `apps/`) has `bonding` as package name, while `packages/bonding` uses `@p31/bonding`
- `phos` app is `phos` v2.0.0; `phos/worker-ai-proxy` is a separate worker package
- Skin packages all use `@p31/skin-*` naming but have no build scripts or dependencies

### 5.6 Monorepo Structure
- `counterscale` in `apps/` is a self-contained monorepo (its own `pnpm-workspace.yaml`, `turbo.json`, `pnpm-lock.yaml`) nested inside the main workspace
- The main workspace `pnpm-workspace.yaml` also references `workers/*` at root level (66 dirs not counted in `apps/` or `packages/`)

### 5.7 Public vs Private Packages
- Public (publishable): `mcp-justice`, `p31-mcp` (both v1.0.0, name `@p31/mcp-*`), `vibe-sdk`
- All others are `private: true`

### 5.8 Build Systems Used
- **Astro** — 10+ apps (`_template`, `arcade`, `bash`, `bonding`, `docs`, `phosphorus31`, `p31ca`, `phos`, `tetra-ops`, `willow`, `spaceship-earth` in packages)
- **Vite** — `growth-dashboard`, `k4-cage`, `passport-www`, `willow-preview`, `tetra-ops`
- **Wrangler-only** — `auth`, `gateway`, `status`, `agent-demo`, `app-builder`, `game-builder`, `website-builder`
- **Tauri (Rust)** — `phos` desktop app
- **pnpm workspaces + Turbo** — `counterscale` monorepo

---

## 6. File Type Summary (across both dirs, excluding node_modules/dist)

| Extension | Category | Count (approx) |
|-----------|----------|----------------|
| `.ts` / `.tsx` | Source code | ~1,200 |
| `.js` / `.mjs` | JavaScript/ESM | ~300 |
| `.json` | Config/data | ~250 |
| `.html` | Templates/pages | ~200 |
| `.md` | Documentation | ~150 |
| `.css` | Styles | ~80 |
| `.toml` | Config (wrangler, etc.) | ~50 |
| `.astro` | Astro components | ~40 |
| `.sql` | Database schemas | ~8 |
| `.yml` / `.yaml` | CI/config | ~20 |

