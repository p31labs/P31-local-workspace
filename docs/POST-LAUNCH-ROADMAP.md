# Post-Launch Roadmap — P31 Sovereign Care Attestation

**CWP:** CWP-2026-046 (Launch Frontier — Ops), Phase 6
**Date:** 2026-07-14
**Deadline:** NGI TALER / Fediversity 14th Open Call — **2026-08-01, 12:00 CEST**

---

## 1. Feedback Loops (operational)

| Loop | Mechanism | Owner signal |
|------|-----------|---------------|
| User feedback | PHOS **Feedback** surface (`/feedback`) → love-ledger event | Spoon-aware, low-friction |
| Error monitoring | `cf-monitor.mjs` (personal-swarm) streams `wrangler tail` → opens GitHub issues for new error signatures | Auto, daily triage |
| Performance | Cloudflare Workers Logs & Traces + **Alerts** (Worker Errors >5/min, D1 >1000ms, R2 503, CPU >90%) | Dashboard-configured |
| Pilot voice | `pilot-dashboard` (`/api/onboard/status`) + hand-hold first 5 families | Manual outreach |

---

## 2. Scaling Roadmap

| Milestone | Timeline | Actions |
|-----------|----------|---------|
| **100 families** | Q4 2026 | Automated onboarding via `scripts/pilot-onboard.js`; more pilot cohorts; EUDI Wallet pilot (Dec 2026 mandate) |
| **500 families** | Q1 2027 | Healthcare integrations (**FHIR**); ML-DSA-65 as default signing key (CWP-2026-044 §5 timeline) |
| **1000 families** | Q2 2027 | EUDI Wallet **certification**; cross-border federation (ActivityPub + FEP-8b32 + BadgeFed) |

---

## 3. Production Ops Checklist (carried from CWP-2026-045/046)

- [x] All 3 workers observable (`[observability] enabled = true`): personal-swarm, ledger-bridge, federation-bridge
- [x] `cf-monitor` daemon runs (`npm run monitor` in personal-swarm)
- [ ] Cloudflare **Alerts** configured on dashboard (manual)
- [ ] **Hybrid PQC TLS** enabled at zone level for `p31ca.org` (manual)
- [ ] NGI **proposals submitted** via NLnet portal (manual, pre-2026-08-01)
- [ ] **Demo video** recorded + uploaded + linked (manual)
- [ ] **Pilot invites** sent; ≥5 families onboarded before submission

---

## 4. Known Gaps (honest)

- **Status-List-2021** revocation is per-credential (`/credential/revocation/:id`); a full aggregated **bitstring** list endpoint is still TODO (see `docs/EUDI-READINESS.md`).
- **EBSI conformance harness** not run (no public harness); validated against EBSI/ESSIF test vectors + draft-17 worked examples.
- **`did:web`** publication of the federation actor under `p31ca.org/.well-known` is TODO.
- **NixOS self-hosting module** (Fediversity WP2) is a stretch item, not yet implemented.
- **FHIR** healthcare integration is roadmap-only (Q1 2027).

---

*This roadmap is a living document — update on each pilot cohort and at every NGI milestone.*
