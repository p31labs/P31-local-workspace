# k4-personal — Runbook

## Health endpoints
- `GET /health` — worker liveness
- `GET /api/health` — detailed health

## Known failure modes
- KV namespace missing: agent routes return 500
- Durable Object migration stale: deploy fails

## Recovery
1. Check wrangler.toml bindings
2. Run `npm run verify` then `npm run deploy`
3. Check Cloudflare Dashboard logs
