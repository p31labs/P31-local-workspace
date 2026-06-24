# P31 Software — Setup Guide

**Date:** 2026-06-21  
**Purpose:** Single source of truth for setting up the P31 software monorepo

---

## Architecture Overview

The `software/` directory is a pnpm workspace monorepo containing:

| Layer | Tech | Location |
|-------|------|----------|
| **Web apps** | Astro, Vite + React | `p31ca/`, `bonding/`, `spaceship-earth/` |
| **Shared packages** | TypeScript | `packages/shared/`, `packages/*` |
| **Cloudflare Workers** | TypeScript/JS | `cloudflare-worker/`, `donate-api/`, `telemetry-worker/`, etc. |
| **Documentation** | Astro (Starlight) | `docs/` |
| **Scripts** | Node.js | `scripts/` |

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 10 (`npm install -g pnpm@10`)
- Git

### Setup

```bash
cd software
pnpm install
pnpm run build
```

### Development

```bash
# Start p31ca dev server
cd p31ca && pnpm run dev

# Start bonding dev server
cd bonding && pnpm run dev

# Run tests
pnpm run test

# Run type checking
pnpm run typecheck
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm run lint` | Run ESLint across all packages |
| `pnpm run typecheck` | TypeScript type checking across workspace |
| `pnpm run test` | Run all test suites |
| `pnpm run build` | Build all packages |
| `pnpm run convergence:run` | Run convergence CLI (interactive) |
| `pnpm run convergence:run:week` | Run all convergence weeks |
| `pnpm run dev` | Start all dev servers in parallel |

---

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `ci.yml` | Push/PR to main | Lint, typecheck, test (shared, bonding, p31ca, convergence), build, deploy |
| `nightly-qsuite.yml` | Daily 2AM UTC | Full test suite + smoke tests |
| `deploy-spaceship.yml` | Push to main (spaceship paths) | Build + deploy spaceship-earth |
| `grant-radar.yml` | Weekly Monday | Scans grant deadline docs |
| `release.yml` | Tag push `v*` | Creates GitHub release |
| `social-dispatch.yml` | Manual dispatch | Social content deployment |

---

## Key Documentation

- [Application README](README.md) — Product and project overview
- [p31ca README](p31ca/README.md) — p31ca.org technical hub
- [CONTRIBUTING.md](CONTRIBUTING.md) — Contribution guidelines
- [Monorepo docs](docs/) — ADRs, specs, architecture docs
- [Convergence tests](p31ca/src/phos-v2/convergence/) — Multi-phase integration tests
