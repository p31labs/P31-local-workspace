# p31-cortex — Deployment

## Prerequisites
- Node 20+
- `npx wrangler login`

## Deploy
```bash
npm run deploy
```

## Health check
After deploy, verify:
```bash
curl https://p31-cortex.<your-subdomain>.workers.dev/health
```
Expect `{ "status": "ok", "worker": "p31-cortex", ... }`

## Zero-downtime (future)
This artifact will use `wrangler versions upload` + `wrangler versions deploy` when configured.
