# k4-cage — Runbook

## Health check
`GET /health` or `GET /api/health` returns JSON with `ok`, `service`, `workerVersion`.

## Known failure modes
- Mesh topology unavailable: `/health` returns null topology
- KV namespace missing: mesh routes return 500

## Recovery
1. Verify wrangler.toml bindings
2. Run `npm run deploy`
3. Check worker logs in Cloudflare Dashboard
