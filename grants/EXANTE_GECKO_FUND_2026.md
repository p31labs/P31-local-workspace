# EXANTE Gecko Fund — Proposal

| | |
|---|---|
| **Applicant** | P31 Labs, Inc. |
| **EIN** | 42-1888158 |
| **Operator** | William R. Johnson, Founder |
| **Contact** | will@p31ca.org |
| **Fund** | EXANTE Gecko Fund |
| **Amount Requested** | €50,000 |
| **Duration** | 12 months |
| **License** | AGPL-3.0 |

---

## 1. Project Title

**Shadow Bridge + L.O.V.E. Ledger — Critical Open-Source Infrastructure for Family Sovereignty**

---

## 2. Summary

The Shadow Bridge is a Cloudflare Worker that receives LOVE events from Roblox games via HTTP and routes them through KV into the Genesis Gate event bus — producing court-admissible telemetry chains for neurodivergent families. The L.O.V.E. Ledger is a blind-signature-based accounting system (adapting GNU Taler primitives) that quantifies care work as LOVE points, issued and verified without revealing who provided care or who received it.

Together, these two systems form the acquisition and accounting layer of the MEATSPACE spatial oasis: children enter through Roblox gameplay (the funnel), their interactions become cryptographic evidence of care (the ledger), and families maintain sovereign copies of every event (no central database, no data extraction).

We are requesting €50,000 to bring both systems to production readiness, deploy to 5 families, and establish the first open-source, privacy-preserving care accounting infrastructure.

---

## 3. Problem Statement

Care work in neurodivergent families is systematically invisible. Emotional labor, co-regulation, and mutual support between family members go uncounted in every economic system — including the digital ones. For families under active litigation, this invisibility is catastrophic: no objective, court-admissible record of children's emotional states exists.

Current mental health and family-tracking applications make the problem worse by extracting behavioral data into central servers — converting intimate family dynamics into surveillance assets. For families under litigation, this data is discoverable. Every app installation is a potential vulnerability.

The Shadow Bridge and L.O.V.E. Ledger solve this by:

- **Shadow Bridge:** Receiving LOVE events from Roblox gameplay (the only platform S.J. and W.J. voluntarily engage with) and routing them through a cryptographic telemetry chain — without any central database
- **L.O.V.E. Ledger:** Issuing blind-signature LOVE credits for care work, stored locally on each family device, interoperable with GNU Taler payment infrastructure
- **Genesis Gate:** Producing WCD-46-compliant SHA-256 hash chains for every event — court-admissible, independently verifiable

---

## 4. Technical Approach

### 4.1 Shadow Bridge — Roblox → Mesh Telemetry Pipeline

**Current state:** Live at shadow-bridge.trimtab-signal.workers.dev

- Cloudflare KV-backed player/session/event storage
- Endpoints: `/game/join`, `/game/leave`, `/game/action`, `/game/auth/spawn`, `/health`
- Roblox HttpService REST transport → Shadow Bridge Worker → Genesis Gate event bus
- R15 avatar compliance with `GetBoundingBox()` spatial math
- LOVE credit issuance on structural milestones via the game engine

**What €50K funds:**
- Production hardening: rate limiting, input validation, signed payloads
- Roblox Studio environment setup: Vinegar on Linux, R15 compliance, S.J./W.J. UserId mapping
- Lua transmitter scripts: Portal.lua (exit door → Cognitive Passport minting), ChatMirror.lua (OQE logging), BuildingSystem.lua (sandbox building with R15 spatial math)
- Pilot deployment: 5 families with Roblox-linked K₄ mesh entries

### 4.2 L.O.V.E. Ledger — Blind-Signature Care Accounting

**Current state:** Prototype — Solidty oracle + TypeScript Worker v1.3.0

