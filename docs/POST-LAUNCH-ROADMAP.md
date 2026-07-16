# Post-Launch Roadmap — P31 Sovereign Care Attestation

**CWP:** CWP-2026-058 (Fortune 1 Launch)
**Date:** 2026-07-15
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
- [x] p31ca `/api/health/` endpoint deployed and verified (CWP-2026-058)
- [x] Pilot outreach kit + tracker template created (CWP-2026-058)
- [x] Pilot onboarding CLI enhanced (`--export-links`, `--export-csv`, `--template`, `--summary`) (CWP-2026-058)
- [x] Demo suite expanded: Molecular Field, Spaceship Earth, Starfield tiles (CWP-2026-058)
- [x] Treaty page signing section added (CWP-2026-058)
- [x] Full production demo script with 6 segments (CWP-2026-058)
- [ ] Cloudflare **Alerts** configured on dashboard (manual)
- [ ] **Hybrid PQC TLS** enabled at zone level for `p31ca.org` (manual)
- [ ] NGI **proposals submitted** via NLnet portal (manual, pre-2026-08-01)
- [ ] **Demo video** recorded + uploaded + linked (manual)
- [ ] **Pilot invites** sent; ≥5 families onboarded before submission

---

## 5. Known Gaps (honest)

- **Status-List-2021** revocation is per-credential (`/credential/revocation/:id`); a full aggregated **bitstring** list endpoint is now LIVE at `GET /credential/revocation/list` (CWP-2026-048).
- **EBSI conformance harness** not run (no public harness); validated against EBSI/ESSIF test vectors + draft-17 worked examples.
- **`did:web`** publication of the federation actor under `p31ca.org/.well-known` is LIVE (CWP-2026-048).
- **NixOS self-hosting module** (Fediversity WP2) is a stretch item, not yet implemented.
- **FHIR** healthcare integration is deployed (`software/workers/fhir-bridge/`) but not yet connected to PHOS UI (Q1 2027).
- **Genesis ping** SHA-256 entryHash fix is complete but needs live test run (CWP-2026-058).

---

## 4. CWP-2026-058 — Fortune 1 Launch Artifacts (2026-07-15)

### Completed

| Artifact | Location | Status |
|----------|----------|--------|
| Genesis ping SHA-256 fix | `scripts/genesis-ping.js` | ✅ Ready for live test |
| p31ca `/api/health/` | `apps/p31ca/src/pages/api/health.ts` | ✅ Deployed, HTTP 200 |
| Pilot outreach kit | `docs/PILOT-OUTREACH-KIT.md` | ✅ Created |
| Pilot tracker template | `docs/PILOT-TRACKER-TEMPLATE.md` | ✅ Created |
| Pilot onboarding CLI | `scripts/pilot-onboard.js` | ✅ Enhanced with 4 new flags |
| Demos index | `apps/p31ca/public/demos/index.html` | ✅ Expanded (5 artifacts) |
| Molecular Field demo | `apps/p31ca/public/demos/molecular-field.html` | ✅ Deployed |
| Spaceship Earth fix | `apps/p31ca/public/spaceship-earth/index.html` | ✅ Void color corrected |
| Treaty signing | `site/uplink.html` | ✅ localStorage persistence |
| Demo script | `docs/grants/NGI-DEMO-SCRIPT.md` | ✅ Full production script |

### Manual steps remaining

1. Run genesis ping live (testnet)
2. Record demo video (6-segment script)
3. Send pilot invites (18 families)
4. Submit NGI proposals (NLnet portal)
5. Enable Cloudflare PQC TLS (zone dashboard)
6. Configure Cloudflare Alerts (dashboard)

---

*This roadmap is a living document — update on each pilot cohort and at every NGI milestone.*
