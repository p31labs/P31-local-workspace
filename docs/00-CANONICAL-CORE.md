# P31 Canonical Core — Cycle 1

> **Status:** Frozen (Cycle 1 complete). Gate: `node scripts/validate-core.mjs` exits 0.
> **Machine-readable:** [00-CANONICAL-CORE.yaml](./00-CANONICAL-CORE.yaml)
> **Generated from:** `scripts/generate-core-inventory.mjs` → `inventory.json` → `scripts/generate-core-yaml.mjs`

## The Four-Layer Model

The indestructible shape. When every surface is deleted, these four layers survive. Each layer *owns* its domain and *must-not* reach across boundaries.

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 0 — IDENTITY (the atom, never changes)          │
│  DID:key generation + registration + JWT auth          │
│  Passport system (9 passengers, 3 modes)               │
│  @p31/shared-identity, sovereign primitives            │
├─────────────────────────────────────────────────────────┤
│  LAYER 1 — TOKENS (additive only, never subtractive)   │
│  THEME_TOKENS in theme-store.ts (single source)        │
│  OKLCH color space, 863 Hz rhythm, tetrahedral spacing  │
│  5 worlds × 3 ages × 2 sensory = 30 variants           │
│  DTCG JSON export (tokens.dtc.json)                    │
├─────────────────────────────────────────────────────────┤
│  LAYER 2 — CONTRACTS (versioned, frozen, diffed)        │
│  Canonical MCP surface (server/discover, stateless)     │
│  LOV ledger API (earn/spend/give/donate/take)          │
│  Component contracts (semantic parts, states, gaps)     │
│  Payment rails (x402 / BTC / fiat), revenue chain       │
├─────────────────────────────────────────────────────────┤
│  LAYER 3 — SURFACES (disposable, rebuild freely)        │
│  QPJ, chat, shell, design, marketing, CLI, arcade       │
│  Each reads from Layers 0-2, never around them          │
│  No surface is canonical                                │
└─────────────────────────────────────────────────────────┘
```

## Layer contracts

| Layer | Owns | Must-not | Enforced by |
|-------|------|----------|-------------|
| **L0 Identity** | DID:key, passport model, sovereign primitives, JWT auth | hold balances, render UI, import L1/L2/L3 internals, contain component logic | `validate-core.mjs` + shared-identity tests |
| **L1 Tokens** | THEME_TOKENS, OKLCH, 863 Hz, DTCG export, compositions, recipes, validators | contain component logic, import L2/L3 internals, hold runtime state, expose network APIs | `pnpm gen:tokens` no-drift gate |
| **L2 Contracts** | MCP tool surface, LOV ledger, component contracts, payment rails, revenue chain, governance | import L3 surfaces, render UI, hold user state across requests, hardcode token values | `validate-core.mjs`, contract diff |
| **L3 Surfaces** | Portals, chat, shell, marketing, CLI, game surfaces, static assets | import L2 internals directly, hardcode tokens, bypass mode guards, hold identity state, direct D1 writes | `validate-core.mjs`, WebMCP ModeGuard |

## Classification summary (252 artifacts, generated 2026-09-15)

| Layer | Count | Includes |
|-------|-------|----------|
| L0 | 11 | shared-identity, cognitive-passport, sovereign packages, quantum-core, interface-generator |
| L1 | 21 | design-core, design-validator, skin packages, rules, tokens |
| L2 | 185 | design-mcp, crypto-mcp, x402 gateways, love-ledger (pkg + workers + love-chain), economy, contract-engine, governance, payment rails, all workers |
| L3 | 32 | all `portals/*`, production shell/monetization/campaign, apps (p31ca, bonding, k4-cage, auth) |
| retire | 3 | gumroad (workers + software copies), Ko-fi/PayPal/sponsors/Blockonomics links |

## Key decisions frozen here

1. **Marketing sites (p31ca.org, phosphorus31.org) = Layer 3.** Rebuildable. Never canonical. *(User decision, 2026-09-15.)*
2. **LOV Machine split:** ledger/API → **L2 contract**; marketplace storefront UI → **L3 surface**. *(User decision.)*
3. **QPJ migrates to the contract layer first** (Cycle 4) — most complete design-core reader already. *(User decision.)*
4. **MCP shape = Hub-and-Spoke**, not collapse. `workers/design-mcp` (34 tools) is the canonical spoke; gateway (`mcp-gateway`) is added when 3+ spokes exist. `design-mcp-v3` is the merge target (Cycle 2).
5. **MCP spec = 2026-07-28, stateless, split SDK.** `@modelcontextprotocol/server` + `@modelcontextprotocol/client` replace the retired monolithic `@modelcontextprotocol/sdk`. `server/discover` required.
6. **LOV canonical source = `software/packages/love-ledger`** (ledger.ts, wallet.ts, vesting.ts, version.ts) → wrapped by the deployed API worker. `love-chain-worker` is the append-only hash sink.
7. **Payment rails:** x402 + BTC via BTCPay + Stripe fiat are active; Gumroad is retire; Ko-fi/PayPal/GitHub-Sponsors/Blockonomics are retire into unified checkout (Cycle 5).
8. **863 Hz is a numerical signature** (Larmor frequency of ³¹P at Earth's field), NOT a neural-entrainment claim. Motion rhythm is consistent, predictable, spoon-aware. *(Corrected claim — do not reintroduce the neurological framing in external docs.)*

## Regenerate

```bash
node scripts/generate-core-inventory.mjs    # walks both repos → inventory.json
node scripts/generate-core-yaml.mjs         # applies classification rules → docs/00-CANONICAL-CORE.yaml
node scripts/validate-core.mjs              # 4 gates: completeness, single-layer, no-retire-refs, layer discipline
```

## Enforcement primitives (Chained)

- `workers/design-mcp/skills/p31-standards/SKILL.md` — the first machine-readable standard (agentskills.io format) with 10 golden eval cases under `evals/`.
- Fleet: reviewer → skillfixer → autofixer → loganalyzer → judge → **confidence bot** + deterministic approver (Cycle 2).
- Standards are artifacts agents load, not prose. `RULES.md`/`CONSTITUTION.md` are human prose; **skills are the enforcement truth**, and they exit nonzero on drift the same way `validate-core.mjs` does on misclassification.

## What survives when everything else is deleted

The identity atom, the token store, the contract surface. **This document is the collapse.** The classification is the compression: 252 artifacts declared their layer, nothing unclassified, nothing in two layers.