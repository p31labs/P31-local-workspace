# DEPLOY — bonding

## Build

```bash
npm run build
```

Output goes to `dist/`. The build is a Vite + React SPA compiled to static assets for Cloudflare Pages.

## Deploy via CI

The bonding CI pipeline is defined in `.github/workflows/bonding.yml`. It runs on push to `main`:

1. `npm ci`
2. `npm run build`
3. `npx wrangler pages deploy dist/ --project-name=bonding`

## Cloudflare Pages Project

- **Project name:** `bonding`
- **Production branch:** `main`
- **Build command:** `npm run build`
- **Build output:** `dist/`
- **Dashboard:** https://dash.cloudflare.com -> Workers & Pages -> bonding

## Domain

- **Custom domain:** `bonding.p31ca.org`
- DNS managed via Cloudflare. CNAME `bonding.p31ca.org` -> `bonding.pages.dev`.

## Environment Variables

Set in Cloudflare Pages dashboard under `bonding` -> Settings -> Environment variables:

| Variable | Description |
|----------|-------------|
| `NODE_VERSION` | `20` |
| `NPM_VERSION` | `10` |

Secrets are managed via Cloudflare Pages encrypted environment variables.

## Rollback

1. `git revert HEAD` on the offending commit
2. Push to `main` — CI picks up automatically
3. To roll back to a specific deploy: Cloudflare Pages dashboard -> `bonding` -> `Deployments` -> select deploy -> `Rollback to this deploy`
