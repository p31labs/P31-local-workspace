# Spaceship Earth Deployment Guide

**Document ID:** P31-SE-DEPL-001 | **Version:** 1.2.0 | **Last Updated:** 2026-08-11

## Overview

This guide covers production deployment of the Spaceship Earth PWA to
Cloudflare Pages (static frontend) and Cloudflare Workers (`spaceship-relay`
relay + telemetry), including the CI/CD pipeline and post-deploy verification.

## Prerequisites

### System Requirements

- Node.js 22+ and pnpm 9+
- Git access to the repository
- Cloudflare account with Wrangler CLI authenticated (`wrangler whoami`)
- Playwright for the E2E verify suite (`NODE_PATH=/home/p31/node_modules`)

### Required Secrets

| Secret | Purpose | Where |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Pages + Workers deploy | GitHub Actions secrets |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account | GitHub Actions secrets |

## 1. Building

### 1.1 Install & Build

```bash
cd /home/p31/P31-local-workspace
pnpm install

pnpm --filter @p31/spaceship-earth build
# → tsc --noEmit (no errors) + vite build → packages/spaceship-earth/dist/
```

### 1.2 Verify Build Output

- `dist/` contains `index.html`, hashed JS/CSS assets, `sw.js` (Workbox).
- Run the unit suite (193 tests) before shipping:

```bash
pnpm --filter @p31/spaceship-earth test
```

## 2. Deploying

### 2.1 Pages (Static Frontend)

```bash
cd packages/spaceship-earth
pnpm dlx wrangler pages deploy dist --project-name=spaceship-earth --branch=main
```

- Production alias: **https://spaceship-earth.pages.dev**
- Per-deploy URL: `https://<deploy-hash>.spaceship-earth.pages.dev`
- `public/_headers` carries the CSP / HSTS / Permissions-Policy headers
  (see `WCD-30-SECURITY-REPORT.md`).

### 2.2 Worker (Relay + Telemetry)

```bash
cd packages/spaceship-earth
pnpm dlx wrangler deploy --name=spaceship-relay
```

- Requires the `SPACESHIP_TELEMETRY` KV namespace binding (see `wrangler.toml`).

## 3. CI/CD Pipeline

`.github/workflows/spaceship-earth.yml` triggers on pushes touching
`packages/spaceship-earth/**` (and `workflow_dispatch`):

1. `actions/checkout@v4`
2. `actions/setup-node@v4` (Node 22) + `corepack enable`
3. `pnpm install`
4. `pnpm --filter @p31/spaceship-earth run build`
5. `wrangler pages deploy` via the `wrangler-run` composite action
   (requires `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`)

Deploys to the **main** branch (production) only; preview deployments are
created for other branches automatically by Pages.

## 4. Post-Deployment Verification

### 4.1 HTTP Checks

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://spaceship-earth.pages.dev
# 200
curl -s https://spaceship-earth.pages.dev/ | grep -o '<title>[^<]*</title>'
# <title>Spaceship Earth — P31 Labs</title>
```

### 4.2 Verify Suite (E2E)

```bash
cd packages/spaceship-earth
NODE_PATH=/home/p31/node_modules node scripts/verify-ship.cjs
# Sections A–G all green against the live deploy
```

### 4.3 Manual Smoke Test

1. Open https://spaceship-earth.pages.dev
2. Rotate the dome; click a dome face (selects the port, DataCard appears).
3. Toggle **Bucky** in the DataControls panel — full-screen Dymaxion net
   renders with 320 face circles. Click a circle (selection mirrors the 3D
   dome), press **Escape** to return.
4. Load a dataset via DatasetPanel; verify Legend / TimeControls update and
   face colors change on both the dome and the net.
5. PWA install prompt appears; offline reload serves the shell from `sw.js`.

## 5. Environment Variables

| Variable | Scope | Purpose |
|---|---|---|
| `VITE_RELAY_URL` | Build (optional) | WebSocket relay endpoint |
| `VITE_LLM_KEY` | Build (optional) | LLM API key |

All relay features degrade gracefully when `VITE_RELAY_URL` is absent.

## 6. Rollback

1. **Pages:** `wrangler pages deployment list --project-name spaceship-earth`,
   then re-promote a previous successful deployment to the main branch.
2. **Worker:** `wrangler deploy --name spaceship-relay` a prior known-good
   commit after `git checkout <sha>`.

## 7. Troubleshooting

| Issue | Resolution |
|---|---|
| `wrangler whoami` shows missing scopes | Re-run `wrangler login` |
| Build fails with Rolldown/PWA warnings | Non-fatal (plugin warnings); verify `dist/` produced |
| Pages deploy ignores `wrangler.toml` | Expected — `wrangler.toml` is Worker config; Pages needs `pages_build_output_dir` if unified |
| Verify suite hits stale deploy | Redeploy; per-deploy hash URLs go stale once superseded |
| `_headers` not applied | Confirm `public/_headers` uploaded in the deploy output |

## Next Steps

1. Keep `verify-ship.cjs` green against every production deploy.
2. Extend DatasetPanel source connectors (HAPI/SDG live pulls).
3. Wire `neo_pixel_control` MCP tool to physical LED controllers.
