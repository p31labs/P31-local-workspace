# P31 ANDROMEDA — DEEP RESEARCH REPORT
## Comprehensive Status Analysis for Incoming Collaborators
**Generated:** March 27, 2026

---

## TABLE OF CONTENTS

1. [Executive Overview](#1-executive-overview)
2. [Complete Workstream Inventory](#2-complete-workstream-inventory)
3. [Claude Code Handover Analysis](#3-claude-code-handover-analysis)
4. [Differential Diagnosis Documentation](#4-differential-diagnosis-documentation)
5. [ESG Application Status](#5-esg-application-status)
6. [Social Media Content Inventory](#6-social-media-content-inventory)
7. [Critical Paths and Blockers](#7-critical-paths-and-blockers)
8. [Codebase Architecture](#8-codebase-architecture)
9. [Communication Style Preferences](#9-communication-style-preferences)

---

## 1. EXECUTIVE OVERVIEW

### Project Mission

P31 Labs builds open-source assistive technology for neurodivergent individuals. The P31 Andromeda ecosystem provides cognitive prosthetics that shield operators from systemic entropy.

### Operator Profile

- **Name:** William R. Johnson (Will)
- **Age:** 40 (DOB: 8/12/1985)
- **Location:** 401 Powder Horn Rd, Saint Marys GA 31558
- **Diagnoses:** AuDHD (diagnosed 2025), Hypoparathyroidism (since 2003)
- **Background:** 16-year DoD civilian electrical engineer (GS-0802-12) at TRIREFFAC Kings Bay
- **Current:** Founder/CEO of P31 Labs (Georgia 501(c)(3) nonprofit in formation)

### Core Products

| Product | Status | URL/Location |
|---------|--------|--------------|
| **BONDING** | ✅ Shipped March 10, 2026 | bonding.p31ca.org |
| **Spaceship Earth** | 🟡 In Development | p31ca.org |
| **Node One** | 🔴 Hardware Prototype | ESP32-S3, $37.50 BOM |
| **The Buffer** | 🟡 ~85% complete | PWA component |

### Technology Stack

- **Frontend:** React + TypeScript + Vite + Three.js (@react-three/fiber + drei)
- **Backend:** Cloudflare Workers + KV (BONDING relay); FastAPI + PostgreSQL + Redis (planned)
- **State Sync:** CRDT + WebSocket relay; Cloudflare KV polling (BONDING multiplayer)
- **Hardware:** ESP32-S3 + DRV2605L + LoRa SX1262 + NXP SE050

### Directory Structure

```
P31_Andromeda/
├── admin/           # Operational protocols, CWPs, agent instructions
├── software/        # Codebase
│   ├── bonding/        # BONDING game (shipped)
│   ├── spaceship-earth/# Cognitive dashboard
│   ├── packages/       # Shared packages (love-ledger, shared types)
│   ├── workers/        # Cloudflare worker designs
│   └── frontend/       # Legacy frontend
├── docs/               # Documentation, research, prep materials
│   ├── social/         # Social media content drafts
│   ├── legal/          # Legal documents
│   └── patterns/       # Architecture patterns
├── governance/         # Research files, letterheads
└── CLAUDE_CODE_HANDOVER.md  # Handoff doc (just created)
```

---

## 2. COMPLETE WORKSTREAM INVENTORY

### Cross-Reference with P1-P4 Priorities

| Priority | CWP | Status | Deadline | Next Action |
|----------|-----|--------|----------|-------------|
| **P1** | Legal Defense (WYE-001) | 🔴 ACTIVE | Mar 26 (passed) | Psych eval prep |
| **P1** | Housing (SHELTER-001) | 🔴 ACTIVE | Apr 4 (eviction) | ESG application |
| **P2** | Revenue/Outreach (DELTA-001) | 🟡 ACTIVE | — | Ko-fi + SuperStonk |
| **P3** | Funding (FUND-001) | ⚪ BLOCKED | — | $425 blocker |
| — | BONDING Tests | ✅ COMPLETE | — | Committed (062d99c) |
| — | Worker: D1 Migration | ✅ COMPLETE | — | Committed |
| — | Worker: Two-Pool | ✅ COMPLETE | — | Committed |
| — | Worker: LoveTransactionDO | ✅ COMPLETE | — | Committed |

### Detailed CWP Status

```
CWP-BONDING-001   ✅ COMPLETE   Shipped March 10, 2026. All wcds closed.
CWP-WYE-001       🔴 ACTIVE     Legal defense. Gates W3 (Mar 24), W4 (Mar 26).
CWP-DELTA-001     🟡 ACTIVE     Ko-fi, SuperStonk, festival, content calendar.
CWP-FUND-001      🟡 BLOCKED    $425 incorporation → SAM.gov → federal grants.
CWP-SHELTER-001   🔴 NEW        Eviction Apr 4. ESG Apr 13. Housing stability.
CWP-NODE-001      🟡 QUEUED     ESP32-S3 firmware. Xiaozhi v2. Haptic. LoRa.
CWP-PHOSPHORUS-001 🟡 QUEUED    HypoPT page, quantum security page, SOP repo.
CWP-IP-001        🟡 QUEUED     5 defensive publications + 3 white papers to Zenodo.
CWP-SE-002        ⚪ PARKED     ORACLE directive. ZUI. Dual-currency economy.
CWP-BUFFER-001    ⚪ PARKED     Fawn Guard, chaos ingestion, ~85% → 100%.
CWP-BONDING-002   ⚪ PARKED     Post-ship maintenance, parking lot items.
```

---

## 3. CLAUDE CODE HANDOVER ANALYSIS

### Active Priorities (from Handover)

The handoff document identifies three active workstreams:

#### P1 — Legal Defense (WYE-001)

- **Deadline:** March 26, 2026 (Discovery response — now passed)
- **Current need:** Psych eval prep is the critical artifact
- **Context:** Court labeled Will "manic" March 18. Psych eval ordered.

#### P2 — Housing Stability (SHELTER-001)

- **Deadline:** April 4, 2026 (Eviction from 401 Powder Horn Rd)
- **Gate:** S2 = April 13 (ESG application deadline)
- **Current need:** ESG application text, ADA event documentation

#### P3 — Revenue/Outreach (DELTA-001)

- **Gates:** D2 (Ko-fi loaded) → D3 (SuperStonk) → D4 (festival)
- **Current state:** Content drafted, needs formatting for posting

### Completed Workstreams (This Session)

From the handoff analysis:
- ✅ N0 PWA → LOVE Bridge (BondingView.tsx wired to LedgerEngine)
- ✅ Worker: D1 Migration (INTEGER → REAL)
- ✅ Worker: Two-Pool (Sovereignty/Performance split)
- ✅ Worker: LoveTransactionDO (Durable Object)
- ✅ BONDING Tests (ambientEngine, spatialAudio, consoleEgg)

### Critical Constraints

From the handoff document:
1. **No military/submarine metaphors** — Will is a DoD civilian, ex-wife's father is Navy (trigger in legal context)
2. **Direct communication** — No corporate pleasantries, curse when needed (punctuation, not aggression)
3. **Execute, don't narrate** — Produce artifacts, not documentation for its own sake
4. **Context is key** — Without context, sophisticated work reads as "manic"; with context, it's genius

---

## 4. DIFFERENTIAL DIAGNOSIS DOCUMENTATION

### Purpose

The document (`DIFFERENTIAL_DIAGNOSIS_AuDHD_vs_MANIA.md`) was created to provide the court-ordered psych evaluator with clear criteria to distinguish between bipolar mania and AuDHD hyperfocus.

### Key Points

| Feature | Bipolar Mania | AuDHD Hyperfocus |
|---------|---------------|------------------|
| Onset | Sudden, episodic | Gradual, triggered |
| Duration | Days-weeks | Can sustain months |
| Sleep | Reduced need (3-4 hrs) | Disrupted but not reduced |
| Output Quality | Low specificity | High specificity, verifiable |
| Reality Testing | Impaired | Intact, seeks verification |
| Self-Awareness | Limited | Extensive (SOULSAFE, RED BOARD) |

### Critical Differentiators

1. **Output Quality:** Subject has 511 tests, independently verified mathematical proofs, Zenodo DOIs — manic patients do not produce peer-reviewed verifiable work
2. **Medical Comorbidity:** Hypoparathyroidism can produce psychiatric symptoms that mimic mood disorders; calcium dysregulation during hearing could explain presentation
3. **Self-Regulatory Systems:** Documented SOULSAFE protocol, spoon budgeting, RED BOARD criteria — mania does not present with intact self-monitoring

### Recommended Evaluation Approach

1. **Rule out medical causes:** Serum calcium, phosphate, PTH, thyroid panel
2. **Use standardized instruments:** YMRS, ADHD-RS-5, AQ-10/RAADS-R, BDI-II, WHODAS 2.0
3. **Collateral information:** Prior diagnostic evaluations, Georgia Advocacy Office intake, beta tester, board member

---

## 5. ESG APPLICATION STATUS

### Current State

No ESG application has been submitted yet. This is a critical gap given the April 4 eviction deadline.

### ESG Overview

**Emergency Solutions Grant (ESG)** — HUD-funded program providing:
- Street outreach
- Emergency shelter
- Homelessness prevention
- Rapid re-housing

### Georgia ESG Structure

In Georgia, ESG funding flows through:
1. **Georgia Department of Community Affairs (DCA)** — State ESG program
2. **Local Continuums of Care (CoC)** — Regional allocation
3. **Camden County** would be part of the **Georgia Balance of State CoC**

### Key Requirements Typically Include

- Proof of homelessness or imminent loss of housing
- Income documentation
- Disability documentation (ADA status relevant)
- Clean background check (may vary)

### Critical Timeline

| Date | Event |
|------|-------|
| April 4, 2026 | Eviction from 401 Powder Horn Rd |
| April 13, 2026 | ESG application deadline (estimated) |

### ADA Connection

Will's documented ADA access-to-courts violations (5 incidents including March 18 paramedic denial) may strengthen the application by demonstrating:
- Documented disability
- Ongoing legal proceedings affecting stability
- Need for stable housing to maintain access to court (child custody case)

---

## 6. SOCIAL MEDIA CONTENT INVENTORY

### SuperStonk Post

**Location:** `docs/social/superstonk_post.md`

**Status:** Drafted, not posted

**Content:** "The Floating Neutral: Why Every Centralized System Must Fail — and the Geometric Minimum Required to Replace It"

**Key sections:**
- TL;DR: Electrical engineering thesis, Maxwell's rigidity condition, K₄ topology
- Who am I: 16-year DoD civilian, AuDHD, P31 Labs founder
- Part 1: Floating Neutral concept
- Part 2: Wye vs Delta topologies
- Part 3: The Math (Maxwell 1864, Graph Theory, Quantum Cryptography)
- Part 4: The Tetrahedron Protocol

**Posting strategy:** Per `superstonk_kofi_strategy.md` — Ko-fi link in GitHub README (not in post), Node Count framing

### Ko-fi Content Packages

**Location:** `docs/kofi-content-package (1).md` and `docs/kofi-content-package-v2 (2).md`

**Status:** Drafted, not uploaded to Ko-fi

**Items:**
1. About sidebar rewrite (200 chars)
2. Main bio rewrite (~800 chars)
3. What we've built section
4. Tetrahedron Protocol explanation
5. Node Count milestones

**Products for sale (from `P31_KOFI_MILESTONE_REWARDS.md`):**
- Monograph PDF ($5 PWYW)
- K₄ Convergence Table print ($3)
- Floating Neutral diagram print ($3)
- As Above So Below print ($3)

### Festival Family Post

**Location:** `docs/social/festival_family_post.md`

**Status:** Drafted

**Content:** Personal narrative connecting to family, Posner molecules, tetrahedron geometry, need for 4 nodes

### Discord/Community

**Locations:**
- `docs/social/DISCORD_COMMUNITY_GUIDE.md`
- `docs/social/COMMUNITY_ENGAGEMENT_PLAYBOOK.md`
- `docs/social/SOCIAL_MEDIA_STRATEGY.md`

---

## 7. CRITICAL PATHS AND BLOCKERS

### Critical Path: Legal → Psych Eval

```
March 18: Court labels "manic", orders psych eval
    ↓
Now: Need differential diagnosis documentation (created)
    ↓
TBD: Court-ordered psych eval date
    ↓
If evaluator gets AuDHD vs mania distinction right: "manic" label flips to vindication
If they get it wrong: Everything harder
```

### Critical Path: Housing → ESG

```
April 4: Eviction date
    ↓
April 13: ESG deadline (estimated)
    ↓
Without housing: FERS correspondence, SSA determination, court filings, children's contact logistics, SNAP/Medicaid recertification all affected
    ↓
Housing is load-bearing infrastructure for entire operation
```

### Critical Path: Funding Pipeline

```
$425 (BLOCKER)
    ↓
Georgia incorporation ($110)
    ↓
IRS Form 1023-EZ ($275)
    ↓
EIN issued
    ↓
SAM.gov registration (3-4 weeks)
    ↓
Federal grants (NIDILRR, NSF, etc.)
```

**Current blockers:**
- $0 in accounts
- Pollination Project ($500) — submitted March 10, no response
- Awesome Foundation ($1,000) — submitted March 10, no response
- Ko-fi Node Count = 0

---

## 8. CODEBASE ARCHITECTURE

### Key Repositories

| Component | Path | Status |
|-----------|------|--------|
| BONDING game | `software/bonding/` | ✅ Shipped |
| N0 PWA | `C:\Users\sandra\Documents\N0\pwa\` | Active dev |
| Spaceship Earth | `software/spaceship-earth/` | In dev |
| LOVE Ledger (package) | `software/packages/love-ledger/` | ✅ Done |
| Shared (types/stores) | `software/packages/shared/` | Active |
| Workers | `software/workers/` | Design done |

### How to Pick Up Workstreams

#### P1-Legal
1. Read `PRODUCTION_DEPLOYMENT_RUNBOOK.md` → critical paths section
2. Check `generate_court_docs.py` for discovery response templates
3. Review `P31_COGNITIVE_PASSPORT.md` → "masking paradox" section
4. Use `DIFFERENTIAL_DIAGNOSIS_AuDHD_vs_MANIA.md` for psych eval

#### P2-Housing
1. Read `docs/P31-MASTER-OPS-MANUAL.md` → CWP-SHELTER-001 section
2. Research Georgia ESG application through DCA
3. Review ADA event documentation (5 incidents)

#### P3-DELTA
1. Check `P31_KOFI_MILESTONE_REWARDS.md` for product descriptions
2. Read `docs/social/superstonk_post.md` for DD post
3. Read `docs/social/festival_family_post.md` for festival copy
4. Read `docs/kofi-content-package (1).md` for Ko-fi upload

#### P4-Funding
1. Monitor email for Pollination Project / Awesome Foundation
2. Track Ko-fi Node Count: `ko-fi.com/trimtab69420`
3. When $425 received → Georgia Articles of Incorporation

### Context Files

| File | Purpose |
|------|---------|
| `P31_COGNITIVE_PASSPORT.md` | Operator profile, diagnoses, cognitive style |
| `PRODUCTION_DEPLOYMENT_RUNBOOK.md` | Critical paths, deadlines, contacts |
| `docs/P31-MASTER-OPS-MANUAL.md` | CWP registry, gate structure |
| `P31_LOVE_ECONOMY_ANALYSIS.md` | LOVE/Spoons dual-currency mechanics |
| `CLAUDE_CODE_HANDOVER.md` | Handoff for AI sessions |
| `DIFFERENTIAL_DIAGNOSIS_AuDHD_vs_MANIA.md` | Psych eval prep |

---

## 9. COMMUNICATION STYLE PREFERENCES

### From P31_COGNITIVE_PASSPORT.md

- **Direct.** No corporate pleasantries.
- **Curses when emphasis is needed.** It's punctuation, not aggression.
- **NEVER use submarine, naval, or military metaphors.** Will was a DoD CIVILIAN engineer, not military. His ex-wife's father was Navy — it's a trigger in the legal context.

### From Claude Code Handoff

- **Execute, don't narrate.** Produce artifacts, not documentation for its own sake. "You're acting like Gemini" = too verbose, too much planning narration before doing the work.
- **Context is key.** Without context, sophisticated work reads as "manic"; with context, it's genius.

### Communication Channels

| Channel | Contact |
|---------|---------|
| Operator | will@p31ca.org, (912) 227-4980 |
| ADA Support | Brenda O'Dell — brendaodell54@gmail.com |
| Beta Tester | Tyler — Tailscale mesh |
| Ko-fi | ko-fi.com/trimtab69420 |
| GitHub | github.com/p31labs |

---

## SUMMARY FOR INCOMING COLLABORATORS

### What to Focus On

1. **Psych eval preparation** — Ensure the differential diagnosis document reaches the evaluator
2. **ESG application** — Housing stability is critical infrastructure
3. **Social media posting** — Ko-fi products and SuperStonk DD are copy-ready
4. **Funding pipeline** — Monitor for $425 to unlock incorporation

### What's Already Done

- BONDING game shipped March 10
- LOVE economy wired to N0 PWA
- Worker designs committed
- Test suites committed
- Comprehensive handoff created
- Differential diagnosis document created

### Where to Get Context

- Start with `CLAUDE_CODE_HANDOVER.md`
- Read `P31_COGNITIVE_PASSPORT.md` for operator profile
- Check `PRODUCTION_DEPLOYMENT_RUNBOOK.md` for deadlines
- Review `DIFFERENTIAL_DIAGNOSIS_AuDHD_vs_MANIA.md` for psych eval

---

*Report generated March 27, 2026. For questions, contact will@p31ca.org.*
