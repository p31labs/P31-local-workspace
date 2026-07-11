# L5 — CREATION ECONOMY: INTENT-DRIVEN WORKER MODEL

**Status:** CONCEPTUALIZED → SCAFFOLDED
**Parent:** CWP-2026-009 (Sierpinski Expansion), Axis L5
**Geometry:** IntentResolver → Execution/UIG → CreationAccountant → Dual Settlement
**Author:** trimtab-signal / p31

---

## 1. The Paradigm Shift: Extraction → Co-Creation

The dominant agentic economy is **extractive**. Every API call, every MCP tool
invocation, every inference is metered and billed. Incentives align with
inefficiency — the more compute you burn, the more you pay. The worker is a
vendor; the user is a consumer; the relationship is transactional.

L5 flips the model. What if the worker were a **peer** — one that settles on
**value created for the user**, not value extracted from them?

| Axis | Extractive (L3/L4) | Co-Creative (L5) |
| :--- | :--- | :--- |
| Core metric | Compute / tokens consumed | Spoons saved / capability generated |
| Relationship | Vendor / Consumer | Peer / Co-creator |
| Pricing | Cost-plus (API overhead) | Value-based (Creation Quote) |
| Incentive | Maximise processing time | Minimise friction, maximise care |
| Settlement | Fiat / crypto tollbooth | Dual-choice (LOVE care-credit or x402 fiat) |
| Receipt | Invoice | Creation receipt (LOVE ledger) |

> **"Workers like people."** A worker that *creates with you* is not a worker
> that *charges you*. L5 is the layer that closes that loop.

---

## 2. Intent-Driven Architecture

The standard API gateway (tollbooth) is replaced by an intent-driven loop:

```
User Request
     │
     ▼
┌──────────────────────────────────────────────────────────────┐
│  INTENT RESOLVER  (software/workers/intent-resolver)       │
│   • Reads Cognitive Passport (v4.1)                         │
│   • Receives SpoonState (0–5) from the caller (renderer)   │
│   • Parses raw prompt → structured intent                    │
│   • Generates a capability plan (MCP tools + A2UI surface)  │
│   • Returns a Creation Quote (no execution)                   │
└──────────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────────────┐
│  EXECUTION & UIG  (existing interface-generator)            │
│   • Worker generates the InterfaceDescription                │
│   • A2UI v0.9 surface rendered to user                   │
│   • User interacts (spoons adjust in real time)            │
└──────────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────────────┐
│  CREATION ACCOUNTANT  (software/workers/creation-accountant)│
│   • Measures pre/post SpoonState delta (trustless oracle)  │
│   • Verifies the Creation Quote was delivered              │
│   • Writes a creation receipt to the LOVE ledger          │
│   • Settles via user-choice routing (LOVE or x402)       │
└──────────────────────────────────────────────────────────────┘
```

**Trustless oracle:** spoon delta is measured by the *renderer* (the
`data-spoons` pre/post value the client reports), **not** by the agent. The
worker cannot fabricate its own creation value.

---

## 3. Core Components (Production Scaffolding)

| Component | Location | Purpose |
| :--- | :--- | :--- |
| IntentResolver | `software/workers/intent-resolver/` | Parse intent → Creation Quote |
| CreationAccountant | `software/workers/creation-accountant/` | Measure value → LOVE receipt |
| Dual Settlement Router | Extends `software/workers/mcp-x402-gateway/` | `X-Creation-Unit` routing |
| LOVE Issuer | Extends `apps/phos/src/workers/love-ledger/` | Blind-signed LOVE credit |

All four are scaffolded (see CWP-2026-010). Implementation notes:
Web Crypto API only (no Node `crypto`), D1 batch transactions for atomicity,
Hono `zValidator` for input parsing.

---

## 4. Dual / User-Choice Settlement (Ratified)

Intent resolves whether the exchange settles in **creation-credit** or **fiat** —
the user picks at the point of value realisation.

| Unit | Mechanism | Network | Use case |
| :--- | :--- | :--- | :--- |
| **LOVE** | GNU Taler blind-signature | Off-chain (D1) | Care-network participants, creators |
| **USDC** | x402 protocol | Base (Sepolia/mainnet) | External users, enterprises |

- **LOVE path:** non-extractive. Earn LOVE by creating (interfaces, care
  records, translations); spend to receive creation. Net-positive creators
  subsidise their own infrastructure.
