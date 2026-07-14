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
- **Actual:** Pages project is named **`phos`** (the `phos-btn.pages.dev` hostname is only its preview subdomain). The custom domain `phos.p31ca.org` was bound and reported `active` in the Pages API, yet returned a plain-text `404` from Cloudflare (`server: cloudflare`, no Pages headers). `www.phos.p31ca.org` returned 200 with full Pages headers. The apex DNS was a flattened CNAME to Cloudflare anycast (correct). The real blocker: a **Worker route `phos.p31ca.org/* -> sovereign-agent`** was shadowing the Pages custom domain — Cloudflare evaluates Worker routes ahead of Pages for the same host, so the `sovereign-agent` Worker answered (404) and Pages never received the request. An earlier route listing was truncated and missed this route.
- **Fix applied (this audit):** deleted the `phos.p31ca.org/* -> sovereign-agent` Worker route (token has `workers_routes:write`). The apex now falls through to the Pages custom domain and serves `/portal/` → **200**. (An earlier delete/re-create of the custom domain via the Pages API was unnecessary churn and is superseded by this fix.)

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
| `phos.p31ca.org` 404 | Worker route `phos.p31ca.org/* -> sovereign-agent` shadowed the Pages custom domain | Deleted the Worker route; apex now serves PHOS (200) |
| `federation.p31ca.org` 404 | `[[custom_domains]]` set but not activated in dashboard | Manual: Cloudflare dashboard → Workers → federation-bridge → Custom Domains → Activate |
| FALSE ✅ in CWP (NGI submitted, Alerts configured) | CWP not reconciled with `AGENTS.md` CWP-2026-047 corrections | This audit supersedes the CWP Reality-Check |

## Execution Log — 2026-07-14 (agent)

**Done (API/CLI-executable):**
- Phase 0: wrote this alignment audit; corrected the CWP's false ✅ claims (NGI submitted, Alerts configured) to ❌/pending.
- Phase 1: rebuilt PHOS (`astro build`, ~185s) and deployed to Pages project `phos` → production deployment `5355d981.phos-btn.pages.dev`. `www.phos.p31ca.org/portal/` → **200** and preview `/portal/` → **200**.
- Phase 1: **RESOLVED** — `phos.p31ca.org/portal/` and `phos.p31ca.org/` now return **200** (full Pages headers). Root cause was the `phos.p31ca.org/* -> sovereign-agent` Worker route shadowing the Pages custom domain; deleted that route. (DNS was already correct: a flattened CNAME to the Pages project.)
- Phase 4: fixed `scripts/pilot-onboard.js` (multi-line JSON parsing + missing `registered_at` column) and generated **18** onboarding links → `/tmp/pilot-links.txt`. Note: 3 of 18 rows are test/seed DIDs (`ztest`, `cbs-smoke`, `system:genesis`); ~15 are real families.
- Phase 3: validated all 7 NGI evidence artefacts exist.

**Blocked — requires human / dashboard (not API-executable with this OAuth token):**
- **Phase 1 — apex `phos.p31ca.org` 404: RESOLVED (see above).** Was caused by the `phos.p31ca.org/* -> sovereign-agent` Worker route, not DNS. No dashboard action needed.
- **Phase 2 — PQC TLS:** zone setting `post_quantum_encryption` requires `zone:settings:edit` (token has only `zone:read`/`ssl_certs:write`) → API returns `9109`. Dashboard: SSL/TLS → Edge Certificates → Post-Quantum.
- **Phase 2 — Alerts:** account Alerting API requires `account:alerts:*` scope (absent) → API returns `10000`. Dashboard: Alerts panel (Worker Errors >5/min, D1 latency >1000ms, R2 503, CPU >90%).
- **Phase 3 — NGI submit:** NLnet portal is a manual human action; checklist submit/confirm boxes stay unchecked.
- **Phase 4 — pilot invite send:** `pilot-onboard.js` has no `--send`; sending is manual outreach using `/tmp/pilot-links.txt`.
- **Phase 5 — demo video:** manual record/upload.
- **Phase 6 — community launch:** Discord/Matrix activation manual.
- **Separate gap:** `federation.p31ca.org` → 404 (custom domain not activated in dashboard).
