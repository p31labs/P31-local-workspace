# BROS Trust Architecture

## Overview

P31 Labs implements decentralized trust via the EigenTrust algorithm, eliminating
the need for centralized KYC. Every node in the K₄ mesh carries a trust vector
computed from local interactions and anchored to pre-trusted genesis nodes.

---

## EigenTrust Algorithm Mapping

The core computation runs iteratively:

```
t^(k+1) = (1 - α) C^T t^(k) + α p
```

| Symbol | Meaning |
|--------|---------|
| `t^(k)` | Trust vector at iteration k — probability distribution over all nodes |
| `C` | Local trust matrix: `C[i][j]` is node i's trust in node j |
| `C^T` | Transpose of C — trust flows from trustor to trustee |
| `p` | Genesis vector — uniform weight across pre-trusted nodes |
| `α` | Bias parameter [0, 1] — higher values anchor more heavily to genesis |

**Properties:**
- Converges to a fixed point where trust concentrates on honest nodes.
- Sybil clusters cannot overcome the genesis anchor: even 100 colluding
  fake nodes with high mutual trust cannot depose a genesis node.
- `α = 0` collapses to pure local propagation (ignores genesis).
- `α = 1` collapses to pure genesis distribution (ignores interactions).

---

## Per-Edge Trust Model

Trust is not a single global score. The system computes per-edge trust:

```
edgeTrust(from → to) = C[from][to] × t[to] / t[from]
```

This enables fine-grained access control:
- Node A may trust node B highly but distrust node C entirely.
- Middleware inspects the specific (from, to) edge for authorization decisions.

`getEdgeTrust(result, from, to)` returns the score for any pair, or
`undefined` if no direct interaction exists.

---

## Cognitive Passport Enrollment

Each user's Cognitive Passport seeds the trust graph at enrollment time:

1. **Relationship parsing** — `parseRelationships(passport.fields.fam)` extracts
   validated entries from the passport's `fam` field group.

2. **Weight assignment** — Each relationship type maps to a baseline trust weight:

   | Type | Weight |
   |------|--------|
   | family | 0.9 |
   | clinical | 0.7 |
   | professional | 0.6 |
   | peer | 0.4 |
   | organizational | 0.3 |
   | other | 0.1 |

   Users may override any weight via an explicit `trust` field on the entry.

3. **Matrix construction** — `relationshipsToTrustMatrix()` builds the initial
   local trust matrix with directed edges self → relation.

4. **Genesis vector** — `genesisTrustVector()` assigns uniform weight to
   pre-trusted nodes (typically the passport holder). Users designate
   genesis nodes during enrollment; there are no hardcoded genesis IDs.

5. **One-shot compute** — `computePassportTrust()` builds the matrix, anchors
   to genesis, and runs full EigenTrust convergence in a single call.

---

## BONDING Multiplayer Interactions → InteractionHistory

Runtime observations from BONDING multiplayer sessions feed the trust graph:

1. **Event capture** — Each game session records `positive` and `total`
   interaction counts per pair: `{ positive, total }`.

2. **Laplace smoothing** — `interactionsToTrustMatrix()` converts raw counts
   into local trust weights using Laplace smoothing:
   ```
   c_ij = (positive + ε) / (total + 2ε)
   ```
   This avoids zero scores and handles cold-start gracefully.

3. **Hybrid computation** — `computeTrustWithPassthrough()` merges passport
   relationship edges with runtime observation edges before convergence.

4. **Factory method** — `fromInteractionHistory()` provides a single-call
   path from raw history → EigenTrustResult, enabling quick trust updates
   after each session.

---

## Trust Chain: EigenTrust → Edge Trust → SBT Minting → Crisis Ping → Hibernation Wake

```
┌─────────────────────┐
│   EigenTrust Core   │  Iterative convergence: t^(k+1) = (1-α)C^T t^(k) + αp
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   Trust Vector      │  Normalized per-node trust scores (sums to 1)
│   + Edge Trust Map  │  Per-edge scores via getEdgeTrust(from, to)
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   Trust Tier        │  getTrustTier() → 'untrusted' | 'basic' | 'trusted' | 'high'
│   Classification    │  TRUST_THRESHOLDS: MINIMUM_TRUSTED=0.1, SOULBOUND_ELIGIBLE=0.7, HIGH_TRUST=0.9
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   SBT Minting       │  isSoulboundEligible(node) — requires score ≥ 0.7
│   (if trusted+)     │  Soulbound token encodes the trust tier immutably
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   Crisis Ping       │  Only nodes with trustLevel ≥ 'trusted' can send crisis pings
│   Authorization     │  Enforced by requiresTrustLevel('trusted') middleware
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   Hibernation Wake  │  Trust-gated node revival: hibernating nodes require
│   Gate Check        │  a trusted+ peer to vouch for wake authorization
└─────────────────────┘
```

---

## Crisis Ping Authorization

Crisis pings are a high-trust action. The `requiresTrustLevel()` middleware
wraps any handler to enforce a minimum trust tier:

```typescript
const sendCrisisPing = requiresTrustLevel(TrustLevel.Trusted)(async (nodeId, trustVector, payload) => {
  // Handler body — only reached if nodeId has tier ≥ 'trusted'
  return relay.broadcast(nodeId, payload);
});
```

Nodes below the required tier receive a structured error before the handler
executes. This prevents untrusted or Sybil nodes from injecting false distress
signals into the mesh.

---

## TrustGuard Middleware Pattern

The `requiresTrustLevel()` function produces a composable middleware wrapper:

```typescript
type TrustGuard<T> = (minLevel: TrustLevel) => (handler: T) => (...args) => ReturnType<T>;
```

Usage:
- **Crisis ping** — `requiresTrustLevel(TrustLevel.Trusted)`
- **SBT mint** — `requiresTrustLevel(TrustLevel.Trusted)`
- **Hibernation wake** — `requiresTrustLevel(TrustLevel.Trusted)`
- **Genesis operations** — `requiresTrustLevel(TrustLevel.Genesis)`

The first argument must always be the `nodeId` (string) and the second must
be a `TrustVector` for that node. Additional handler arguments pass through
unchanged.

---

## Configuration Reference

All parameters are configurable. No hardcoded values remain in the trust module.

| Parameter | Default | Range | Purpose |
|-----------|---------|-------|---------|
| `alpha` | 0.2 | [0, 1] | Genesis anchoring strength |
| `epsilon` | 0.0001 | > 0 | Convergence threshold |
| `maxIterations` | 100 | ≥ 1 | Iteration cap |
| `laplaceEpsilon` | 0.001 | > 0 | Smoothing for edge weights |
| `MINIMUM_TRUSTED` | 0.1 | [0, 1] | Basic trust floor |
| `SOULBOUND_ELIGIBLE` | 0.7 | [0, 1] | SBT mint gate |
| `HIGH_TRUST` | 0.9 | [0, 1] | High trust tier threshold |

Genesis nodes are supplied per-computation via `options.genesisNodes` or
`CogPassTrustConfig.genesisNodes`. There are no hardcoded genesis IDs in the
library code.

---

## TypeScript Strict Mode

All public interfaces use explicit types. No `any` types appear on public API
surface. The module is compiled with `strict: true`.
