# Wyoming DUNA Feasibility Memo — P31 Labs

**Date:** 2026-07-22  
**Author:** P31 Labs  
**Status:** Internal assessment — not legal advice

---

## 1. Executive Summary

The Wyoming Decentralized Unincorporated Nonprofit Association (DUNA) Act (W.S. 17‑31‑101 et seq., enacted March 2024) provides a legal wrapper for DAOs operating with nonprofit purposes. This memo assesses P31 Labs' readiness to apply for a DUNA, maps current assets against statutory requirements, identifies gaps, and proposes a path forward.

**Bottom line:** P31 meets the substantive requirements (nonprofit purpose, governance structure, technical infrastructure). The single blocking gap is the **100-member minimum**. P31 currently has 18 pilot families. Reaching 100 requires a membership growth campaign. All other requirements are either met or achievable within 30 days.

---

## 2. DUNA Requirements Mapped to P31 Assets

| # | Requirement | Source | P31 Status | Gap |
|---|-------------|--------|------------|-----|
| 1 | **100+ members** | W.S. 17‑31‑102(a)(i) | 18 pilot families | **Blocking.** Need 82+ more. |
| 2 | **Nonprofit purpose** | W.S. 17‑31‑102(a)(ii) | 501(c)(3) Georgia nonprofit, EIN 42-1888158. Mission: "Building free, open-source assistive technology for neurodivergent families." | **Met.** |
| 3 | **Governance rules on‑chain** | W.S. 17‑31‑109 | LOVE Ledger provides SHA‑256 hash‑chained, Ed25519‑signed attestations. Two‑pool vesting enforces non‑extraction. On‑chain governance is technically feasible via existing D1 + Workers infrastructure. | **Technical infra exists.** Formal governance docs needed. See §4. |
| 4 | **No profit distribution to members** | W.S. 17‑31‑108(b) | Already a 501(c)(3). Two‑pool vesting (50% sovereignty pool is time‑locked) prevents extraction. Reasonable compensation for services is allowed. | **Met.** |
| 5 | **Administrator** | W.S. 17‑31‑110 | Must appoint a DUNA administrator to handle compliance, financials, court filings. | **Not designated.** Choose from existing team or retain. |
| 6 | **Registered agent in Wyoming** | W.S. 17‑31‑106 | Must maintain a registered agent with a physical Wyoming address. | **Not retained.** ~$50‑100/year from a service provider. |
| 7 | **Annual report** | W.S. 17‑31‑113 | Must file annual report with Wyoming Secretary of State. | **Not filed.** Template available. |
| 8 | **Smart contract deployable** | Requirement implied by DUNA definition | LOVE Ledger Worker is deployed on Cloudflare Workers. Federation-bridge provides API surface. All game endpoints are live. | **Met.** |
| 9 | **Member rights + voting** | W.S. 17‑31‑107 | Need to define: how members join (attestation), how they vote (proposal system), quorum rules. | **Not defined.** Governance protocol needed. |
| 10 | **Dissolution provisions** | W.S. 17‑31‑112 | Must define what happens to assets on dissolution (goes to another nonprofit, not members). | **Not defined.** Add to governance docs. |

---

## 3. What P31 Already Has (Assets)

| Asset | Relevance to DUNA |
|-------|-------------------|
| 501(c)(3) Georgia nonprofit, EIN 42-1888158 | Existing nonprofit status aligns with DUNA purpose requirement. Could potentially serve as the administrator entity or operate in parallel. |
| 18 pilot families in shared D1 `pilot_registry` | Foundation for membership. Each family has a DID, care history, and attestation record. |
| LOVE Ledger (SHA‑256 hash chain, Ed25519 signatures) | Court‑admissible care records. Demonstrates the "public benefit" activity the DUNA would govern. |
| Federation-bridge (`federation.p31ca.org`) | API surface for inter‑DUNA communication. Already handles attestations with DRRP. |
| 22 peer‑reviewed publications on Zenodo | Demonstrates research output and public knowledge contribution — aligns with nonprofit purpose. |
| 15 deployed Cloudflare Workers, 10 D1 databases | Proven operational infrastructure. No dependency on any single cloud provider for survival. |
| Sovereign Design System (tokens.yml, MCP server) | Demonstrates technical governance through versioned, auditable design contracts. |
| Open‑source (MIT) codebase | Aligns with nonprofit, public‑benefit mission. |
| Zero analytics, zero tracking | Privacy‑first design. Aligns with DUNA's nonprofit, non‑extractive ethos. |

---

## 4. Gap Analysis

### 4.1 Blocking: Membership Count

**Current:** 18 pilot families.  
**Required:** 100.  
**Gap:** 82 members.

**Bridging the gap:**

| Strategy | Effort | Timeline | Estimate |
|----------|--------|----------|----------|
| Pilot family expansion (organic) | Moderate | 3‑6 months | Each pilot family recruits 1‑2 families → 36‑54 members |
| Open membership (self‑service portal) | Build (2‑4 weeks) | 1‑2 months | A public sign‑up flow with DID creation + attestation onboarding. Existing pilot portal at `phos.p31ca.org/portal` can be extended. |
| Partnership with neurodivergent advocacy orgs | Outreach | 1‑3 months | Partner with existing nonprofits to onboard their communities. |
| Network Nations Alliance membership | Outreach | 1‑2 months | Alliance members become DUNA members. Reciprocal attestation. |

**Realistic timeline to 100 members:** 3‑6 months with a coordinated campaign.

### 4.2 Non‑blocking: Governance Documentation

