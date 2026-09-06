# p31-cortex — Runbook

## Health check
`GET /health` returns JSON with `status`, `worker`, `version`, `agents`, `timestamp`.

## Known failure modes
- D1 database unavailable: `/api/status` returns 500
- Durable Object binding missing: agent routes return 500
- Ko-fi webhook fails: check webhook secret in env

## Recovery
1. Verify wrangler.toml bindings (D1 + DO namespaces)
2. Run `npm run deploy`
3. Check worker logs in Cloudflare Dashboard
4. If D1 is down, verify `wrangler d1 list` shows p31-cortex database
