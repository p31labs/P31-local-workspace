# software — Active engineering tree

Install **from the `software/` directory**:

```bash
cd software
pnpm install
pnpm run build
```

## Project map

| Project | Stack | Description |
|---------|-------|-------------|
| `p31ca/` | Astro + React | Technical hub at p31ca.org |
| `bonding/` | Vite + React + R3F | BONDING chemistry game |
| `spaceship-earth/` | Vite + R3F | Dashboard |
| `packages/shared/` | TypeScript | Shared utilities, types, trust, crypto |
| `cloudflare-worker/` | TypeScript/JS | Multiple edge Workers |
| `p31-forge/` | Node.js | Document generation engine |
| `p31-cortex/` | Node.js | Cortex agent worker |
| `p31-delta-hiring/` | Vite + TS | Delta hiring portal |
| `p31-hearing-ops/` | Vite + React PWA | Hearing operations (ops.p31ca.org) |
| `donate-api/` | TypeScript | Donation API worker |
| `telemetry-worker/` | TypeScript | Telemetry worker |
| `k4-cage/` | TypeScript | K₄ graph Worker |
| `docs/` | Astro | Internal documentation site |
| `scripts/` | Node.js | Build, verification, and utility scripts |

## Commands

```bash
pnpm run dev            # Start all dev servers
pnpm run test           # Run all tests
pnpm run typecheck      # TypeScript checks
pnpm run lint           # ESLint
pnpm run convergence:run  # Convergence test CLI
pnpm run build          # Build all packages
```

## Architecture docs

- [SITE_MAP_AND_OWNERSHIP.md](../docs/SITE_MAP_AND_OWNERSHIP.md) — Full ecosystem map
- [SETUP.md](SETUP.md) — Setup guide
- [p31ca README](p31ca/README.md) — Technical hub details
- [docs/](docs/) — ADRs, specs, BROS trust architecture

## Pre-commit hooks

Git hooks are in `.githooks/`. Install:

```bash
git config core.hooksPath .githooks
```

This runs ESLint and TypeScript checks on staged files before each commit.
