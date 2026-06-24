# k4-personal — Deployment

## Prerequisites
- Node 20+
- `npx wrangler login`

## Deploy
```bash
npm run deploy
```

## Health check
```bash
curl https://k4-personal.<your-subdomain>.workers.dev/health
```

## Verify mesh
```bash
curl https://k4-personal.<your-subdomain>.workers.dev/api/mesh
```
