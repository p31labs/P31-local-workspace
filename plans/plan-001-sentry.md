# PLAN-001: Sentry Error Tracking — Spaceship Earth + BONDING

## Problem

`VITE_SENTRY_DSN` is referenced in both apps but never set. The SDK is wired in (reads `import.meta.env.VITE_SENTRY_DSN`, no-ops if absent), so adding the DSN activates tracing with zero code changes.

## Scope

| App             | Bundle                                        | Entry Point       |
| --------------- | --------------------------------------------- | ----------------- |
| BONDING         | `software/bonding/src/main.tsx` L11        | `VITE_SENTRY_DSN` |
| Spaceship Earth | `software/spaceship-earth/src/main.tsx` L9 | `VITE_SENTRY_DSN` |

Both use `@sentry/browser` via `SENTRY_DSN` env var. SDK init is wrapped in `if (sentryDsn) { ... }` — fails open if DSN absent.

## Prerequisites

- Sentry account at [sentry.io](https://sentry.io)
- Two projects created (suggested slugs: `bonding-relay`, `spaceship-earth`)
- One DSN per project (format: `https://{key}@o{sentry-org}.ingest.sentry.io/{project-id}`)

## Steps

### Step 1 — Create Sentry Projects (manual, browser)

1. Log into sentry.io → New Project → Choose **React** → Name: `bonding-relay`
2. Create second project: **React** → Name: `spaceship-earth`
3. Copy both DSNs (they look like `https://abc123@o123456.ingest.sentry.io/789000`)

### Step 2 — Add DSN to Cloudflare Pages (manual, dashboard)

For **BONDING** (`bonding.p31ca.org`):

1. Cloudflare Dashboard → Pages → `bonding-p31ca` → Settings → Environment Variables
2. Add Variable: `VITE_SENTRY_DSN` = `https://abc123@o...@sentry.io/bonding-id`
3. Repeat for Production and Preview environments
4. Redeploy (or wait for next push)

For **Spaceship Earth** (`p31ca.org`):

1. Cloudflare Dashboard → Pages → `spaceship-earth` → Settings → Environment Variables
2. Add `VITE_SENTRY_DSN` for appropriate environments
3. Redeploy

> **Note:** `VITE_`-prefixed vars are embedded at build time via Vite's `loadEnv()`. Rebuild is required — setting the var in the dashboard and triggering a new deploy.

### Step 3 — Verify (automated after redeploy)

```bash
# In browser console after page load on either app:
console.log(Sentry.getCurrentHub().getClient()?.getdsn())
# Should print the DSN object, not undefined
```

Or check the Sentry dashboard for the "First Event" timestamp on each project.

## Side Effects

- Errors in BONDING and SE will surface in the respective Sentry project
- `release` is not configured — consider adding `VITE_GIT_SHA` in a future pass for better issue triage
- PII: Sentry defaults capture IP, user agent, URL. Add `beforeSend` hook if needed.

## Rollback

Remove `VITE_SENTRY_DSN` from Cloudflare Pages env vars → redeploy. SDK no-ops on next build.

## Priority

**Medium.** Non-blocking. Catches production errors that are otherwise invisible. Active during the legal sprint when uptime matters.
