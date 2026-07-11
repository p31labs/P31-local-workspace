# CWP-2026-008: CONVERGENCE — SWARM TO PRODUCTION

**Vector Equilibrium to Tetrahedron | Issued 2026-07-11**

**STATUS:** AUTHORIZED — IN EXECUTION
**ISSUED:** 2026-07-11
**OPERATOR:** trimtab-signal / p31
**PARENT:** CWP-2026-007 (Jitterbug Parallel Path)
**GEOMETRY:** Three axes — (A) Production Deployment, (B) Live User Testing, (C) Grant Submission & Convergence
**DEADLINE:** 2026-07-31 (CWP closeout) → 2026-08-01 (NGI grant deadline)

---

## PREAMBLE

CWP-2026-006 and CWP-2026-007 shipped the **UIG Adaptive Exocortex** across all faces. The code is written, the tests are green (44/44), and all four apps are deployed. What remains is **production hardening, live user validation, and grant submission**.

External landscape (verified July 11, 2026):
- **NGI TALER (14th)** + **NGI Fediversity (12th)** both open, deadline **Aug 1 2026 12:00 CEST**. Only active NLnet pathways.
- **x402** at 100M+ transactions on Base; Cloudflare Monetization Gateway live (July 1) with explicit MCP tool support.
- **MCP** at 10,000+ public servers, 97M monthly SDK downloads.
- **A2UI v0.9** production-ready — P31's `InterfaceDescription` aligns with this standard.

---

## COMPLETED STATE (from CWP-2026-006/007)

| Axis | Tasks | Status | Commit |
| :--- | :--- | :--- | :--- |
| A | Design System (A1-A7) | ✅ DONE | `408180f` / `f2a9c73` / `a407b43` / `41c19f7` |
| B | UIG Extension (B1-B6) | ✅ DONE | `fe9d1a2` / `948981a` / `9bb2a90` |
| C | Generative Layer (C1-C6) | ✅ DONE | `50790ed` / `48edd38` |
| D | Operational Readiness (D1-D4) | ✅ DONE | `a06afca` / `41c19f7` |
| E | Swarm Orchestration (E1-E4) | ✅ DONE | `9bb2a90` |

---

## AXIS A — PRODUCTION DEPLOYMENT

| Task | Description | Agent | Status | Verification |
| :--- | :--- | :--- | :--- | :--- |
| A1 | Verify all 4 apps deployed & healthy | Ops | ✅ DONE | `curl` each endpoint → 200/ok |
| A2 | Rotate provider secrets | Ops | 🔄 USER ACTION | Secrets rotated at providers |
| A3 | Update `.env.example` with placeholder values | Ops | ✅ DONE (`41c19f7`) | No real secrets in repo |
| A4 | Run TRIPER cert against live services | Ops | ✅ DONE | 44/44 green, cert written |
| A5 | Wire `scripts/audit-wcag.mjs` into CI (blocking) | CI | ✅ DONE | axe-runner.yml blocks on critical/serious |

---

## AXIS B — LIVE USER TESTING

| Task | Description | Agent | Status | Verification |
| :--- | :--- | :--- | :--- | :--- |
| B1 | Deploy PHOS with density toggle + generative layer | UIG | ✅ DONE (prior CWP) | PHOS surface responds to intent |
| B2 | Deploy bonding with UIGSurface + `?gen=1&intent=` | UIG | ✅ DONE (`9bb2a90`) | Bonding responds to intent |
| B3 | Recruit 5-10 neurodivergent testers | Ops | 🔄 USER ACTION | Testers confirmed by Jul 25 |
| B4 | Run arcade usability sessions | Ops | 🔄 USER ACTION | ≥3 sessions completed |
| B5 | Run LOVE ledger & Cognitive Passport sessions | Ops | 🔄 USER ACTION | ≥3 sessions completed |
| B6 | Synthesize feedback → final report | Ops | 🔄 USER ACTION | Report delivered |

---

## AXIS C — GRANT SUBMISSION & CONVERGENCE

| Task | Description | Agent | Status | Verification |
| :--- | :--- | :--- | :--- | :--- |
| C1 | Finalise LOVE-Ledger proposal (€15k, NGI TALER 14th) | Grants | 🔄 IN PROGRESS | Proposal complete |
| C2 | Finalise PHOS-Sovereign proposal (€25k, NGI Fediversity 12th) | Grants | 🔄 IN PROGRESS | Proposal complete |
| C3 | Submit both proposals at nlnet.nl/propose/ | **User** | 🔄 USER ACTION | Submission receipt by Aug 1 |
| C4 | Update AGENTS.md with final WCAG 2.2 AAA status | Docs | ✅ DONE | No false claims |
| C5 | Tag release: `v1.0.0-uig-convergence` | Ops | 🔄 PENDING | Tag pushed to origin |

---

## VERIFICATION CHECKLIST

- [x] `curl -s https://p31-auth.trimtab-signal.workers.dev/health` → `{"status":"ok"}`
- [x] `curl -s https://design-hub-41l.pages.dev/` → 200
- [x] `curl -s https://bonding.pages.dev/?gen=1&intent=show+molecule+builder` → 200 + UIG
- [x] `curl -s https://status.p31ca.org/health` → reports status (all services)
- [x] TRIPER cert → AUTHORIZED 44/44
- [x] `scripts/audit-wcag.mjs` → 0 blocking violations (bonding)
- [ ] NGI proposals submitted → receipt confirmed
- [ ] Tag `v1.0.0-uig-convergence` → pushed to origin

---

## RISKS & MITIGATIONS

| Risk | Probability | Mitigation |
| :--- | :--- | :--- |
| Provider-side secret rotation incomplete | Medium | Document all exposed secrets; rotate before Aug 1 |
| User testing recruitment fails | Low | Multiple channels (Reddit, orgs, therapists) |
| Grant submission technical issue | Low | Submit early (Jul 31), not at deadline |
| WCAG audit fails in CI | Low | A5 wired; axe-runner blocking passes (0 serious) |

---

*Generated: 2026-07-11 (post-deep research synthesis)*
*P31 Labs | 501(c)(3) Nonprofit | EIN 42-1888158*
