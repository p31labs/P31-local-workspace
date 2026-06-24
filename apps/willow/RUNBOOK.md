# Runbook

## Health Check
- **Endpoint:** `GET /health` (served by `public/_worker.js`)
- **Expected response:**
  ```json
  { "status": "ok", "service": "willow", "version": "1.0.0", "timestamp": "..." }
  ```

## Common Tasks

### Start dev server
```bash
npm run dev
```

### Run tests
```bash
npm test                 # run once with coverage
npm run test:watch       # watch mode
```

### Build
```bash
npm run build
```

### Deploy to production
```bash
npm run deploy
```

## Logs & Monitoring
- Cloudflare Pages logs: https://dash.cloudflare.com/?to=/:account/pages/view/willow
- Cloudflare Workers logs: `wrangler tail` (for `_worker.js`)

## Rollback
In the Cloudflare Pages dashboard, select a previous deployment and click **"Rollback to this deployment"**.

## Known Issues
- `_worker.js` health endpoint returns 200 even if the app is degraded — enhance with runtime checks if needed.
