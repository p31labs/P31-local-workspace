# Deployment Runbook – Live Ecosystem

**Version:** 1.0 (draft)
**Date:** 2026-07-11

## 1. Prerequisites

- `wrangler` v4+ authenticated with Cloudflare
- `pnpm` or `npm` installed
- D1 database `love-ledger` (id: `592e3e2e-3203-4e0a-8342-9e85215ec8a6`)
- GitHub secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

## 2. Migration

```bash
cd /home/p31/P31-local-workspace/apps/phos/src/workers/love-ledger
npx wrangler d1 execute love-ledger --remote --file=migrations/008_pilot_registry.sql
```

## 3. Deploy Love-Ledger (with new endpoints)

```bash
cd /home/p31/P31-local-workspace/apps/phos/src/workers/love-ledger
npx wrangler deploy
```

## 4. Deploy Arcade Worker

```bash
cd /home/p31/P31-local-workspace/apps/arcade
npx wrangler deploy --env production
```

## 5. Run Backfill Script

```bash
cd /home/p31/P31-local-workspace
node scripts/backfill-pilots.js
```

## 6. Set Up GitHub Action

- Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to the repo secrets.
- Push the `.github/workflows/update-live-docs.yml` file.
- Test manually via `workflow_dispatch`.

## 7. Deploy Bonding Relay (with bridge)

```bash
cd /home/p31/P31-local-workspace/software/bonding
# Ensure LOVE_AUTH_SECRET is set
npx wrangler deploy
```

## 8. Deploy K4-cage (with topology endpoint)

```bash
cd /home/p31/P31-local-workspace/software/k4-cage
npx wrangler deploy
```

## 9. Deploy Spin-Mesh Logistics (with handover bridge)

```bash
cd /home/p31/P31-local-workspace/software/spin-mesh/logistics-do
# Ensure LOVE_AUTH_SECRET is set
npx wrangler deploy
```

## 10. Verify

- `arcade.p31ca.org` shows pilot cards.
- Live docs have updated tables (after Action runs).
- Bonding session mints LOVE.
- Barter handover records `barter_completion` events.
