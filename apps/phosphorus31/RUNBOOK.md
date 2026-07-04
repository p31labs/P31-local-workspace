# phosphorus31.org — Runbook

## Health endpoint
`GET /api/health` — returns JSON with status, version, service

## CI/CD
- PRs to main: build only
- Push to main: build + deploy to Cloudflare Pages

## Recovery
1. Check build: `npm run build`
2. If deploy fails, verify wrangler auth: `npx wrangler login`
3. Manual deploy: `npm run deploy`
