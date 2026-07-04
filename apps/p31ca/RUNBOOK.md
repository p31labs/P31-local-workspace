# Runbook — p31ca (p31ca.org)

## Incident Response

### Build Failure

**Symptoms:** CI pipeline fails at `lint`, `test`, or `build` job.

**Triage:**
1. Check CI logs in GitHub Actions for the failing commit
2. Lint failure → run `pnpm typecheck` locally, fix type errors
3. Test failure → run `pnpm test` locally, check coverage thresholds
4. Build failure → run `pnpm build` locally; check for missing imports, config errors

**Resolution:**
- Push fix commit; CI re-triggers automatically
- If thresholds changed, update `coverage.thresholds` in `vitest.config.ts`

### Deploy Failure

**Symptoms:** CI fails at `deploy` job, or site shows stale content after green CI.

**Triage:**
1. Check `cloudflare/wrangler-action` logs for API/auth errors
2. Verify `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set in repo secrets
3. Check Cloudflare Dashboard → Workers & Pages → p31ca → Deployments

**Resolution:**
- Expired token? Regenerate in Cloudflare Dashboard → My Profile → API Tokens
- Network error? Re-run the failed job in GitHub Actions
- Stale content? Hard refresh browser or unregister service worker

### Runtime Errors

**Symptoms:** 500 errors, missing pages, API failures on live site.

**Triage:**
1. Hit health endpoint: `curl https://p31ca.org/api/health`
2. Check Cloudflare Dashboard → Analytics → Errors for status code distribution
3. Check if recent deploy introduced the issue

**Resolution:**
- Rollback to previous deployment (see DEPLOY.md)
- If error is in an API route, check route handler and validate input
- If static page missing, verify `dist/` contains the file

## Health Check Reference

```
GET https://p31ca.org/api/health
```

Response:
```json
{
  "status": "ok",
  "version": "0.0.1",
  "timestamp": "2026-06-21T12:00:00.000Z",
  "uptime": 12345,
  "dependencies": {
    "astro": { "status": "ok" },
    "site": { "status": "ok" }
  }
}
```

Expected: `status: "ok"`. Any other value indicates a problem.

## Monitoring

| What | How | Frequency |
|------|-----|-----------|
| Health endpoint | External uptime monitor (e.g. Better Uptime, Pingdom) | Every 5 minutes |
| CI status | GitHub Actions dashboard | Per commit |
| Build artifacts | Verify `dist/` contains `index.html` + expected routes | Per build |
| Coverage | CI `test` job generates coverage report | Per commit |

## Escalation SLA

| Severity | Response Time | Escalation Path |
|----------|---------------|-----------------|
| SEV1 — Site down | 15 min | On-call → deploy rollback |
| SEV2 — Feature broken | 1 hour | On-call → PR fix → deploy |
| SEV3 — Minor issue | 24 hours | Issue triage → next sprint |
| SEV4 — Question | 72 hours | Team chat → docs update |

Contact: Open a GitHub issue in the monorepo or ping on-call via internal channel.
