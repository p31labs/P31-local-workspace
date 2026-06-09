# P31 ANDROMEDA: PRIORITIZED GAMEPLAN
## Last Updated: 2026-03-30
## Tier: SURVIVE → STABILIZE → SCALE

---

## TIER 1: SURVIVE (0–30 Days)
*Current status: April 4 eviction in 5 days. All accounts at $0–$5. Everything below this line is subordinate to housing stabilization.*

### 1.1 🔴 HOUSING — CRISIS (April 4 Eviction)
- [ ] ESG housing grant application prep (opens April 13, closes May 8 — **9-day gap after eviction**)
- [ ] Emergency housing contacts: Camden County DFCS, Salvation Army, local churches
- [ ] Document all funding efforts for legal record (court evidence of proactive mitigation)
- [ ] Mortgage: $182,449 at 3.2% — deferment status maintained
- [ ] Social media funding drop (SOCIAL_DROP_LIVE.md) — **PRIMARY near-term funding vehicle**

### 1.2 🔴 LEGAL — ACTIVE COMPLIANCE
- [x] Discovery response filed March 26 (Response & Objections + Cover Sheet + Financial Summary)
- [ ] **Psych eval scheduling** — court-ordered at Will's expense. Who administers it is the critical variable. Mar 24 psychiatrist established differential diagnosis (AuDHD vs. mania). Court-ordered eval must use competent neuropsych, not a general psych screen.
- [ ] April 30 wellness baseline documentation (Camden County)
- [ ] Maintain 2 supervised calls/week compliance — document every session
- [ ] BONDING telemetry: continue logging parental engagement (every atom = evidence)
- [ ] Preserve all communication records (Messenger Kids, Discord, email)
- [ ] Transcript purchase ($75, court reporter from Feb 5 and Mar 18 hearings)

### 1.3 🔴 FUNDING — REVENUE GENERATION
- [ ] **Ko-fi Phase 2 bridge post** — ready at `packages/genesis-gate/docs/kofi-phase2-post.md`. Blocked by: need to set dollar target. One-line decision, then publish.
- [x] Reddit SuperStonk DD live — "The Floating Neutral" flaired DD, Zenodo DOI
- [x] Reddit blitz executed March 29 (r/hypoparathyroidism, r/electricalengineering, r/AutisticPride, r/ADHD, r/opensource, r/gamedev)
- [x] Discord server launched: https://discord.gg/uYW5rTCuZ
- [x] Ko-fi Wave 1 deployed with content calendar through week 8
- [ ] 15-Day Sprint Deployment Package — 7 grant payloads staged
- [ ] Grants pending: Pollination Project ($500) + Awesome Foundation ($1,000) — submitted March 10, no response yet

### 1.4 🟡 INCORPORATION DEADLOCK — UNLOCK
- [ ] **$425 = unlock key.** Georgia Articles ($110) + newspaper publication ($40) + IRS 1023-EZ ($275)
- [ ] Once incorporated: EIN → SAM.gov registration (3–4 weeks) → federal grant pipeline (NIDILRR, NSF)
- [ ] Sequence: incorporation → 501(c)(3) → SAM.gov → federal grants. All blocked on $425.
- [ ] Ko-fi revenue or grant award can break this deadlock

### 1.5 🟡 BENEFITS PRESERVATION
- [ ] SNAP/Medicaid active — any income change must be evaluated against benefits cliff
- [ ] Consult Georgia WIPA before accepting any grant award (NIDILRR Switzer $80K risk)
- [ ] SSA disability — both exams complete (Feb 20 psych, Feb 26 physical). Awaiting determination.

---

## TIER 2: STABILIZE (30–90 Days)
*Activate after housing is secured. These unlock scaling.*

### 2.1 🟡 FERS DISABILITY RETIREMENT
- [ ] Separation ~Sep 30, 2025. Filing deadline ~Sep 30, 2026 (5 CFR §844.201)
- [ ] SF-3112A (with nexus) ✅, 3112B (Robby Allen signed) ✅, 3112C (psychiatrist completed) ✅
- [ ] Still needed: 3112D/E from agency, SF-3107 from Will
- [ ] Nuclear option: file direct to OPM Boyers PA (no agency forms required per BAL 20-103)
- [ ] Navy Benefits Center: 1-888-320-2917 / navybenefits@us.navy.mil
- [ ] Annuity: Yr1 ~60% high-3 minus SSDI offset; Yr2+ ~40% high-3 minus 60% SSDI

### 2.2 🟡 NODE ZERO FIRMWARE SPRINT
- [ ] AXS15231B display: vendor init sequence (7 commands, `0xBB` gate). Working approach: chunked memcpy staging buffer (CHUNK_LINES=20, two 19,200-byte DMA buffers, full_refresh=1, 40MHz QSPI, SPI mode 0)
- [ ] Root cause confirmed: missing `lv_init()` before `lv_disp_drv_register()` — fix applied
- [ ] **DO NOT SWAP PINS.** GPIO 1–4 are ES8311 audio codec. GPIO 9–14 are QSPI display.
- [ ] Haptic patterns: Critical Alert, Attention, Optimal
- [ ] LoRa mesh networking validation
- [ ] PQC encryption integration (ML-KEM-768)
- [ ] Reference implementation: GrokPhenix

