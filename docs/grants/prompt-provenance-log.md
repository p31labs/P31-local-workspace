# Prompt Provenance Log — NLnet NGI Proposals

**Applicant:** William R. Johnson, P31 Labs, Inc.
**Date:** May 31, 2026
**Models Used:** Kilo (openrouter/owl-alpha)
**Purpose:** Drafting, structuring, and formatting grant proposals for three NLnet NGI programs

---

## Session: May 31, 2026

- **Model:** Kilo (openrouter/owl-alpha)
- **Prompts:**
  1. "we need to get PHOS set up in sort of a demo mode for the NLNET submission. I have to submit tonight and it isn't ready"
  2. "Both — full package" (in response to question about deploying PHOS + creating submission documents)
  3. "3 programs. zero commons, fediversity, and taler. i want a different submission for each."
  4. [NLnet Fediversity webpage content pasted]
  5. "account id: [REDACTED] / new rolled token: [REDACTED]"
- **Outputs:**
  - `docs/grants/grant-pipeline-v2.json` — full grant pipeline with 3 NGI programs
  - `docs/grants/payloads/ngi-zero-commons-proposal.md` — K4-Mesh-Core protocol proposal (€35K)
  - `docs/grants/payloads/ngi-fediversity-proposal.md` — PHOS-Sovereign data decoupling proposal (€25K)
  - `docs/grants/payloads/ngi-taler-proposal.md` — LOVE-Ledger care economy payments proposal (€15K)
  - `docs/grants/payloads/nlnet-submission-checklist.md` — submission checklist with verification URLs
  - `docs/grants/payloads/asan-narrative.md` — ASAN grant narrative ($6,250)
  - `docs/grants/payloads/stimpunks-application.md` — Stimpunks application ($5,000)
  - `docs/grants/GRANT-CALENDAR-2026-v2.md` — 2026 grant calendar
  - PHOS deployment to Cloudflare Pages (https://phos-btn.pages.dev)
  - `p31-constants.json` updated (status501c3 → determined_active)

---

## Summary

| Proposal | File | GenAI Role | Human Contribution |
|----------|------|------------|-------------------|
| NGI Zero Commons | `ngi-zero-commons-proposal.md` | Drafting, structure, formatting | Technical content (K4-Mesh-Core spec, protocol design, hardware details) from operator's existing knowledge |
| NGI Fediversity | `ngi-fediversity-proposal.md` | Drafting, structure, formatting | Technical architecture (PHOS surfaces, PGLite, NixOS module design) from operator's deployed system |
| NGI TALER | `ngi-taler-proposal.md` | Drafting, structure, formatting | Care economy model (L.O.V.E. protocol, family mesh) from operator's existing work |
| Grant pipeline | `grant-pipeline-v2.json` | JSON generation | Grant data, amounts, deadlines from operator's knowledge |
| Supporting docs | Various | Drafting | Content from operator's cognitive passport and project history |
| PHOS deployment | Cloudflare Pages | Deployment commands | Token/auth from operator |

**Note:** All three proposals are based on P31 Labs' existing deployed infrastructure (PHOS, BONDING, K4-Mesh hardware, Genesis Gate). GenAI was used for drafting, structuring, and formatting proposal documents. All technical claims reference deployed, verifiable systems. William R. Johnson reviewed and directed all content.

---
*Submitted in accordance with NLnet GenAI transparency policy (v1.1, January 26, 2026)*
