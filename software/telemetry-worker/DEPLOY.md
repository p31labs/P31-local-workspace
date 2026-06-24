# p31-telemetry-worker — Deployment

## Prerequisites
- Node 20+
- `npx wrangler login`
- `TELEMETRY_KV` KV namespace created in Cloudflare account

## Deploy
```bash
npm run deploy
```

## Health check
After deploy, verify:
```bash
curl https://p31-telemetry.trimtab-signal.workers.dev/health
```
Expect `{ "service": "p31-telemetry", "status": "ok", ... }`

## CI/CD
The CI pipeline is defined in `.github/workflows/ci-telemetry-worker.yml`. It runs on every push/PR and deploys to production on pushes to `main`.

## Environment Variables
Set via `wrangler secret put`:

| Secret | Description |
|--------|-------------|
| `ALLOWED_ORIGIN` | CORS origin (e.g. `https://spaceship-earth.pages.dev`) |

## Rollback
1. `git revert HEAD` on the offending commit
2. Push to `main` — CI deploys automatically
3. Or roll back via Cloudflare Dashboard: Workers & Pages -> p31-telemetry -> Deployments