The L.O.V.E. Ledger adapts GNU Taler's blind-signature primitives for care credit issuance rather than currency. In standard Taler, a coin is created by the exchange via blind signature: the wallet blinds a coin plan, the exchange signs it, and the wallet unblinds it — the exchange never learns which coin it signed. The Ledger inverts this: a Care Issuer (one family member) blinds a LOVE credit and signs it, producing a verifiable token that a Recipient (another family member) can later present to prove care was given — without revealing who issued it.

**Architecture:**
- Each K₄ mesh vertex maintains a complete copy of the LOVE ledger in IndexedDB
- Transactions propagate via WebSocket mesh broadcast using the K₄ Cage's hardened hibernation protocol
- Every LOVE ping is hash-chained into a Merkle-like append-only structure
- LOVE credits are soulbound by convention (no transfer endpoint)
- Two-pool model: sovereignty_pool (50%, immutable) + performance_pool (50%, liquid based on care_score)
- `availableBalance = (performancePool * careScore) / 1e18`

**What €50K funds:**
- GNU Taler exchange bridge: LOVE credits withdrawable to / depositable from standard Taler wallets
- Local-ledger v1.0: production IndexedDB implementation with CRDT merge
- Blind-signature issuance: Taler-compatible `blind-sign` and `verify-coin` operations
- Spoon-Aware Ledger Interface (SALI): 3 complexity modes driven by real-time spoon broadcasts
- Taler exchange checkpoint: Ledger can checkpoint against a Taler exchange as a trust anchor

### 4.3 Integration with MEATSPACE Ecosystem

The Shadow Bridge and L.O.V.E. Ledger integrate with the existing MEATSPACE stack:

| System | Integration Point |
|--------|-------------------|
| K₄ Cage | LOVE pings broadcast between 4 family mesh vertices |
| PHOS | Spoon-aware ledger interface (SALI) — adjusts complexity by cognitive load |
| BROS | Persona-switched care issuer (different family members can issue LOVE) |
| DADS | Task dispatch triggers LOVE credit minting on completion |
| Proof of Care | Care_Score = sum(T_prox × Q_res) + Tasks_verified modulates performance pool |
| Cognitive Passport | DIDs (`did:p31:`) used as LOVE credit recipients |

### 4.4 Court Admissibility

Every LOVE event produces:
1. A SHA-256 hash chain entry in Genesis Gate (WCD-46 standard)
2. An Ed25519 signature from the issuer's WebAuthn passkey
3. A timestamped, order-preserved event in Shadow Bridge KV
4. A LOVE credit minted in the local IndexedDB ledger

This produces a four-layer cryptographic audit trail suitable for evidentiary proceedings in family court — exactly the infrastructure the operator needs for Johnson v. Johnson, Civil Action No. 2025CV936.

---

## 5. Current State

### Shadow Bridge
- **Status:** Live, KV-backed, tested
- **Endpoints:** `/game/join`, `/game/leave`, `/game/action`, `/game/auth/spawn`, `/health`
- **Storage:** Cloudflare KV (genesis-gate integration)
- **Lua scripts:** Portal.lua, ChatMirror.lua — complete, ready for Studio
- **R15 migration guide:** Written, includes `GetBoundingBox()` spatial math fix
- **Test status:** Unit-tested; Studio integration pending (Vinegar setup)

### L.O.V.E. Ledger
- **Status:** Prototype — Smart contract + Worker v1.3.0
- **Smart contract:** `ProofOfCare.sol` — Care_Score oracle with 24h half-life decay
- **Worker:** `love-ledger.ts` — D1 + DO atomic transactions, two-pool model
- **Companion token:** _retired_ — `LOVEToken.sol` was archived; LOVE balances now live in the off-chain `love-ledger` worker (two-pool model). On-chain attestations are `LOVESBT` (ERC-5192) badges only.
- **Test status:** 40/40 Phenix Wallet tests pass; Ledger tests in development

