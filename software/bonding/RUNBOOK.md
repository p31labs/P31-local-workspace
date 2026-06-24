# RUNBOOK — bonding

## Incident Response

### Build Failures

1. Check CI logs in GitHub Actions (`bonding.yml`)
2. Common causes:
   - TypeScript errors — run `npx tsc --noEmit` locally
   - Failed tests — run `npm test`
   - Missing deps — run `npm ci` then verify `package-lock.json` is committed
3. Fix, commit, push to `main`

### Runtime Errors

Errors are caught at two layers:

- **React Error Boundary** — catches render crashes in React component tree. Boundary component at `src/components/ErrorBoundary.tsx`. On catch: logs error to console and renders fallback UI.
- **Sentry** — production error tracking. Configured in `src/main.tsx` via `@sentry/react`. Errors are streamed to the P31 Labs Sentry org.

Triage:

1. Check Sentry issue stream — https://sentry.p31labs.org (or configured DSN)
2. Identify stack trace and affected route/component
3. Reproduce locally with `npm run dev`
4. Fix and deploy

## Health Check

A nightly cron (via the command center `*/5` pinger) curls:

```bash
curl https://bonding.pages.dev/health
```

Expected response (HTTP 200):

```json
{
  "status": "ok",
  "version": "0.1.0",
  "timestamp": "<ISO-8601>",
  "service": "bonding"
}
```

If the health endpoint returns non-200 or a malformed response, the command center alerts.

## Monitoring

Monitored via the P31 Labs Command Center dashboard:

- **Dashboard:** https://command-center.trimtab-signal.workers.dev
- **Ping interval:** every 5 minutes
- **Alert methods:** dashboard status indicator; operator notification

## Escalation SLA

| Severity | Response Time | Escalation |
|----------|--------------|------------|
| Critical (site down) | 1 hour | Will Johnson (text/call) |
| High (feature broken) | 4 hours | Will Johnson (text) |
| Medium (non-blocking) | 24 hours | Next business day |
| Low (cosmetic) | Next sprint | — |

For critical incidents, text **Will Johnson** directly with `[BONDING DOWN]` in the message.
