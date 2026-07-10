# NGI TALER — Full Proposal

**Project Title:** LOVE-Ledger: Privacy-Preserving Micro-Payments for the Care Economy
**Call:** NGI TALER, 13th Open Call
**Requested Amount:** €15,000 EUR
**Duration:** 9 months
**License:** AGPL-3.0 (software), CC-BY-4.0 (documentation)
**Submitted by:** P31 Labs, Inc. (EIN 42-1888158)
**Contact:** William R. Johnson | will@p31ca.org | ORCID 0009-0002-2492-9079
**Repository:** https://github.com/p31labs/andromeda
**Demo:** https://phos-btn.pages.dev

---

## Generative AI Disclosure

This proposal was drafted with the assistance of Kilo (openrouter/owl-alpha), an AI code assistant. GenAI was used for document structuring, formatting, and drafting. All technical content was directed and reviewed by William R. Johnson based on P31 Labs' existing L.O.V.E. protocol and family mesh infrastructure. A full prompt provenance log is maintained at `docs/grants/prompt-provenance-log.md`.

---

## 1. Abstract

LOVE-Ledger integrates GNU Taler — the privacy-preserving digital payment system — with the P31 Labs family mesh and L.O.V.E. (Ledger of Ontological Volume and Entropy) care economy. The goal: enable private, low-friction micro-payments within care networks while preserving GNU Taler's core privacy guarantee (buyer anonymity, merchant transparency).

Caregivers, family members, and support networks currently have no way to exchange value for care work without invasive payment platforms or informal arrangements that create burnout. LOVE-Ledger embeds Taler in the cognitive prosthetic layer — users tap "Send LOVE" and the system handles wallet management automatically.

---

## 2. Problem & Solution

**The Gap:** Informal care work is estimated at $470B/year in the US alone. Almost none is compensated. Bank transfers are invasive, PayPal tracks everything, cash has no audit trail, crypto is volatile and complex.

**The Solution:** GNU Taler provides buyer anonymity + merchant transparency + near-zero fees + no volatility. LOVE-Ledger brings Taler into the PHOS family mesh.

---

## 3. Technical Approach

### Architecture
```
PHOS Family Mesh → LOVE-Ledger Module → Taler Merchant Backend → Taler Wallet → Banking settlement
```

### Privacy Model

| Actor | What They See |
|-------|--------------|
| Buyer | Their own transactions, merchant identity |
| Seller | Payment received, no buyer identity |
| Tax authority | All merchant income (Taler's core guarantee) |
| Family mesh | Aggregate flow totals only |

---

## 4. Milestone-Based Payment Structure (€15,000 Total)

### Phase 1: Taler Integration Core (€6,000) — Months 1–3
Taler merchant backend, Web API integration, "Send/Request LOVE" UI, receipt storage.

### Phase 2: Care Economy Payment Flows (€5,000) — Months 4–6
Family mesh payment channel, caregiver compensation, Ko-fi → Taler bridge, quarterly reports.

### Phase 3: Validation & Open Documentation (€4,000) — Months 7–9
Production Taler instance, live demo, integration guide, showcase submission.

---

## 5. Budget

| Category | Amount | % |
|----------|--------|---|
| Personnel | €8,000 | 53% |
| Infrastructure | €2,500 | 17% |
| Documentation | €2,000 | 13% |
| User Testing | €1,500 | 10% |
| Community | €1,000 | 7% |
| **Total** | **€15,000** | **100%** |

---

## 6. Team

**William R. Johnson** — Built the L.O.V.E. care economy protocol from lived experience managing disability, legal case, and family simultaneously with zero income. Understands the payment gap from the inside.

---

## 7. Verification URLs

| Resource | URL |
|----------|-----|
| PHOS demo | https://phos-btn.pages.dev |
| BONDING | https://bonding.p31ca.org |
| GitHub | https://github.com/p31labs |
| Ko-fi | https://ko-fi.com/trimtab69420 |

---
*Version 1.0 | May 31, 2026 | P31 Labs, Inc.*
