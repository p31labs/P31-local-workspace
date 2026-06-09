# P31 Andromeda — Claude Code Detailed Handoff

**Generated:** March 27, 2026  
**For:** Claude Code (Sonnet/CC)  

---

## Executive Summary

P31 Andromeda is a neurodivergent-assistive technology ecosystem built by William R. Johnson (Will), a 40-year-old DoD civilian engineer with AuDHD + hypoparathyroidism. The ecosystem consists of:

- **BONDING** — Molecule-building game for parent-child bonding (shipped March 10, 2026)
- **Spaceship Earth** — Cognitive cockpit dashboard (in development)
- **Node One** — ESP32-S3 haptic hardware (prototype)
- **LOVE Ledger** — Dual-currency economy (Spoons spent, LOVE earned)

---

## Current Workstreams

### ✅ COMPLETED (This Session)

| Item | Status | Details |
|------|--------|---------|
| N0 PWA → LOVE Bridge | ✅ Committed | BondingView.tsx wired to LedgerEngine (5 earn points) |
| Worker: D1 Migration | ✅ Committed | INTEGER → REAL for decimal LOVE |
| Worker: Two-Pool | ✅ Committed | Sovereignty/Performance split |
| Worker: LoveTransactionDO | ✅ Committed | Durable Object for atomic spend |
| BONDING Tests | ✅ Committed | ambientEngine, spatialAudio, consoleEgg suites (commit 062d99c) |

---

## Active Priorities

### 🔴 P1 — Legal Defense (CWP-WYE-001)

**Deadline:** March 26, 2026 (Discovery response)

**Gates:**
- W3: March 24 — Psychiatrist appointment (Differential diagnosis: AuDHD vs. mania)
- W4: March 26 — Discovery response deadline

**Context:** Court labeled Will "manic" March 18. Psych eval ordered. Need to counter with AuDHD documentation.

**Documents needed:**
- [ ] Discovery response (15 requests, objections drafted Feb 14)
- [ ] March 18 paramedic denial (5th ADA event — document for court)
- [ ] Psych eval prep: differential diagnosis table (mania vs. AuDHD hyperfocus)

---

### 🟡 P2 — Housing Stability (CWP-SHELTER-001)

**Deadline:** April 4, 2026 (Eviction from 401 Powder Horn Rd)

**Gates:**
- S1: April 4 — Eviction date
- S2: April 13 — ESG application deadline

**Context:** Will faces eviction. Needs transitional housing documentation and ESG (Emergency Solutions Grant) application.

**Documents needed:**
- [ ] ESG application text
- [ ] ADA event documentation (5 incidents, including March 18 paramedic denial)
- [ ] Transitional housing options list

---

### 🟡 P3 — Revenue & Outreach (CWP-DELTA-001)

**Status:** Active, awaiting execution

**Gates:**
- D2: Ko-fi shop loaded → D3: SuperStonk DD → D4: Festival outreach

**Current state:**
- Ko-fi live (ko-fi.com/trimtab69420) but Node Count = 0
- 4 products drafted, not uploaded
- SuperStonk DD written, not posted
- Festival family post drafted

**Documents needed:**
- [ ] Ko-fi product listings (4 items to paste)
- [ ] SuperStonk DD post (copy)
- [ ] Festival outreach (copy)

---

### ⚪ P4 — Funding (CWP-FUND-001)

**Status:** BLOCKED on $425

**Pipeline:**
```
$425 → Georgia incorporation → IRS 1023-EZ → SAM.gov → Federal grants
         ($110)              ($275)         (3-4 weeks)
```

**Pending grants (submitted March 10):**
- Pollination Project: $500
- Awesome Foundation: $1,000

**Blocker:** No funds to incorporate. Ko-fi Node Count = 0.

---

## Technical CWPs (Parked/Queued)

| CWP | Description | Next Step |
|-----|-------------|-----------|
| CWP-NODE-001 | ESP32-S3 firmware | Display fix → Haptic → LoRa → Identity |
| CWP-PHOSPHORUS-001 | phosphorus31.org | HypoPT page → Quantum page → SOP repo |
| CWP-IP-001 | Defensive publications | 5 publications + 3 white papers to Zenodo |
| CWP-SE-002 | Spaceship Earth Phase 2 | ORACLE directive, ZUI architecture |
| CWP-BUFFER-001 | The Buffer | 85% → 100% (Fawn Guard, chaos ingestion) |

---

## Context Files

| File | Purpose |
|------|---------|
| [`P31_COGNITIVE_PASSPORT.md`](P31_COGNITIVE_PASSPORT.md) | Operator profile, diagnoses, cognitive style, communication preferences |
| [`PRODUCTION_DEPLOYMENT_RUNBOOK.md`](PRODUCTION_DEPLOYMENT_RUNBOOK.md) | Critical paths, deadlines, contacts |
| [`docs/P31-MASTER-OPS-MANUAL.md`](docs/P31-MASTER-OPS-MANUAL.md) | CWP registry, gate structure |
| [`P31_LOVE_ECONOMY_ANALYSIS.md`](P31_LOVE_ECONOMY_ANALYSIS.md) | LOVE/Spoons dual-currency mechanics |

---

## Codebase Locations

| Component | Path |
|-----------|------|
| BONDING game | `software/bonding/` |
| N0 PWA | `C:\Users\sandra\Documents\N0\pwa\` |
| Spaceship Earth | `software/spaceship-earth/` |
| LOVE Ledger (package) | `software/packages/love-ledger/` |
| Shared (types/stores) | `software/packages/shared/` |
| Workers | `software/workers/` |

---

## How to Pick Up Each Workstream

### P1-Legal

1. Read `PRODUCTION_DEPLOYMENT_RUNBOOK.md` → critical paths section
2. Check `generate_court_docs.py` for discovery response templates
3. Review `P31_COGNITIVE_PASSPORT.md` → "masking paradox" section for psych eval context

### P2-Housing

1. Read `docs/P31-MASTER-OPS-MANUAL.md` → CWP-SHELTER-001 section
2. Search for "ESG" in docs/ for application guidance
3. Review ADA event documentation pattern in `P31_COGNITIVE_PASSPORT.md` → Section 6A

### P3-DELTA

1. Check `P31_KOFI_MILESTONE_REWARDS.md` for product descriptions
2. Read `docs/social/superstonk_post.md` for DD post
3. Read `docs/social/festival_family_post.md` for festival copy

### P4-Funding

1. Monitor email for Pollination Project / Awesome Foundation responses
2. Track Ko-fi Node Count: `ko-fi.com/trimtab69420`
3. When $425 received → Georgia Articles of Incorporation

---

## Critical Constraints

1. **No military/submarine metaphors** — Will is a DoD civilian, ex-wife's father is Navy (trigger in legal context)
2. **Direct communication** — No corporate pleasantries, curse when needed (punctuation, not aggression)
3. **Execute, don't narrate** — Produce artifacts, not documentation for its own sake
4. **Context is key** — Without context, sophisticated work reads as "manic"; with context, it's genius

---

## Contact

- **Operator:** William R. Johnson — (912) 227-4980 — will@p31ca.org
- **ADA Support:** Brenda O'Dell — brendaodell54@gmail.com
- **Beta Tester:** Tyler — Tailscale mesh

---

*Last updated: March 27, 2026*