- **USDC path:** keep x402 USDC but reprice `PRICING` by *value created*,
  not per-call (already built in L3.2/L3.4).
- Gateway emits `Payment-Signature` + `X-Creation-Unit: love|usdc`.

### LOVE Two-Pool Vesting (Anti-Gaming) — Ratified
- **Pool 1 (Earned):** LOVE earned via creation is subject to a **90-day linear
  vesting** schedule. The latency breaks the immediate feedback loop required
  for Sybil-style gaming.
- **Pool 2 (Spendable):** LOVE can be spent immediately if earned via
  **reciprocal creation** (two-party care records).
- Audit trail: the CreationAccountant writes receipts; the LOVE ledger already
  supports vesting (`love_stakes`).

---

## 5. Integration Points (Already Shipped)

| Component | L5 role | Commit |
| :--- | :--- | :--- |
| `@p31/interface-generator` | Generates UIG surfaces from intent | `9bb2a90` |
| A2UI v0.9 adapter + renderer | Renders the creation surface | `cf7b494` |
| LOVE ledger (D1 hash-chain) | Stores creation receipts | `bf8c991` |
| mcp-x402 Worker | Handles x402 settlement (fallback) | `bf8c991` |
| Cognitive Passport (v4.1) | Identity + spoon state | `e9821ec` |
| data-spoons / UIG renderer | Measures pre/post spoon delta | `408180f` |
| TRIPER cert | Gates system integrity | `777051a` |

---

## 6. Architectural Refinements (Ratified)

1. **GNU Taler blindness vs ledger provenance.** The CreationAccountant signs
   LOVE issuance blindly (Clause Blind Schnorr), preserving user privacy when
   they *spend*. But the D1 creation receipt **must** link the **Worker DID**
   to the generated value — to maintain the public care-reputation of the
   network's agents without compromising the user.
2. **The "Failed Intent" state.** If the IntentResolver quotes a capability
   the CreationAccountant later proves was **not** delivered (e.g. the user's
   SpoonState *decreases* due to friction), the transaction **voids the quote**
   and logs a **minor penalty** to the worker's reputation index on the LOVE
   ledger (D1 `creation_penalties` table — see migration `003`).

---

## 7. Grant Narrative Insert

> *Redefining the Agent Economy.* Traditional autonomous systems operate on
> an extractive "tollbooth" model — charging per token or compute cycle,
> inherently misaligning incentives toward inefficiency. P31 proposes a paradigm
> shift: an **intent-driven Creation Economy**. By integrating an IntentResolver
> and CreationAccountant tied to the user's Cognitive Passport, our agents
> measure and settle based on **value created** (cognitive load reduced, time
> saved, interfaces generated) rather than resources consumed. Settled via
> dual mechanisms (fiat via x402 or localized 'LOVE' care-credits via GNU
> Taler), this model transforms the AI from a rent-seeking service into a
> cooperative peer — forging a sustainable, user-aligned digital commons.

(Woven into the NLnet + Exante grant packs; see CWP-2026-009 §L5.)

---

## 8. Open Questions — RATIFIED

| Question | Ratified answer |
| :--- | :--- |
| How is value-created measured? | Pre/post `data-spoons` delta (0–5), captured **by the renderer**, not the agent — a trustless oracle. |
| Can agents over-claim creation? | LOVE two-pool vesting + audit trail (receipts) prevent gaming. |
| Regulatory status of LOVE? | Off-chain care accounting (not a token sale). Bound to ERC-5192 locked SBTs → strictly non-transferable. |
| Net-extractors? | Frictionless x402 fallback; they spend USDC, creators earn LOVE — self-balancing. |

---

## 9. Next Steps (After Forging the Grants)

1. Scaffold IntentResolver Worker (Hono + `zValidator`, UIG `generateInterfaceFromIntent`).
2. Add `/intent` route → returns Creation Quote without executing.
3. Extend mcp-x402 Worker → `X-Creation-Unit` header routing + `POST /mcp` bridge forward.
4. Build CreationAccountant → receipt to LOVE ledger (D1 batch).
5. Testnet end-to-end → intent → creation → settlement.
6. Document → `docs/P31_AUTOMATION_ENGINE.md` L5 layer.

---

*Ref: CWP-2026-010 — L5 Creation Economy (comprehensive implementation CWP).*
*P31 Labs | 501(c)(3) Nonprofit | EIN 42-1888158*
