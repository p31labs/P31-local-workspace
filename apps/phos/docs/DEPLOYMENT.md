# Deployment Guide

## Prerequisites

- Cloudflare account with Workers subscription
- Wrangler CLI installed: `npm install -g wrangler`
- D1 databases created (see below)

## D1 Database Setup

```bash
# Create databases
npx wrangler d1 create love-ledger
npx wrangler d1 create contracts-db
npx wrangler d1 create governance-db

# Apply migrations
npx wrangler d1 execute love-ledger --remote --file=src/workers/love-ledger/migrations/001_initial.sql
npx wrangler d1 execute contracts-db --remote --file=src/workers/contract-engine/migrations/001_contracts.sql
npx wrangler d1 execute governance-db --remote --file=src/workers/governance-engine/migrations/001_initial.sql
```

## Deploy Workers

```bash
# Deploy love-ledger
cd src/workers/love-ledger && npx wrangler deploy

# Deploy contract-engine
cd ../contract-engine && npx wrangler deploy

# Deploy governance-engine
cd ../governance-engine && npx wrangler deploy
```

## Verify Deployment

```bash
# Health checks
curl https://love-ledger.trimtab-signal.workers.dev/health
curl https://contract-engine.trimtab-signal.workers.dev/health
curl https://governance-engine.trimtab-signal.workers.dev/health

# Signature enforcement test (expected: 401 Unauthorized)
curl -X POST https://governance-engine.trimtab-signal.workers.dev/vote \
  -H "Content-Type: application/json" \
  -d '{"proposalId":"test","voterDid":"did:key:test","choice":"for"}'
```

## Database IDs (production)

| Database | ID |
|----------|-----|
| love-ledger | `592e3e2e-3203-4e0a-8342-9e85215ec8a6` |
| contracts-db | `4d163051-9b5b-4c6c-a780-d2f149c9726b` |
| governance-db | `f05c8f18-a419-440c-a4e4-fe7da18dd7ae` |
