# EPCP Command Center — Deployment Guide

## Prerequisites

- [wrangler](https://developers.cloudflare.com/workers/wrangler/) ≥ 4.x authenticated
- Node.js ≥ 18
- Cloudflare account with Workers, KV, D1, R2 bindings configured

## Quick Deploy

```bash
./deploy.sh   # Runs migrations + deploy in one shot
```

## Manual Deploy

```bash
# 1. Apply D1 migrations
npx wrangler d1 migrations apply epcp-audit --remote

# 2. Deploy the worker
npx wrangler deploy src/index.js
```

## Local Development

```bash
npx wrangler dev src/index.js --port 8787 --local
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STATUS_TOKEN` | Yes | HMAC token for status write auth |
| `CF_API_TOKEN` | No | Cloudflare API token (admin endpoints) |
| `CF_ACCOUNT_ID` | No | Cloudflare account ID (admin endpoints) |
| `CF_TEAM_DOMAIN` | No | Access team domain (default: `trimtab-signal`) |
| `DEBUG_ACCESS_LOG` | No | Set `1` to enable request logging |
| `FHIR_CHECK_URL` | No | FHIR health check endpoint |
| `P31_FHIR_SECRET` | No | FHIR check bearer token |

## Bindings

| Binding | Type | Description |
|---------|------|-------------|
| `STATUS_KV` | KV Namespace | Fleet status, operator shift, CRDT state |
| `EPCP_DB` | D1 Database | Audit events, budget tracking, fleet status |
| `CRDT_SESSION_DO` | Durable Object | CRDT session coordination |
| `AI` | Workers AI | Llama 3.1 inference for persona chat |

## Verification

```bash
curl https://command-center.trimtab-signal.workers.dev/api/health
# Expected: {"ok":true,"ts":"..."}
```

## Rollback

```bash
npx wrangler rollback --steps 1
```