Need to produce:
- **Bylaws / Operating Agreement:** Defines member rights, voting procedures, quorum, amendment process.
- **Administrator designation:** Who manages compliance, filings, financial reporting.
- **Dissolution clause:** Asset distribution plan (to another 501(c)(3) or public domain).
- **Member onboarding protocol:** How DIDs join, attestation requirements, credential issuance.

**Template sources:**
- Nouns DAO DUNA filing (2024) — publicly available governance docs
- Uniswap DUNI proposal (2025) — $16.5M allocation model, member voting structure
- Syndicate DAO financial disclosure (2025) — compliance reporting template

### 4.3 Non‑blocking: Wyoming Registered Agent

Cost: ~$50‑100/year. Options: Wyoming Registered Agent Services LLC, Northwest Registered Agent, ZenBusiness. 1‑day setup.

### 4.4 Non‑blocking: Smart Contract / Technical Governance

Requirement is that "on‑chain governance rules can legally bind the organization." P31's "on‑chain" equivalent is:
- D1 database (immutable audit trail via WAL + point‑in‑time recovery)
- Hash‑chained `love_chain` table (tamper‑evident)
- Ed25519‑signed attestations (cryptographic non‑repudiation)
- Federation‑bridge API (multi‑party attestation with DRRP)

**Question for legal counsel:** Does a D1 database with SHA‑256 hash chain and cryptographic signatures qualify as "on‑chain" under the DUNA Act? The statute defines "decentralized" broadly and does not mandate a specific L1 blockchain. Cloudflare D1 with WAL provides auditability comparable to a permissioned ledger. Legal interpretation needed.

---

## 5. Cost Estimate

| Item | One‑time | Annual |
|------|----------|--------|
| Wyoming registered agent | $0 | $50‑100 |
| Wyoming filing fee | $100 | $60 (annual report) |
| Legal consultation (initial) | $500‑2,000 | $0 |
| Administrator compensation | $0 (volunteer) | $0‑5,000 (if retained) |
| Governance doc drafting | $0 (in‑house templates) | $0 |
| **Total** | **$600‑2,100** | **$110‑5,160** |

These are low‑bound estimates. For reference: **SaucerSwap DAO's DUNA filing (June 2026) cost approximately US$80,000** for legal, registration, and implementation. SaucerSwap is a DeFi protocol with a treasury; P31's 501(c)(3) status and in‑house legal capability may reduce costs substantially. Self‑filing without counsel is permitted under the Act, though legal review is recommended for governance documents. The DUNA itself does not require paid counsel.

---

## 6. Recommended Path Forward

### Phase 1: Preparation (30 days)

1. **Retain Wyoming registered agent** — one‑time setup, ~$50.
2. **Draft governance documents** — adapt Nouns DAO or Uniswap DUNI templates.
3. **Designate administrator** — team member or external retainer.
4. **Legal consultation** — confirm D1 + hash chain qualifies as "on‑chain" under the Act.
5. **Build membership portal** — extend `phos.p31ca.org/portal` with self‑service DID creation + attestation flow.

### Phase 2: Growth (90 days)

1. **Launch open membership** — public sign‑up with attestation.
2. **Pilot family expansion** — each current family recruits 1‑2 new families.
3. **Partner outreach** — neurodivergent advocacy orgs, Network Nations Alliance.
4. **Target:** 100 members.

### Phase 3: Filing (30 days after reaching 100)

1. **File Articles of Organization** with Wyoming Secretary of State.
2. **Publish proof of 100 members** (signed attestations from the D1).
3. **Submit governance documents** (bylaws, administrator designation, dissolution clause).
4. **Issue first DUNA‑governed attestation** — a formal, legally‑recognized care receipt.

---

## 7. Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| 100‑member threshold not met | Medium | Phase membership growth; consider Wyoming UNA (no member minimum) as fallback |
| Legal interpretation of "on‑chain" excludes D1 | Low | Continue building; federal SSI legislation (HRES 248, 2025) may preempt |
| IRS conflict with 501(c)(3) status | Low | DUNA is unincorporated; can operate alongside existing nonprofit |
| Administrator liability | Low | DUNA provides limited liability; professional administrator insulates further |

---

## 8. Fallback: Wyoming UNA

If the 100‑member threshold proves insurmountable in the near term, Wyoming's standard Unincorporated Nonprofit Association (UNA) provides similar protections without the member minimum:

- **No minimum member count.** Can be formed with as few as 2 members.
- Same limited liability protections.
- Same nonprofit purpose requirement.
- Same ability to contract, hold assets, appear in court.
- **Downside:** Less recognition for DAO‑specific governance. The DUNA is specifically designed for on‑chain governance; the standard UNA is generic.

The UNA could serve as an interim step while membership grows toward the DUNA threshold.

---

## 9. Conclusion

P31 Labs is substantively ready for a Wyoming DUNA. The legal structure, technical infrastructure, nonprofit purpose, and community governance model all align with the Act's requirements. The sole blocking gap is membership count (18 of 100 required members).

A 4‑6 month campaign combining pilot family expansion, open membership, and strategic partnerships can close the gap. In the interim, a Wyoming UNA provides a lower‑friction legal wrapper.

**Recommendation:** Begin Phase 1 (preparation) immediately. File when the 100‑member threshold is reached. Use UNA as interim fallback if needed.

---

## References

- Wyoming DUNA Act (2024). W.S. 17‑31‑101 et seq.
- Nouns DAO DUNA Filing (2024). On‑chain governance proposal.
- Uniswap Foundation DUNI Proposal (2025). $16.5M UNI allocation + governance structure.
- Syndicate DAO Financial Disclosure (2025). First DUNA‑compliant financial report.
- HRES 248 (2025). U.S. House resolution emphasizing DLT for democratic governance.
