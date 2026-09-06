# k4-cage — Deployment

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
curl https://k4-cage.<your-subdomain>.workers.dev/health
```
Expect `{ "ok": true, "service": "k4-cage-unified", ... }`

## Zero-downtime (future)
This artifact will use `wrangler versions upload` + `wrangler versions deploy` when configured.