### Genesis Gate
- **Status:** Live at genesis-gate.trimtab-signal.workers.dev
- **Function:** SHA-256 hash chain telemetry bus
- **Endpoints:** `POST /event`, `GET /events?since=...`

### @p31/game-engine
- **Status:** v0.1.0-alpha.0, 104/104 tests passing
- **Features:** Platonic solid building (icosahedron, dodecahedron, tetrahedron)
- **LOVE hooks:** Geometry primitives wired to LOVE credit issuance on structural milestones

---

## 6. Deliverables (12 Months)

| Phase | Duration | Deliverable | Acceptance Criteria |
|---|---|---|---|
| **Phase 1** | Months 1–3 | Shadow Bridge v1.0 | Roblox Studio integration, R15 compliance, 5 families with active LOVE event streams |
| **Phase 2** | Months 4–6 | L.O.V.E. Ledger core | Blind-signature issuance, local IndexedDB ledger, SHA-256 hash chain, Ed25519 passkey signing. All 104 existing tests pass + 50 new Ledger tests. |
| **Phase 3** | Months 7–9 | Taler integration spec | LOVE credits interoperable with GNU Taler wallets. Ledger ↔ Taler exchange bridge documented with protocol spec and reference implementation |
| **Phase 4** | Months 10–12 | Pilot deployment | 5 neurodivergent families running self-hosted Ledger instances. Family onboarding documentation. Community feedback report. Court admissibility validation in Camden County, GA |

---

## 7. Budget

| Line Item | 12-Month Amount |
|---|---|
| Lead developer (founder) | €12,000 (4 months × €3,000) |
| Roblox integration specialist (contract) | €10,000 (4 months × €2,500) |
| Taler integration specialist (contract) | €8,000 (4 months × €2,000) |
| Community testing stipends (5 families × €600) | €3,000 |
| Cloudflare Workers + KV + DO runtime | €2,000 (12 months) |
| Roblox/Hardware (Raspberry Pi, HRV sensors) | €3,000 |
| Documentation, accessibility audit, travel | €6,000 |
| Legal/court admissibility validation | €6,000 |
| **Total** | **€50,000** |

---

## 8. Open Source Commitment

All deliverables will be released under the **AGPL-3.0 License** and published to [github.com/p31labs](https://github.com/p31labs). Key repositories:

- `shadow-bridge` — Cloudflare Worker for Roblox → LOVE event routing (existing)
- `love-ledger-core` — Open-sourced Ledger v1.0 implementation (blind signatures, local-first)
- `love-ledger-taler-bridge` — GNU Taler ↔ L.O.V.E. Ledger integration specification
- `roblox-bridge` — Lua transmitter scripts + Vinegar Studio setup (existing)
- `k4-cage-pwa` — Existing K₄ mesh (relicensed AGPL-3.0, 104+ tests)

The L.O.V.E. Ledger's Taler integration will be **interoperable with the GNU Taler reference implementation** by design. LOVE credits can be converted to EUR at any Taler-accepting merchant, and Taler coins can be credited as LOVE at the Ledger level.

---

## 9. Why EXANTE, Why Now

**EXANTE's Gecko Fund** invests in "critical open-source infrastructure that powers the future of finance and digital sovereignty." The Shadow Bridge and L.O.V.E. Ledger are exactly this — but for the most underserved use case imaginable: neurodivergent family care.

The fund's focus on "long-term, patient capital for foundational projects" matches the 12-month clinical validation timeline. The €50K amount covers a single developer + two specialist contractors for one year — no equity, no IP transfer, no strings.

The operator's litigation timeline creates urgency: S.J. (10) and W.J. (7) need verifiable artifacts of care NOW. The technical infrastructure is 85% built. The talent exists. The open-source community is ready. What is missing is the funding to close the final gap.

---

*A proposal by P31 Labs, Inc. (EIN 42-1888158), a Georgia nonprofit corporation building sovereign cognitive infrastructure for neurodivergent families.*
