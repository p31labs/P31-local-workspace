# p31-forge — Runbook

## Health endpoint
`GET /health` — returns service status

## Known failure modes
- `docx` library version mismatch: document generation fails
- Missing brand tokens: brand.js exports may be stale

## Recovery
1. Run `npm run brand:tokens` to regenerate
2. Verify Node version (20+)
3. Check wrangler.toml bindings
4. Deploy with `npm run worker:deploy`
