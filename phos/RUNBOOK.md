# phos — Runbook

## Health endpoints
- `GET /health` — liveness
- `GET /manifest` — app manifest

## Deploy
```bash
npm run build
npx wrangler pages deploy dist --project-name phos
```

## Recovery
1. Check build output in `dist/`
2. Redeploy via wrangler pages deploy
3. Verify `/health` returns 200