### 2.3 🟡 SPACESHIP EARTH — 2 BLOCKING BUGS
- [ ] Fix Tailwind v4 `@apply` in `@layer base` — broken after upgrade
- [ ] Fix `useState + setTimeout(200ms)` race condition
- [ ] 10-pattern audit complete; cockpit spatial doctrine validated (z1 canvas, z10-11 HUD, z50 toasts, z60 modals)

### 2.4 🟡 GRANT PIPELINE ACTIVATION
- [ ] **SAM.gov registration** (blocked on $425 incorporation → 501(c)(3) → EIN → SAM.gov)
- [ ] NIDILRR FIP Development: $250K/year × 3 years. Best organizational fit. Contact Radha Holavanahalli.
- [ ] NSF DARE: ~$100–200K/year. Year-round submissions. Contact DARE Program Director before submitting.
- [ ] NSF CPS-CIR / HCC: Up to $1M/4yr. Target: ~Sep 2026. Node One = cyber-physical system.
- [ ] RERC on AI-Driven AT: Up to $975K/year × 5 years. Requires university partnership (Georgia Tech CIDI via Hunter McFeron).
- [ ] Makers Making Change: Jake McIvor expressed interest. Formal submission pending.

### 2.5 🟢 ACADEMIC PIPELINE
- [x] Tetrahedron Protocol published to Zenodo (DOI: 10.5281/zenodo.19004485, 191 views, 163 downloads)
- [x] ORCID configured (0009-0002-2492-9079)
- [x] Five white papers finalized March 17 (defensive publication / prior art / freedom to operate)
- [ ] Monograph upload to Zenodo (new DOI, references GUT)
- [ ] Establish GitHub → Zenodo workflow for future publications

### 2.6 🟢 COMMUNITY GROWTH
- [ ] Discord server growth: target 100+ active members
- [ ] Contributor onboarding pipeline
- [ ] Educational content series
- [ ] Peer review process for contributions

---

## TIER 3: SCALE (90+ Days)
*Vision for ecosystem maturity. No execution until Tiers 1–2 complete.*

### 3.1 NODE NETWORK
- [ ] Deploy first 4 nodes (Maxwell rigidity requirement)
- [ ] Mesh networking topology configuration
- [ ] Sovereign relay functionality
- [ ] Network health monitoring

### 3.2 PRODUCT MATURATION
- [ ] BONDING enhancements: breathing pacer (4-4-6), molecule soundtracks, advanced quest chains, accessibility improvements
- [ ] Spaceship Earth feature completion: Q-Factor coherence visualization, telemetry dashboard, cognitive load monitoring
- [ ] The Buffer: Fawn Guard + Chaos ingestion finalization
- [ ] Whale Channel: low-frequency, high-context communication

### 3.3 HARDWARE PRODUCTION (Node One)
- [ ] Only after Node Zero firmware sprint completes
- [ ] Finalize Node One hardware design
- [ ] Source component suppliers
- [ ] Manufacturing documentation
- [ ] Distribution strategy

### 3.4 REGULATORY & COMPLIANCE
- [ ] COPPA compliance framework (built, voluntary compliance recommended)
- [ ] HIPAA compliance for health data
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Security audit procedures

---

## EXECUTION PRINCIPLES

### Critical Success Factors
- **Neurodivergent-first design principles**
- **Open-source and community-driven ethos**
- **Technical excellence and security**
- **Sustainable funding model**
- **Replicable deployment process**

### Risk Mitigation
- Technical debt management
- Community burnout prevention
- Funding diversification
- Legal compliance monitoring
- Security vulnerability response

### Quality Standards
- All code must be tested and documented
- Accessibility compliance (WCAG 2.1 AA)
- Security-first development practices
- Performance optimization for low-resource devices
- User experience validation with target audience

---

## DEPENDENCY MAP

```
$425 (incorporation)
  └→ 501(c)(3) determination
       └→ EIN
            └→ SAM.gov registration (3–4 weeks)
                 └→ Federal grant pipeline
                      ├→ NIDILRR FIP ($250K/yr × 3)
                      ├→ NSF DARE ($100–200K/yr)
                      ├→ NSF CPS-CIR ($1M/4yr)
                      └→ RERC ($975K/yr × 5)

Housing stabilized
  └→ P31 development unblocked
       ├→ Node Zero firmware sprint
       ├→ Spaceship Earth bug fixes
       └→ phosphorus31.org polish

Psych eval completed
  └→ AuDHD vs. mania distinction on record
       └→ "Manic" label neutralized
            └→ Legal case posture strengthened
```

---

## COMPLETED (Mark Done)
- ✅ BONDING shipped March 10 (488 tests, 31 suites, PR #1 merged)
- ✅ Genesis Gate v4.1.0 deployed March 30
- ✅ Discovery response filed March 26
- ✅ Psychiatrist appointment completed March 24 (differential diagnosis on record)
- ✅ Reddit SuperStonk DD live
- ✅ Reddit blitz executed March 29 (7 subs)
- ✅ Discord server launched
- ✅ Ko-fi Wave 1 deployed
- ✅ Zenodo publication with DOI live (191 views, 163 downloads)
- ✅ ORCID integration configured
- ✅ Five white papers finalized March 17
- ✅ lv_init() root cause confirmed (Node Zero)
- ✅ Discovery response filed (Response & Objections + Cover Sheet + Financial Summary)
- ✅ COPPA compliance framework built
