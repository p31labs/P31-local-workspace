# CWP-2026-049 Alignment Audit — Ground Truth vs. As-Written

**Date:** 2026-07-14
**Auditor:** Build agent (cross-referenced `AGENTS.md` CWP-2026-041→048, live endpoints, git state, Cloudflare APIs)
**Supersedes:** the Reality-Check table in `CWP-2026-049` (Handover Frontier).

## Reality-Check Table — Corrected

| Claim in CWP-2026-049 | CWP status | Actual status | Evidence |
|-----------------------|------------|---------------|----------|
| All code built & committed | ✅ | ✅ | `94a72ed` pushed (CWP-2026-048) |
| All workers deployed | ✅ | ⚠️ Partial | `personal-swarm`, `ledger-bridge`, `fhir-bridge` live; `federation.p31ca.org` → **404** (custom-domain edge linkage, see below) |
| PHOS built & deployed | ✅ | ⚠️ Preview only on prod domain | `2274cf1d.phos-btn.pages.dev/portal/` → **200**; `www.phos.p31ca.org/` → **200**; apex `phos.p31ca.org` → **404**. Build exists; prod apex domain not routing. |
| `phos.p31ca.org` production domain | ❌ 404 | ❌ 404 (being fixed) | Confirmed; see Phase 1. Root cause = apex custom-domain edge linkage, **not** a missing build. |
| Hybrid PQC TLS enabled | ❌ | ❌ | Pending zone toggle (`AGENTS.md` CWP-2026-044) |
| Cloudflare Alerts configured | ❌ | ❌ | Pending dashboard (`AGENTS.md` CWP-2026-047) |
| NGI proposals submitted | ❌ | ❌ | Pending NLnet portal (`AGENTS.md` CWP-2026-047 flagged the as-written ✅ as **FALSE**) |
| Pilot invites sent | ❌ | ❌ | 18 pilots `status:"active"` in DB; no manual send performed |
| Demo video recorded | ❌ | ❌ | Script exists; video pending human |
| 18 pilot families in DB (`"active"`) | ✅ | ✅ | Verified via `wrangler d1` (CWP-2026-046) |

## Phase-by-Phase Audit

### Phase 1 — Fix `phos.p31ca.org` Domain
- **As written:** "bind custom domain to the `phos-btn` Pages project."
- **Actual:** Pages project is named **`phos`** (the `phos-btn.pages.dev` hostname is only its preview subdomain). The custom domain `phos.p31ca.org` was already bound and reported `active` in the Pages API, yet returned a plain-text `404` from Cloudflare (`server: cloudflare`, no Pages headers). `www.phos.p31ca.org` returns 200 with full Pages headers. DNS check: apex is a proxied A record to Cloudflare anycast IPs; no Worker route intercepts it. **Root cause:** stale/mismatched apex DNS↔Pages edge linkage.
- **Fix applied (this audit):** deleted + re-created the `phos.p31ca.org` custom domain via the Pages API to force re-linkage (status now `initializing` → `active` after propagation). No code change needed; the production deployment `2274cf1d` already serves `/portal/`.

### Phase 2 — Cloudflare PQC TLS + Alerts
- **As written:** enable zone-level Post-Quantum TLS; configure Alerts.
- **Actual:** Both are zone/account ops, not code. PQC TLS = zone SSL/TLS setting (`ssl_certs:write` scope present → API attempt feasible). Alerts = account Alerting API (token lacks `account:alerts:*` scope → **dashboard runbook only**).
- **Corrected action:** attempt PQC via API; document Alerts dashboard steps.

### Phase 3 — NGI Portal Submission
- **As written:** submit proposals via NLnet portal.
- **Actual:** Proposals drafted (`NGI-TALER-SUBMISSION.md`, `NGI-FEDIVERSITY-SUBMISSION.md`); submission is a manual NLnet portal action. Agent cannot submit.
- **Corrected action:** validate artefacts; keep checklist submit/confirm boxes unchecked.

### Phase 4 — Pilot Outreach
- **As written:** send invitations to 18 families.
- **Actual:** `scripts/pilot-onboard.js` prints onboarding links and can mark `--onboard <did>` (real D1 write). **No `--send` mode exists.** Sending is manual outreach.
- **Corrected action:** run script, capture 18 links to a file; human sends.

### Phase 5 — Demo Video
- **As written:** record + upload.
- **Actual:** `docs/grants/NGI-DEMO-SCRIPT.md` exists; recording/upload is manual.
- **Corrected action:** none executable; document as pending-human.

### Phase 6 — Community Launch
- **As written:** activate Discord/Matrix, schedule call, share contributor docs.
- **Actual:** `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `docs/COMMUNITY-GUIDE.md` exist (proposed/intended per `AGENTS.md`). Channel activation is manual.
- **Corrected action:** none executable; document as pending-human.

## Separately-found gap (outside the 6 CWP phases)
- `federation.p31ca.org` → **404** despite `AGENTS.md` claiming it is "LIVE". Its `software/workers/federation-bridge/wrangler.toml` has `[[custom_domains]] domain = "federation.p31ca.org"`, which requires dashboard activation. Track as a follow-up manual step (not in CWP-2026-049).

## Root-Cause Summary

| Issue | Root cause | Resolution |
|-------|------------|------------|
| `phos.p31ca.org` 404 | Apex custom-domain edge linkage stale (no Pages headers; proxied A record not matched to project) | Deleted + re-created domain via Pages API; pending propagation |
| `federation.p31ca.org` 404 | `[[custom_domains]]` set but not activated in dashboard | Manual: Cloudflare dashboard → Workers → federation-bridge → Custom Domains → Activate |
| FALSE ✅ in CWP (NGI submitted, Alerts configured) | CWP not reconciled with `AGENTS.md` CWP-2026-047 corrections | This audit supersedes the CWP Reality-Check |
