# p31-hearing-ops — Runbook

## Health endpoint
`GET /health` — returns JSON status

## Known issues
- Case data updated manually in src/data/case-data.js
- `npm run prebuild` generates icons via sharp

## Recovery
1. Rebuild: `npm run build`
2. Redeploy: `npm run deploy`
3. Verify health: `curl <url>/health`
