# k4-hubs — Deployment

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
curl https://k4-hubs.<your-subdomain>.workers.dev/health
```
Expect `{ "status": "ok", "service": "k4-hubs", "version": "1.0.0", "hubFusion": true }`

## Zero-downtime (future)
This artifact will use `wrangler versions upload` + `wrangler versions deploy` when configured.
