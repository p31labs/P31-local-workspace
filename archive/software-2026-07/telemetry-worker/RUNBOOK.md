# p31-telemetry-worker — Runbook

## Health check
`GET /health` returns JSON with `service`, `status`, `version`, `timestamp`, `bindings`, and `routes`.

## Known failure modes
- `TELEMETRY_KV` missing: POST endpoints return 500
- `ALLOWED_ORIGIN` not set: CORS blocks all origins except localhost dev
- Missing/invalid payload: POST /api/telemetry/perf returns 400

## Recovery
1. Verify wrangler.toml bindings match deployed KV namespace
2. Run `npx wrangler secret put ALLOWED_ORIGIN` if missing
3. Check worker logs in Cloudflare Dashboard
4. Re-deploy: `npm run deploy`

## Monitoring
Monitored via the P31 Labs Command Center dashboard:
- **Dashboard:** https://command-center.trimtab-signal.workers.dev
- **Ping interval:** every 5 minutes

## Escalation SLA
| Severity | Response Time | Escalation |
|----------|--------------|------------|
| Critical (down) | 1 hour | Will Johnson (text/call) |
| High (degraded) | 4 hours | Will Johnson (text) |
| Medium (non-blocking) | 24 hours | Next business day |
