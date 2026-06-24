# p31-orchestrator — Deployment

## Prerequisites

- Node.js 20+
- `npx wrangler login`
- KV namespace `P31_MESH_STATE` created in Cloudflare account

## Deploy

```bash
npm run deploy
```

## Health Check

After deploying, verify the worker is live:

```bash
curl <worker-url>/health
```

Expected response:
```json
{
  "service": "p31-orchestrator",
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "<ISO-8601>"
}
```

## CI/CD

Automated via `.github/workflows/ci.yml`:
- Runs on every push/PR to `main`
- Executes `npm test` (vitest + coverage)
- Runs `tsc --noEmit` type check

## Environment Variables

Set via `wrangler secret put`:

| Secret | Description |
|--------|-------------|
| `BOUNCER_GATE_TOKEN` | Gate token for protected endpoints |
| `DISCORD_PUBLIC_KEY` | Discord app public key |
| `UPSTASH_TOKEN` | Upstash Redis REST token |

Non-secret vars set in `wrangler.toml`:

| Var | Description |
|-----|-------------|
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `ENVIRONMENT` | `production` / `development` / `staging` |

## Rollback

1. `git revert HEAD` on the offending commit
2. Push to main — CI deploys automatically
3. Or rollback via Cloudflare Dashboard
