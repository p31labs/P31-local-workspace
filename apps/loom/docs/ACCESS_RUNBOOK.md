# Loom — Cloudflare Access runbook (flip the gate ON)

The Loom's API gate (`apps/loom/functions/api/loom/_middleware.ts` →
`apps/loom/functions/api/loom/_lib/access.ts`) is **live code, currently OFF**. Flipping it on is a dashboard operation that
requires no code change. This is the 5-minute procedure.

## What the gate does

Every `/api/loom/*` route validates a Cloudflare Access JWT (RS256, JWKS
fetched once and cached) — issuer, audience, expiry. The JWT comes from the
`CF_Authorization` cookie (the only cookie path that works with SSE) or the
`Cf-Access-Jwt-Assertion` header. The JWT's `sub` becomes the writer identity
on the log. Localhost (wrangler pages dev) is exempt so local testing still
works.

The gate is OFF when `CLOUDFLARE_ACCESS_AUD` is unset or a `REPLACE` placeholder.

## The procedure (5 minutes)

1. **Create the Access application** (Zero Trust dashboard →
   Access → Applications → Add an application → **Self-hosted**):
   - Name: `Loom`
   - Domain: `loom-8z0.pages.dev` (and `*.loom-8z0.pages.dev` if desired)
   - Policy: Add a policy with your team's group or email domain.
   - Note the **Audience Tag** (the `aud` claim) — a 36-char UUID shown on the
     application page.
2. **Get the team domain**: Zero Trust dashboard → Settings → Customization →
   the team domain, e.g. `https://p31.cloudflareaccess.com`.
3. **Set the two env values** on the Pages project `loom` (Settings →
   Variables and Secrets):
   - `CLOUDFLARE_ACCESS_AUD` = the Audience Tag from step 1
   - `CLOUDFLARE_ACCESS_DOMAIN` = the team domain (no trailing slash)
4. **Re-deploy** (a redeploy picks up the new vars) or hit the existing
   deployment — Pages env vars apply on the next deploy.
5. **Verify**: from a logged-out context (incognito), `GET
   /api/loom/events` should return **401**. From a browser that completed the
   Access login, it should return the log. The SSE stream
   (`/api/loom/stream`) must keep working through the cookie path.

## What this changes

- **Identity becomes real**: `humanId` was client-asserted (`?id=`/localStorage);
  now the API's writer identity derives from the Access `sub`. The LOVE
   `loveDid` binding (see `LOVE_INTEGRATION.md`) is the care-economy side of
   the same identity.
- **The interim posture ends**: `SECURITY.md`'s "Access gate OFF with a
   logged warning" section becomes history.
- **The scope boundary becomes real**: the Loom's privacy boundary (`personal`
  events — see `DECISIONS.md` #012) is enforced at the read path always, but
  it is only *meaningful* once the caller has an identity. In the deployed
  default (anonymous, Access OFF), every event is `shared` — nothing is hidden.
  Configuring Access is what turns "the scope promise is made to no one" into
  enforcement: personal events bind to the authenticated `sub`, and another
  humanId's personal records are invisible. **Do not run the family test until
  this step is done** — the test's privacy findings would be measuring a
  promise, not the system.
- **Nothing else changes**: the SSE worker's internal `/stream` and
  `/broadcast` stay protected by the service token regardless.

## Rollback

Unset `CLOUDFLARE_ACCESS_AUD` (or set it to `REPLACE`) and re-deploy — the
gate returns to OFF. There is no code to revert.

## The four dashboard values the repo cannot infer

| Value | Where | How to get it |
|---|---|---|
| `CLOUDFLARE_ACCESS_AUD` | Pages env var | Access application Audience Tag |
| `CLOUDFLARE_ACCESS_DOMAIN` | Pages env var | Zero Trust team domain |
| `LOOM_SSE` service binding (optional) | Pages → Settings → Functions → Bindings | Add service binding `loom-sse`; secret-proxy fallback works without it |
| `LOVE_INTERNAL_TOKEN` (optional) | Pages env var | The Loom→love-ledger service token; see `LOVE_INTEGRATION.md` |

## Related Documents

- `./SECURITY.md` — the deployed perimeter this runbook secures
- `./LOVE_INTEGRATION.md` — the service-token decision (Access sub = identity)
- `./AUDIT_STANDARDS.md` — the writer-identity field the gate binds
- `./MAP.md` — the doc index; where this page sits