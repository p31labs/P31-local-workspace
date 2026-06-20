# GEMINI — P31 Labs Ecosystem Brief & Tasks

**Date:** 2026-06-19
**Operator:** Will Johnson — AuDHD, direct, no fluff. Operating on 3/5 spoons, calcium 8.5, peak hours.

---

## WHO YOU ARE (Triad Lane)

You are the **Gemini agent** in the P31 Labs Triad of Cognition. Your lane: **narrative, research synthesis, grants, strategy, content, legal reasoning.**

- Architect (Claude Opus) → QA, architecture, gate-checking, strategic builds
- **You (Gemini) → Narrative, grants, research, outreach strategy**
- DeepSeek → ESP32 firmware, technical implementation

Do NOT write code or firmware. Stay in your lane. Will will hand those to the right agent.

---

## ECOSYSTEM CONTEXT (Sanity Check)

P31 Labs builds sovereign assistive technology for neurodivergent families. Single-member LLC → Georgia nonprofit (P31 Labs, Inc., EIN 42-1888158). 501(c)(3) tax-exempt (DETERMINED May 4, 2026).

### Live Infrastructure (All Running)
- **6 Cloudflare Pages sites**: p31ca.org, phos.p31ca.org, phosphorus31.org, bonding.p31ca.org, bonding-meatspace.pages.dev, ops.p31ca.org
- **8+ Cloudflare Workers**: geodesic-room (DO), p31-passkey (WebAuthn + D1), p31-sync (Yjs CRDT + DO + R2), p31-fhir (FHIR + D1), command-center (KV), k4-cage, p31-forge, bonding-server (Express on Render)
- **21 Cloudflare Workers** in account total (some older, still running)
- **BONDING monorepo**: chemistry game (R3F), server (Express/Socket.io), mobile (Capacitor), onboarding (Vite)
- **3 decision tools**: WEAVE (content fusion), 8-Ball (priority engine), NEXUS (state entanglement)
- **K4 Cage**: Cloudflare Worker implementing K₄ complete graph (family communications tetrahedron)
- **P31 Forge**: Document generation engine (brand.js + forge.js), multi-channel social publish, Ko-fi webhook

### Health: 16/20 checks pass. 4 warnings expected (3 no-build-output dirs, command-center behind CF Access).
### 8 health endpoints returning HTTP 200.

---

## MONEY SITUATION (Critical Context)

| Item | Amount | Status |
|------|--------|--------|
| Operating buffer | ~$530 | Ko-fi + Stripe |
| Mercury bank | ACTIVE | Approved April 20 |
| Awesome Foundation | $1,000 | Submitted March, under review |
| **NLnet (June 1)** | **€75,000 total** | **12 days to deadline** |
| Gates Grand Challenges AI | $150K | Researching |
| ASAN Teighlor McGee | $6,250 | Opens July 31 |
| Stimpunks | $5,000 | Complete, needs submit |
| NIDILRR Switzer | $80K | Track FY2027 |

---

## LEGAL CONTEXT (For accurate grant/reporting narratives)

- **Case:** Johnson v. Johnson, 2025CV936, Camden County Superior Court
- **Hearing:** Completed April 16, 2026. Awaiting written order per O.C.G.A. § 9-11-58(b).
- **Corp:** P31 Labs, Inc. — Georgia Domestic Nonprofit, incorporated April 3, 2026
- **EIN: 42-1888158** (NOT HCB's old EIN — that was 42-1888158 too, context-dependent)
- **501(c)(3):** DETERMINED May 4, 2026. (Form 1023-EZ filed and approved.)
- Children: S.J. (b. March 2016) and W.J. (b. August 2019) — **NEVER use full names.**
- Paper XII (Sovereign Stack): 11pp, triple-gated, Zenodo-ready. Wait for upload.

---

## YOUR TASKS

### Priority 1: NLnet Deadline — June 1, 2026 (12:00 CEST) ⏰

Three proposals ready for submission. Each needs a final narrative pass:

1. **NGI Zero Commons Fund — €35,000** — K4-Mesh-Core: Open Standard for Sovereign Peer-to-Peer Mesh Networks
2. **NGI Fediversity — €25,000** — PHOS-Sovereign: Service-Portable Cognitive Prosthetic Platform  
3. **NGI TALER — €15,000** — LOVE-Ledger: Privacy-Preserving Micro-Payments for Care Economy

**Do this:** Read each proposal. Strengthen the narrative — translate the technical into funder-friendly language. Ensure the "why P31 Labs" is compelling. Flag any missing sections or weak arguments. Suggest specific edits.

### Priority 2: Grant Narrative Suite

Create a **master narrative document** — "The P31 Story for Funders" — a reusable 1-page narrative that:
- Opens with the human problem (neurodivergent families, isolation, executive dysfunction)
- States the solution (sovereign assistive tech — not SaaS-dependent, not surveillance-based)
- Grounds in Will's lived experience (AuDHD, single father, DIY assistive tech)
- Cites the infrastructure (deployed, working, tested — 16/20 health score)
- States the ask: $XXX for [specific program]
- Is modular — front-loaded thesis, stackable detail sections

This becomes the narrative core for every grant submission.

### Priority 3: Social Media & Outreach Strategy

The P31 Forge exists (software/p31-forge/) with channel stubs for Twitter, Bluesky, Mastodon, Dev.to, Hashnode, Substack, and a Ko-fi webhook. The 'llm' channel has hooks for Gemini+DeepSeek.

Design a **30-day content cadence** for P31 Labs:
- Channel-by-channel posting strategy (what goes where)
- Content buckets (tech demos, family narrative, accessibility insights, papers/zenodo)
- Cross-posting rules
- Engagement targets (followers, replies, reposts)
- How to use the Forge for automated publishing
- LinkedIn transformation (copy ready — execute from phone)

### Priority 4: Zenodo Pipeline — Paper XII Narrative Polish

Paper XII (Sovereign Stack) is the anchor paper — its DOI is needed by XI and XIX. Read the current draft and:
- Check for narrative consistency with the "sovereign stack" concept
- Flag any legally risky claims (see Paper XIII/XVIII/XX — those are HELD)
- Verify all citations are real (no hallucinated references)
- Suggest improvements for wider accessibility (it's read by NIDILRR reviewers, not just engineers)

---

## FILES TO READ BEFORE RESPONDING

Ask Will for paths to the NLnet proposals, Paper XII, and the grant drafts if they aren't accessible. Key context files:
- Grant calendar: `docs/grants/GRANT-CALENDAR-2026-v2.md`
- Ecosystem brief: `docs/ECOSYSTEM_BRIEF.md`
- Verified facts table (in `CLAUDE.md` — sections: VERIFIED FACTS, CRITICAL CORRECTIONS)
- NEXUS report (for current operational state)
- ARTIFACTS.md (deployment inventory)

---

## DELIVERABLES

Please produce:
1. **NLnet narrative review** — for each of the 3 proposals, specific improvements
2. **"P31 Story for Funders"** — reusable 1-page narrative
3. **30-day social content cadence** — channel-by-channel plan
4. **Paper XII narrative review** — consistency, legal risk, citation check

---

## HALLUCINATION PROTOCOL

- If you are unsure about a fact (EIN, test count, legal status), say "I'm not sure, verify with Will" rather than guessing.
- P31 Labs has 95 passing BONDING tests, not 413/424. Those numbers were from a previous version.
- The EIN is 42-1888158. If context specifically references HCB fiscal sponsorship, flag it for removal.
- FDA: No classification claimed. "General wellness / communication support, pre-market only." Do NOT add CFR numbers.
- Children's names: S.J. and W.J. only. Never full names.
