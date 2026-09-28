# env-proxy

BFF for the Quantum Material `.env` app (Phase 1, read-only). Lists Worker
secret **names** across the curated P31 fleet against the manifest's declared
`required` secrets, plus D1-backed audit + status aggregation. Secret **values**
never leave the Cloudflare API — the proxy only ever sees names.

## Routes (all Bearer-authed)

- `GET /env/list?scope=capital|mcp|all` — per worker: `secrets` (names from CF
  API), `required` (manifest), `missing` (`required - secrets`). Logs a D1
  `env_audit` row per worker.
- `GET /env/status` — aggregates: total secrets, missing required across the
  fleet, stale (>90d since `env_metadata.last_rotated_at`), Secrets Store
  inventory.
- `GET /env/audit?limit=50` — recent `env_audit` rows from D1.

## Secrets

```
npx wrangler secret put ENV_PROXY_TOKEN   # required — bearer token the app sends
npx wrangler secret put CF_API_TOKEN      # required for live data
```

`CF_API_TOKEN` must be scoped to:
- **Workers Scripts → Edit / Read** (`workers_scripts:read`)
- **Account Secrets Store → Read** (`account.secrets-store:read`)

### Why CF_API_TOKEN is unset (deploy note)

As of the Phase 1 deploy the API token **value was not available** in this
environment (only the wrangler OAuth session exists, and the OAuth token is not
scoped to mint API tokens). `ENV_PROXY_TOKEN` **is set**. The exact step for a
human:

```bash
cd /home/p31/P31-local-workspace/workers/env-proxy
npx wrangler secret put CF_API_TOKEN
# paste the scoped token, then confirm with:
npx wrangler secret list
curl -s -H "Authorization: Bearer $ENV_PROXY_TOKEN" \
  "https://env-proxy.p31ca.org/env/list?scope=capital"
```

Until `CF_API_TOKEN` is set, `/env/list` returns workers with `secrets: []` and
an error note, and `/env/status` reports the missing token.

## CORS

`ALLOWED_ORIGINS = "*"` today. Set it to the standalone app origin
(`https://env.p31ca.org`) once confirmed.