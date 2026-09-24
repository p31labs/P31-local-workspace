# mcp-registry — security review (2026-09-24)

Post-hardening audit of the marketplace registry. Status: no critical or high
findings; two moderate/informational recommendations below.

## Scope reviewed
- `handleCall` (proxy), `handleRegister`, `handleReview`, `handlePending`,
  `handleRoles`, `handleMe`, `handleLogs`/`handleErrors`/`handleAnomalies`
- RBAC gating (`requireRole`/`requireAdmin`), principal resolution
- Sanitizer regexes (ReDoS), body-size caps
- Secret handling (`.dev.vars`, `wrangler secret put`)

## Findings

### M1 (moderate) — write-tool proxy calls are anonymous-open
`POST /servers/:id/call` relays write-risk tools (e.g. `pqc_sign`, `taler_pay`)
to any caller without an authenticated principal. **Mitigation**: the proxied
servers are already public endpoints, so the proxy is a convenience layer, not
a privilege escalation; the sanitizer + per-tool quotas bound abuse.
**Implemented (default OFF)**: set `REQUIRE_AUTH_WRITE=1` (env var) to reject
write calls whose principal is `anonymous` — use in deployments where the
upstream is also private.

### I1 (info) — capability tokens are metadata, not enforcement
The 60s `X-Capability-Token` is attached upstream and recorded in the audit
chain, but the upstream server does not verify it. It is governance/audit
metadata; treat it as such.

### I2 (info) — Access JWKS cached 1h in KV
`access:jwks` is KV-cached (1h TTL). `CF_ACCESS_CERT_URL` + `CF_ACCESS_AUD`
must both be set for Access tokens to verify; otherwise the header path
silently falls back to `X-Principal`/anonymous.

## Clean
- Admin (logs/errors/anomalies/roles) and reviewer (pending/review) surfaces
  all pass through `requireRole`; no bypass found.
- Sanitizer regexes are linear/bounded (no catastrophic backtracking);
  body cap is 64 KiB, per-field caps enforced before proxying.
- `.dev.vars` is only read by `wrangler dev` locally; production secrets are
  `wrangler secret put` only. `.dev.vars` is gitignored.
- Role assignment is admin-only; roles are enforced server-side from KV
  (`roles:authn:<principal>`, `roles:mapping:<group>`), so self-identification
  via `X-Principal` cannot escalate privileges.

## Hardening backlog
1. `REQUIRE_AUTH_WRITE` env flag (M1) — **implemented, default OFF**, 2026-09-24.
2. Capability-token verification hook on the upstream (I1) — requires server
   support.
3. Retire `REVIEW_SIGNING_KEY_PREV` ~30 days after the 2026-09-24 rotation.