# Deployment — Jitterbug Sierpinski Orchestrator

## Automated Deployment (Recommended)

```bash
cd /home/p31/P31-local-workspace/software
bash scripts/deploy-jitterbug.sh
```

The script handles everything idempotently:

- Builds all packages
- Provisions D1, R2, KV (creates if missing)
- Updates `wrangler.toml` with live IDs
- Applies D1 migrations (001–003) with duplicate-column handling
- Sets PSK secret
- Removes cron triggers (free plan limit)
- Deploys API Worker and PWA

## Manual Deployment (Step-by-Step)

### Prerequisites

- Node.js 20+, pnpm, and wrangler CLI authenticated
- Cloudflare account with D1, R2, and Durable Objects enabled

### 1. Install Dependencies

```bash
cd /home/p31/P31-local-workspace
pnpm install
```

### 2. Provision Resources

```bash
# D1 Database
wrangler d1 create jitterbug-db
wrangler d1 execute jitterbug-db --file=./migrations/001_initial.sql --remote
wrangler d1 execute jitterbug-db --file=./migrations/002_add_recursive_fields.sql --remote
wrangler d1 execute jitterbug-db --file=./migrations/003_add_ephemeralization.sql --remote

# R2 Bucket
wrangler r2 bucket create jitterbug-deliverables

# KV Namespace
wrangler kv namespace create jitterbug-status-cache
```

Update `software/packages/jitterbug-api/wrangler.toml` with the IDs.

### 3. Set Secrets

```bash
echo "your-psk" | wrangler secret put PSK
```

### 4. Deploy Worker

```bash
cd software/packages/jitterbug-api
pnpm run build
wrangler deploy
```

### 5. Deploy PWA

```bash
cd software/packages/jitterbug-pwa
VITE_API_URL=https://jitterbug-api.trimtab-signal.workers.dev pnpm run build
wrangler pages deploy dist --project-name jitterbug-pwa --branch production
```

## Verification

```bash
# Health check
curl -H "Authorization: Bearer your-psk" \
  https://jitterbug-api.trimtab-signal.workers.dev/health

# Submit a brain dump
curl -X POST https://jitterbug-api.trimtab-signal.workers.dev/brain-dump \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-psk" \
  -d '{"projectName":"Test","coreProblem":"Test","currentState":{"artifacts":[],"gaps":[],"blockers":[]},"constraints":[],"knownAssets":[],"openQuestions":[],"desiredEndState":{"description":"Test","targetStage":"fruit","measurableCriteria":[],"convergenceTarget":"Test"},"metadata":{"capturedAt":"2026-01-01T00:00:00Z","operator":"test","source":"api","tags":[]}}'
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| KV `expirationTtl` error | TTL must be ≥ 60 seconds (already fixed) |
| itty-router 500 error | Use `.fetch()` not `.handle()` (already fixed) |
| PWA 404 | Set production branch via API and redeploy |
| Cron trigger limit | Removed cron triggers; manual purge via `DBClient.purgeExpired()` |
| Test pool version mismatch | Upgrade `@cloudflare/vitest-pool-workers` to ≥ 0.18.0 |
