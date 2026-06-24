# Deploy — p31ca (p31ca.org)

## Build Process

```bash
cd software/p31ca
pnpm install --frozen-lockfile
pnpm build              # outputs to dist/
```

Build runs: type check → lint → build. Verify locally with `pnpm preview`.

## Deploy via GitHub Actions

Push to `main` under `p31ca/**` triggers `.github/workflows/ci-p31ca.yml`:

1. **lint** — Type check
2. **test** — Vitest with coverage (thresholds: lines 60%, branches 50%, functions 60%)
3. **build** — `pnpm build`, uploads `dist/` as artifact
4. **deploy** — Runs on `main` only. Uses `cloudflare/wrangler-action@v3` to deploy `dist/` to Cloudflare Pages project `p31ca`.

## Manual Deploy (wrangler)

Requires Cloudflare API token with Pages edit permissions.

```bash
cd software/p31ca
pnpm build
npx wrangler pages deploy dist --project-name p31ca
```

## Domain Setup

| Domain | Cloudflare Pages Project | DNS |
|--------|--------------------------|-----|
| p31ca.org | p31ca | CNAME → p31ca.pages.dev |
| www.p31ca.org | p31ca | CNAME → p31ca.pages.dev |

Configure in Cloudflare Dashboard → Workers & Pages → p31ca → Custom domains.

## Environment Variables

Set in repo Settings → Secrets and variables → Actions:

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | Wrangler deploy auth |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |

For local development, copy `.env.master` from monorepo root or create `.env`:
```
PUBLIC_SITE_URL=https://p31ca.org
```

## Rollback Procedure

1. **Cloudflare Dashboard** → Workers & Pages → **p31ca** → **Deployments**
2. Find the last known-good production deployment
3. Click **...** → **Rollback to this deployment**
4. Wait 30s for edge propagation
5. Verify at https://p31ca.org/api/health

To roll back via CLI:
```bash
npx wrangler pages deployment list --project-name p31ca
npx wrangler pages rollback <deployment-id> --project-name p31ca
```
