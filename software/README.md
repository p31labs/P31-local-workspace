# software — Active engineering tree

Install **from the repository root** (single workspace — see root `pnpm-workspace.yaml`):

```bash
cd ..   # repo root
pnpm install
```

Then from repo root, or with `pnpm --dir software`:

```bash
pnpm --dir software run build
pnpm --dir software run test
```

**Companion checkout — [bonding-soup](https://github.com/p31labs/bonding-soup) (recommended):** local **`:3131` command center**, **`npm run startup`**, and **Chromebook / iPhone** operator paths live in that repo, not here. See the Andromeda root **[CONTRIBUTING.md](../CONTRIBUTING.md)** section *Companion repo — bonding-soup*.

Use project-local scripts per package as documented in each project README.

**Corporate + open print suite (letterhead, memos, watermarks, Forge):** from repo root, `docs/corporate/` (hub `README.md`); **live** on [p31ca.org/open-doc-suite.html](https://p31ca.org/open-doc-suite.html) (`/doc-suite` on the hub). Regenerate `brand-tokens.json`: `pnpm --dir software/p31-forge run brand:tokens` from the Andromeda root.

**Controlled work packages (scope + WBS):**

- **Ecosystem hub (p31ca.org):** `p31ca/docs/CONTROLLED-WORK-PACKAGE-ECOSYSTEM-INTEGRATION.md` — `CWP-P31-ECO-2026-01`
- **SUPER-CENTAUR / mesh handoff:** `integration-handoff/CONTROLLED-WORK-PACKAGE-SUPER-CENTAUR.md` — `CWP-P31-SC-2026-01`
- **Monetary / revenue pipeline (Stripe, webhooks, durable record, export):** `docs/CONTROLLED-WORK-PACKAGE-MONETARY-PIPELINE.md` — `CWP-P31-MAP-2026-01`
- **Ko-fi vs Stripe (ADR):** `docs/adr/MAP-KOFI-001.md`
- **Multi-agent (touch boundaries):** `p31ca/docs/PARALLEL_AGENT_COORDINATION.md`

## Applications and sites

Ecosystem map (nonprofit vs technical hub vs Workers): [`../docs/SITE_MAP_AND_OWNERSHIP.md`](../docs/SITE_MAP_AND_OWNERSHIP.md).

| Project | Stack | Notes |
|---------|--------|--------|
| `bonding/` | Vite + React + R3F | BONDING game; Vitest. |
| `p31ca/` | Astro | p31ca.org technical hub — see `p31ca/README.md`. |
| `p31-hearing-ops/` | Vite + React PWA | ops.p31ca.org — Pages project **`p31-hearing-ops`** (never `p31ca`). |
| `spaceship-earth/` | Vite + R3F | Dashboard. |
| `frontend/` | Vite | Legacy/aux UI. |
| `sovereign-command-center/` | Next | Command UI (check env). |
| `spoon-calculator/` | Vite | Utility. |
| `p31-delta-hiring/` | Vite + TS | Delta hiring: role packets, wcds, help, search, proof JSON. `pnpm run check` in-package; `pnpm run check:p31-delta-hiring` from `software`. |
| `docs/` | Astro | Internal docs site if used. |

## Cloudflare Workers / edge

| Path | Role |
|------|------|
| `cloudflare-worker/` | Multiple Workers (command-center, bouncer, social-drop, etc.). |
| `k4-cage/` | K₄ graph Worker (canonical). |
| `p31-forge/` | Forge + Worker + crons. |
| `p31-google-bridge/` | Google Workspace OAuth (Calendar readonly probe); see `README` + `docs/integrations/GOOGLE-WORKSPACE.md`. |
| `telemetry-worker/` | Telemetry. |
| `donate-api/` | Donation API. |
| `kenosis-mesh/` | Mesh / edge. |
| `p31-cortex/` | Cortex worker. |

## Shared packages

`packages/` — `shared`, `game-engine`, `k4-mesh-core`, `node-zero`, `love-ledger`, `sovereign-sdk`, `quantum-core`, etc.

## Extensions

`extensions/` — VS Code / tooling extensions (`p31ca` **folder** = npm `p31-centaur-ede` Centaur EDE; progressive disclosure, cognitive shield, cockpit, spoon gauge).

## Other

| Path | Role |
|------|------|
| `discord/p31-bot/` | Discord bot. |
| `workers/` | Additional worker sources (see each folder). |

For the **full monorepo** (research, firmware, legal handoff), see `docs/REPOSITORY_LAYOUT.md`.
