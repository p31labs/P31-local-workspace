# Loom — security, privacy, and conformance posture

The enterprise posture for the Loom. This documents what is protected, how it
is protected, what the app collects, and where it stands against the
accessibility and children's-privacy regimes that carry deadlines.

## Threat model

The Loom is a family application: a child, a builder, and a grandparent share
one append-only log. The threat model is not fintech. The two concrete risks
that matter:

1. **The log is world-writable.** Anyone who can reach the server can read the
   family's log and append to it. This is the documented SSE authorization-bypass
   class (e.g. CVE-2026-31882, where SSE endpoints bypassed auth the rest of the
   app enforced). The fix is edge auth (Cloudflare Access) with the SSE
   connection bound to the authenticated principal.
2. **The UI injects untrusted content.** The event log and the manifest
   descriptions are rendered in the DOM. A strict CSP with a per-request nonce
   plus `require-trusted-types-for 'script'` closes both the script-injection
   and DOM-XSS surfaces.

## Deployed perimeter (Cloudflare)

- **Edge auth**: Cloudflare Access in front of the Pages project and the SSE
  Worker. The `CF_Authorization` cookie is HttpOnly, SameSite, and sent
  automatically on the EventSource handshake — the only cookie-based path that
  works with `EventSource`. The API Functions and the Worker validate the
  `Cf-Access-Jwt-Assertion` against the Access JWKS.
- **CSP**: per-request nonce injected by a Pages Function middleware
  (`HTMLRewriter`), `script-src 'strict-dynamic' 'nonce-…'`, `object-src 'none'`,
  `base-uri 'none'`, `require-trusted-types-for 'script'`. `Cache-Control: private`
  prevents a shared cache from serving one user's nonced HTML to another.
- **Headers**: HSTS preload, `X-Content-Type-Options: nosniff`, Referrer-Policy,
  Permissions-Policy (all denied), COOP/COEP/CORP (viable because fonts are
  self-hosted).
- **Transport**: the REST API lives in Pages Functions; the SSE broadcast lives
  in a Worker with a Durable Object per log. Both share the D1 database. The
  log is D1-backed in production; the file-backed canon path is local/dev only.

## Data collection — COPPA analysis

The amended COPPA rule took effect June 23, 2025, with most new obligations due
April 22, 2026. The analysis:

**What the Loom collects.** Nothing personal by design. The log records
events (`writer`, `kind`, a node name, an optional client-asserted `humanId`).
The `humanId` is a client-asserted string — a pseudonym, never verified PII. No
name, no email, no persistent identifier tied to a child is required to use the
app. Presentation preferences (theme, sound, density) live in `localStorage`
on the device and are never transmitted.

**The risk.** If a caregiver enters a child's real name as `humanId`, that
string lands in the log. The application does not collect it; a user supplies
it. The posture:

- The default is anonymous: the app works with no `humanId` at all.
- No analytics, no third-party SDKs, no persistent identifiers, no cross-site
  tracking. The Core Web Vitals observer beacons only timing metrics.
- Parental-consent machinery is deliberately absent because the application
  does not collect the categories COPPA governs.

**What this means in practice.** If the Loom ships as-is (anonymous log,
device-local preferences), the COPPA trigger — "collects personal information
from children" — is not met, and no parental-consent flow is required. This
analysis exists so the posture is a decision, not an accident. If a future
feature adds accounts or a real name, that decision must be revisited before
the feature ships.

## Accessibility conformance — EAA / WCAG

The European Accessibility Act has been in force since June 28, 2025; products
and services placed on the market after that date must comply, with transitional
provisions expiring June 28, 2030.

**Conformance statement.** The Loom targets WCAG 2.2 Level AA and exceeds it on
target size: the family floor is 48×48px (`--p31-touch-min`), with child/elder
targets at 56px and 64px — above WCAG AA's 24px and AAA's 44px. Reduced motion
is honored by collapsing `--motion-scale` to `0.01` (never `animation: none`,
which would stall the phase machines). Text, contrast, and focus states follow
the canon's tokens. See `STANDARDS.md` for the full matrix.

The EAA is enforced per EU member state; this statement is the artifact a
procurement reviewer or a European customer asks for first.

## What the repo does NOT do

- **No incident-response plan.** There is no production server yet. When the
  Cloudflare deploy is live, add an IR plan (prepare / detect / contain /
  recover) before handing it to a family.
- **No SOC 2.** A Type II report requires a six-month observation period; it
  cannot be rushed. Defer until there is a paying customer.
- **No secrets in the repo.** Cloudflare secrets are set via
  `wrangler secret put`; the deploy workflow reads `CLOUDFLARE_API_TOKEN` /
  `CLOUDFLARE_ACCOUNT_ID` from GitHub secrets.

## Live deployment (verified)

The Cloudflare surface is deployed and exercised end-to-end:

- **Pages** — `https://loom-8z0.pages.dev` (static SPA, Pages Functions for
  `/api/loom/*`, per-request nonce CSP, PWA manifest + service worker).
- **SSE Worker** — `https://loom-sse.trimtab-signal.workers.dev` (Durable
  Object fan-out, gated by the internal service token).
- **D1** — the `loom` database holds the events table; the gate-validated
  append path and the SSE stream both run against it.

Verified live: `POST /api/loom/event` (gate-validated, written to D1),
`GET /api/loom/events` (full log), `GET /api/loom/stream` (SSE through Pages →
secret proxy → Worker DO fan-out), the nonce CSP (`strict-dynamic` + Trusted
Types), and `/manifest.webmanifest`.

**Integrity.** The log is tamper-evident: each D1 row carries `prev_hash`, and
`GET /api/loom/verify` recomputes the chain and names the seq of any rewrite,
reorder, or deletion (never cached — a stale 200 must not mask a tamper).
`GET /api/loom/provenance/:seq` returns the chain from genesis to a seq with
each record's link, for review. Both are reads (`danger: none`), registered in
the AAF manifest as `verification.verify` / `verification.provenance`. The
chain is the log's integrity layer; the documented gap is per-record
signatures (ECDSA P-256), which would bind writer identity cryptographically.

**Interim posture.** Cloudflare Access is the intended edge auth, but its
application lives in the Zero Trust dashboard and cannot be provisioned from
the repo. Until `CLOUDFLARE_ACCESS_AUD` is configured there, the Access gate
in `functions/api/loom/_middleware.ts` is OFF with a logged warning — the
API is open (a documented interim, not an accident). The internal `/stream`
and `/broadcast` paths are protected by the service token regardless.

**Remaining dashboard config** (the four values the repo cannot infer):
the Access application's team domain + aud tag, and optionally the `LOOM_SSE`
service binding (Settings → Functions → Bindings) — the secret-proxy fallback
works without it.

## Related Documents

- `../README.md` — what the Loom is
- `./STANDARDS.md` — WCAG 2.2, DTCG, AAF conformance
- `./DECISIONS.md` — the decisions behind the shape
- `./AUDIT_STANDARDS.md` — the audit-trail + integrity positioning
- `./LOVE_INTEGRATION.md` — the care-economy bridge + the service token decision
- `./ACCESS_RUNBOOK.md` — how the interim Access-off posture ends
- `./PORTING_AGENT_BRIEF.md` — the port method
- `./MAP.md` — the doc index