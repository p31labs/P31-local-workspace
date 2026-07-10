# MCP Monetization Gateway — Technical Specification

**Project:** P31 Labs (`P31-local-workspace`)
**Codename:** `mcp-x402-gateway` (matches the hook already referenced in
`software/workers/taler-bridge-billing/src/index.ts:350`)
**Status:** Draft for implementation
**Authoritative transports in scope:** MCP Streamable HTTP (primary) + SSE (fallback)

---

## 0. Grounding — what the codebase actually does

All four existing MCP servers are **hand-rolled JSON-RPC 2.0 over stdio**, not HTTP.
The wire contract is identical across all four:

- **Framing:** newline-delimited JSON. Each line on stdin is one complete
  `{"jsonrpc":"2.0","id":N,"method":...,"params":...}` request; each line on
  stdout is one response. (`setEncoding('utf8')`, split on `\n`, keep the
  partial trailing line in a buffer — see `cli/mcp-server.js:280-298`.)
- **Methods implemented:** `initialize`, `notifications/initialized`,
  `tools/list`, `tools/call`, `ping` (plus `-32601`/`-32602` JSON-RPC errors).
- **`tools/call` shape:** `params.name` + `params.arguments`; returns
  `{ content: [{ type: 'text', text: <JSON string> }] }`.
- **`initialize` advertises:** `protocolVersion: '2024-11-05'`,
  `capabilities: { tools: {} }`.

| Server | File | Launch | Tools | Side effects of note |
|--------|------|--------|-------|----------------------|
| Oasis CLI | `cli/mcp-server.js` | `node cli/mcp-server.js` | 11 | `oasis_execute` runs `execSync(command)` on the host (RCE surface). `oasis_export_log` writes to CWD. |
| Component Registry | `cli/component-registry.js` | `node cli/component-registry.js` | 5 | Pure read of in-repo `design-tokens-registry`. CPU-only. |
| LOVE Ledger | `cli/love-registry.js` | `node cli/love-registry.js` | 3 | Spawns `node -e` to `fetch()` `LOVE_LEDGER_URL` (default `https://love-ledger.p31ca.org`); network egress. |
| PHOS Forge | `tools/phos-forge/mcp-server.mjs` | `node tools/phos-forge/mcp-server.mjs` | 27 | Spawns `cli.mjs`/`bus.mjs`/`cognitive-estimator.mjs`/`self-healer.mjs`; reads `/home/p31/P31-local-workspace/spoon-state.json`; python3 nexus daemon. Heavy, multi-process. |

> **Hard constraint (from `AGENTS.md`):** Cloudflare Workers **cannot** spawn
> child processes. Three of the four servers (`oasis_execute`, PHOS Forge's many
> `spawn()` calls, LOVE's `execFileSync`) require a real OS process tree.
> Therefore the `mcp-x402-gateway` **must** be a **Node service** (long-lived
> daemon / container) that owns the child processes, and is *fronted* by
> Cloudflare (Monetization Gateway + an optional thin `x402-hono` Worker for
> routing/auth). The Worker layer handles HTTP/402/x402; the Node layer handles
> stdio bridging and execution.

---

## 1. Architecture

### 1.1 Topology

```
                         ┌─────────────────────────────────────────────┐
   Agent / MCP client    │            CLOUDFLARE EDGE                  │
   (Claude, Kilo, etc.)  │                                             │
         │               │  ┌───────────────────────────────────────┐  │
         │  HTTPS        │  │  Cloudflare Monetization Gateway      │  │
         │  MCP Stream    │  │  (waitlist, 2026) — 402 + USDC       │  │
         │  HTTP / SSE    │  │  settlement, rate limit, WAF         │  │
         ├──────────────► │  └───────────────┬───────────────────────┘  │
         │               │                   │ (or direct to Worker)     │
         │               │  ┌────────────────▼───────────────────────┐  │
         │               │  │  mcp-x402 Worker (x402-hono)           │  │
         │               │  │  • 402 challenge on POST /mcp          │  │
         │               │  │  • auth / identity / rate tiers       │  │
         │               │  │  • forwards to origin via service binding│ │
         │               │  └────────────────┬───────────────────────┘  │
         └───────────────┼───────────────────┼──────────────────────────┘
                         │                   │  origin request
                         │                   ▼
                 ┌───────────────────────────────────────────────┐
                 │     mcp-x402-gateway  —  NODE SERVICE          │
                 │     (single origin, e.g. Container/VM/poP)     │
                 │                                               │
                 │  ┌─────────────────────────────────────────┐ │
                 │  │  MCP Streamable HTTP + SSE transport     │ │
                 │  │  (one unified /mcp endpoint, session-   │ │
                 │  │   id routing, aggregates all 4 backends)  │ │
                 │  └───────────────┬─────────────────────────┘ │
                 │     spawns & supervises child processes:      │
                 │   ┌──────────┐ ┌──────────┐ ┌──────────┐     │
                 │   │ oasis    │ │ comp-reg │ │ love-reg │ ... │ │
                 │   │ mcp-srv  │ │ mcp-srv  │ │ mcp-srv  │     │
                 │   │ (node)   │ │ (node)   │ │ (node)   │     │
                 │   └────┬─────┘ └────┬─────┘ └────┬─────┘     │
                 │   stdin/stdout JSON-RPC bridge (below)         │
                 │   ┌──────────────────────────────────────┐    │
                 │   │ phos-forge mcp-server.mjs (node)      │    │
                 │   │  └─ spawns cli.mjs / bus.mjs / cog /  │    │
                 │   │     healer + python3 nexus daemon      │    │
                 │   └──────────────────────────────────────┘    │
                 └───────────────────────┬───────────────────────┘
                                         │  settled-payment webhook
                                         ▼
                         ┌───────────────────────────────────────┐
                         │  taler-bridge-billing Worker          │
                         │  POST /api/revenue/ingest            │
                         │   → RevenueTracker DO (RevenueBadge)  │
                         └───────────────────────────────────────┘
```

### 1.2 stdio ↔ HTTP bridging (the core mechanism)

Each backend server keeps the **line-delimited JSON-RPC contract** verbatim.
The Node gateway is a *transparent transport adapter* — it does **not** re-implement
the tools. For every incoming MCP HTTP request it:

1. Parses the Streamable HTTP body (`POST /mcp`) as one JSON-RPC message (or a
   batch). For `initialize`, it assigns/validates a `Mcp-Session-Id` (per the
   Streamable HTTP spec) and pins that HTTP session to a backend process group.
2. Serializes the message to a single JSON line and writes it to the chosen
   backend child's **stdin**, terminated by `\n`.
3. Reads the backend child's **stdout**, accumulating until a complete JSON line
   (terminated by `\n`) is available — mirroring the `buffer.split('\n')` logic
   in `cli/mcp-server.js:280-298`. Partial trailing lines are held.
4. Maps that JSON line back into the HTTP response / SSE stream.

Key adaptation points:

- **`notifications/initialized`** carries no `id` and expects no response
  (`mcp-server.js:312`). The bridge forwards it but emits nothing downstream.
- **`tools/list`** is **fanned out**: the gateway calls `tools/list` on *all four*
  backends and concatenates the `tools[]` arrays into one unified catalog
  (46 tools). Tool names are already namespaced (`oasis_*`, `design_*`,
  `love_*`, `phos-*`/`bus-*`/`cartographer-*` etc.), so no rename is needed,
  but the gateway keeps a `{toolName → backend}` route table.
- **`tools/call`** is routed by the `params.name → backend` table to the correct
  child process. This is where x402 pricing is applied (§3).
- **SSE**: for server→client notifications (`notifications/*`, logging), the
  gateway opens an SSE stream and pipes any unsolicited stdout lines to it.

### 1.3 Process supervision

- Each backend is a `child_process.spawn` managed by a `Backend` class with
  `restartOnCrash`, `maxRestarts`, `healthcheck` (send `ping`, expect `{}`),
  and a `stdinQueue`/`stdoutLineParser` per child.
- One backend instance per *session*, or a small pool per backend with session
  affinity, depending on whether the backend holds mutable state. Oasis
  (`~/.p31/cli-session.json`) and LOVE (`guest`/DID identity) are
  **stateful per caller**, so sessions are pinned: the gateway maps
  `Mcp-Session-Id → {oasis, love, phos} child set`. Component Registry is
  stateless and can be pooled/shared.

---

## 2. Tool inventory mapping (46 tools)

All tools are exposed uniformly via `tools/list` (aggregated) and `tools/call`
(routed). Pricing tiers in §3 reference these groups.

### 2.1 Oasis CLI MCP — `cli/mcp-server.js` (11)
| Tool | Side effect | Tier |
|------|-------------|------|
| `oasis_status` | read | free |
| `oasis_save` | writes `~/.p31/cli-session.json` | free |
| `oasis_theme` | writes session | free |
| `oasis_mode` | writes session | free |
| `oasis_clear` | writes session | free |
| `oasis_export_log` | **writes file to CWD** | metered-low |
| `oasis_sandbox_clear` | in-memory | free |
| `oasis_notify` | in-memory queue | free |
| `oasis_add_todo` | writes session | free |
| `oasis_toggle_todo` | writes session | free |
| `oasis_execute` | **`execSync(command)` host RCE** | premium + sandboxed |

### 2.2 Component Registry — `cli/component-registry.js` (5)
| Tool | Tier |
|------|------|
| `design_list_components` | free |
| `design_get_component` | free |
| `design_get_tokens` | free |
| `design_search` | free |
| `design_spoon_guide` | free |

### 2.3 LOVE Ledger — `cli/love-registry.js` (3)
| Tool | Egress | Tier |
|------|--------|------|
| `love_status` | `GET LOVE_LEDGER_URL/status` | free |
| `love_balance` | `GET LOVE_LEDGER_URL/balance` | free |
| `love_sync` | `GET LOVE_LEDGER_URL/chain` | metered-low (chain can be large) |

### 2.4 PHOS Forge — `tools/phos-forge/mcp-server.mjs` (27)
| Tool | Notes | Tier |
|------|-------|------|
| `phos-adopt` | file move (spoon-gated) | premium |
| `phos-status` | read | free |
| `phos-classify` | read | metered-low |
| `phos-learn` | scans FS | premium |
| `phos-rollback` | reverts moves | premium |
| `phos-watch` | background watcher | premium |
| `bus-emit` | emits event bus | premium |
| `yardmaster-inspect` | read | free |
| `nexus-state` | python3 daemon | metered-low |
| `phos-deploy` | **Cloudflare deploy** (spoon-gated) | premium |
| `cognitive-state` | read | free |
| `cognitive-estimate` | CPU | metered-low |
| `healer-remediate` | **takes actions** | premium |
| `jitterbug-run` | **LLM calls** (spoon-gated) | premium-high |
| `phos-aura` | terminal render | free |
| `healer-log` | read | free |
| `reflex-status` | read | free |
| `tide-status` | read | free |
| `kappa-status` | read | free |
| `cartographer-query` | TF-IDF search | metered-low |
| `cartographer-trace` | search | metered-low |
| `cartographer-related` | search | metered-low |
| `logbook-status` | read | free |
| `logbook-today` | read | free |
| `brain-dump` | LLM/elaborate | premium-high |
| `brain-status` | read | free |
| `brain-diff` | read | free |

---

## 3. x402 payment middleware

### 3.1 Protocol (x402.org, Linux Foundation)

x402 = **HTTP `402 Payment Required`** carrying a `X-402` / `Payment-Requirements`
header describing what to pay; the client (or its wallet agent) pays **USDC on an
EVM chain (Base)**, attaches a signed `Payment-Signature` (and `Payment-Payload`)
header on retry; a **facilitator service** verifies the on-chain transfer and
signs a verification; the server then settles and serves the request.

This gateway reuses the **exact same primitives** already proven in
`taler-bridge-billing` (`x402-hono`'s `paymentMiddleware`, `createFacilitatorConfig`,
`recordRevenue` → `RevenueTracker` DO). See `index.ts:15-20, 165-181, 183-201`.

### 3.2 Per-call gating flow

```
 Client (MCP agent)                 mcp-x402 Worker                 Facilitator        Chain (Base)
   │  POST /mcp {tools/call:        │                                │                 │
   │    oasis_execute}              │                                │                 │
   ├──────────────────────────────► │                                │                 │
   │                                │ 1. Price lookup (route table)  │                 │
   │                                │    → $0.05 USDC                │                 │
   │                                │ 2. No valid Payment-Signature  │                 │
   │ ◄── 402 + Payment-Requirements │    (X-402 header) ──────────── │                 │
   │     {amount, asset(USDC),      │                                │                 │
   │      payTo, network:base,      │                                │                 │
   │      facilitator, description} │                                │                 │
   │ 3. Wallet agent pays USDC ─────────────────────────────────────────────────────► │
   │    to payTo on Base            │                                │  transfer        │
   │ 4. Wallet sends POST /mcp ─────│                                │                 │
   │    + Payment-Signature/-Payload│ 5. paymentMiddleware verifies  │◄──── verify ────│
   │                                ├──────────────────────────────►│  (facilitator    │
   │                                │ 6. facilitator signs verify   │   signs)         │
   │                                │◄──────── verifyResponse ──────│                 │
   │                                │ 7. (optional) settle/withdraw  │── settle ───────►│
   │ 8. Request proceeds ──────────►│ 9. Bridge → stdio backend     │                 │
   │ ◄── 200 tools/call result      │    → oasis_execute            │                 │
   │                                │ 10. POST /api/revenue/ingest   │                 │
   │                                ├──────────────────────────────►│ (taler-billing) │
```

### 3.3 Pricing model

Centralized route table (seeded from §2 tiers), one price per tool, priced in
USDC on Base. Example defaults:

| Tier | Tools | Default price |
|------|-------|---------------|
| `free` | status/read/token tools | `$0` (always 200, no 402) |
| `metered-low` | export, classify, nexus, cartographer, cognitive-estimate, love_sync | `$0.01` |
| `premium` | oasis_execute, phos-adopt/learn/rollback/watch, bus-emit, phos-deploy, healer-remediate | `$0.05` |
| `premium-high` | jitterbug-run, brain-dump (LLM-bound) | `$0.25` |

- **Free tier / allowance:** every authenticated caller gets `N` free calls/day
  (e.g. 50) tracked in a KV/Durable Object keyed by identity (§5). Free tier
  bypasses the 402.
- **Setting prices:** table is loaded from `PRICING_JSON` env (or a KV key
  `mcp-pricing`), hot-reloadable without redeploy. A `GET /.well-known/mcp-pricing`
  (or the MCP `tools/list` descriptions) advertises per-tool cost.
- **Batch calls** (`tools/call` array): price = sum of per-tool costs; single
  402 if any component is unpaid, or price each line separately.

### 3.4 Facilitator / settlement

- Use `@coinbase/x402` `createFacilitatorConfig(KEY_ID, SECRET)` when mainnet
  CDP-auth is needed; fall back to the public testnet facilitator when no
  key is set (mirrors `facilitator()` in `index.ts:54-60`).
- Settlement target wallet = `PAY_TO` env (the P31 USDC receiver on Base).
- On successful verify, the Worker **posts the settled event** to
  `taler-bridge-billing` `POST /api/revenue/ingest`
  (`index.ts:356-379`) with body `{ wallet: PAY_TO, amount: "0.05",
  source: "mcp-x402:<toolName>", txId }` so it lands in the **same**
  `RevenueTracker` DO already powering the dashboard `RevenueBadge` — exactly
  as the `mcp-x402-gateway` comment at `index.ts:350-353` anticipates.

---

## 4. Cloudflare Monetization Gateway integration

Cloudflare's **Monetization Gateway** (announced, waitlist, ~2026) is a managed
edge layer that natively speaks x402: it can issue the 402, run the facilitator
verification, settle, and apply platform rate-limiting/WAF. Positioning relative
to this custom build:

| Concern | Cloudflare Monetization Gateway | Custom `mcp-x402` Worker / Node service |
|---------|--------------------------------|------------------------------------------|
| 402 issuance + facilitator verify | ✅ native, managed | hand-rolled via `x402-hono` |
| USDC settlement / payout | ✅ managed | calls `PAY_TO` via facilitator |
| WAF / DDoS / rate limit | ✅ native | minimal |
| MCP Streamable HTTP transport | ❌ not MCP-aware | ✅ owns it |
| stdio↔HTTP bridge to the 4 servers | ❌ cannot spawn procs | ✅ Node service |
| Per-tool pricing + free-tier quota | ❌ coarse | ✅ route table + KV |
| Revenue into P31 `RevenueTracker` | ❌ separate ledger | ✅ via `/api/revenue/ingest` |

**Recommended split:** put the **Monetization Gateway in front** of the
`mcp-x402` Worker for the 402/facilitator/settlement + edge protection, and keep
the **custom Worker + Node bridge** for MCP transport, per-tool pricing, routing,
and free-tier quota (which the managed gateway cannot express at tool granularity).
If the managed gateway is unavailable/waitlisted, the custom `x402-hono` Worker
(§3) is the full standalone fallback — no code change to the Node bridge.

---

## 5. Auth & identity

- **Identity:** callers present either (a) a DID-key JWT from `apps/auth`
  (`p31-auth`, per `AGENTS.md` Auth section), or (b) an **x402 anonymous wallet**
  derived from the payer address in `Payment-Signature`. Both resolve to a stable
  `callerId`.
- **Free-tier quota:** KV/Durable Object keyed by `callerId` → `{ usedToday,
  date, tier }`. Resets daily (UTC). Exhaustion → 402 is enforced even on
  "free" tools, or free tools stay free and only metered/premium are gated
  (configurable).
- **Rate tiers:** `anonymous` (smallest quota, highest prices), `did-verified`
  (larger quota, lower prices), `partner` (allowlist, custom pricing).
- **Key management:** `apps/auth` issues JWTs; the Worker verifies with the
  shared `packages/auth` verifier. x402 payer addresses are *not* secrets — they
  are the identity. `PAY_TO`, `FACILITATOR_KEY_ID`, `FACILITATOR_SECRET_KEY`,
  `PREMIUM_SECRET`, `REVENUE_API_TOKEN` are **Wrangler secrets**, never in code.
- **Admin:** revenue/dashboards gated by `REVENUE_API_TOKEN` bearer (same as
  `taler-bridge-billing` `index.ts:328-338`).

---

## 6. Deployment

### 6.1 Node gateway service (`mcp-x402-gateway`)

Runs the 4 child servers. Recommended: Cloudflare Container, a VM, or a
long-lived Worker-with-Container. Exposes `:8787/mcp` (Streamable HTTP) + `/sse`.

`wrangler.toml` sketch (Worker front + Container):

```toml
name = "mcp-x402-gateway"
main = "src/worker.ts"            # x402-hono thin worker (routing + 402)
compatibility_date = "2026-01-01"

[container]
image = "./gateway.Dockerfile"   # Node service: spawns the 4 stdio servers
# gateway.Dockerfile installs repo, runs `node src/gateway.mjs` (the bridge)

[vars]
NETWORK = "base"
PAY_TO = "0xPAY_TO_RECEIVER"
FACILITATOR_URL = "https://facilitator.x402.org"
BILLING_INGEST_URL = "https://taler-bridge-billing.p31ca.org/api/revenue/ingest"

[[services]]                     # or service binding to the container
binding = "GATEWAY"

[observability]
enabled = true
```

### 6.2 Environment / secrets

| Key | Where | Purpose |
|-----|-------|---------|
| `PAY_TO` | Worker + Node | USDC receiver on Base |
| `NETWORK` | Worker | `base` / `base-sepolia` |
| `FACILITATOR_URL` | Worker | verify endpoint |
| `FACILITATOR_KEY_ID` / `FACILITATOR_SECRET_KEY` | Worker (secret) | CDP mainnet auth |
| `PREMIUM_PRICE` / `PRICING_JSON` | Worker | default + per-tool prices |
| `REVENUE_API_TOKEN` | Worker (secret) | auth to `/api/revenue/ingest` + admin |
| `LOVE_LEDGER_URL` | Node (passed to love-registry child) | defaults `https://love-ledger.p31ca.org` |
| `P31_USER_ID`, `HOME` | Node | session dir for oasis (`~/.p31`) |
| `SPOON_STATE_PATH` | Node | default `/home/p31/P31-local-workspace/spoon-state.json` for PHOS Forge |

### 6.3 Relation to `taler-bridge-billing`

The gateway is an **additive revenue surface** for the existing billing worker,
not a replacement. It:
- Reuses `x402-hono` `paymentMiddleware` + facilitator pattern verbatim.
- Lands every settled MCP call into the **same** `RevenueTracker` DO via
  `POST /api/revenue/ingest` (shape `{ wallet, amount, source:"mcp-x402:<tool>",
  txId }`) so the `RevenueBadge` dashboard shows combined Taler + x402 MCP
  revenue. The ingest endpoint is already built for exactly this
  (`index.ts:349-379`).
- Shares `PAY_TO`, `NETWORK`, `FACILITATOR_*`, `REVENUE_API_TOKEN` secrets.

---

## 7. Risks & mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| **`oasis_execute` = host RCE** (`execSync`) | Critical | Run the Node gateway in a locked-down container/sandbox; drop to a non-root user; `oasis_execute` only on the `premium` tier with a command allowlist/denylist; consider disabling it behind a flag initially. Never expose host creds. |
| **PHOS Forge spawns many node/python children** | High | Cap concurrent child processes; enforce per-session process quota; `maxBuffer` + `timeout` on every spawn (mirror `mcp-server.js` `execSync` `timeout:30000, maxBuffer:1MB`); reap zombies. |
| **Stdio process lifecycle / crashes** | High | `Backend` supervisor with `restartOnCrash`, healthcheck `ping`, bounded `maxRestarts`, backoff; drop session on backend death, force re-`initialize`. |
| **Cold starts** (Container spin-up) | Medium | Keep the gateway warm (minimum 1 replica); pre-spawn the 4 backends at boot; healthcheck before accepting traffic; stateless `tools/list` cached. |
| **Settlement / facilitator failure** (paid but verify times out) | High | Idempotency key per `(callerId, requestId)`; on facilitator timeout, hold the request and reconcile against on-chain receipt via `txId`; never charge twice; emit to dead-letter for manual review. |
| **Partial payment / underpay** | Medium | Facilitator enforces exact `amount`+`asset`; reject otherwise with 402. |
| **Abuse / scraping free tier** | Medium | Per-identity daily quota (KV); anonymous tier tiny quota + higher price; WAF + Monetization Gateway edge rate limit; CAPTCHA/allowlist for `partner`. |
| **Pricing errors** (mis-priced expensive tool) | Medium | `PRICING_JSON` schema-validated on load; `jitterbug-run`/`brain-dump` (LLM-bound) default to `premium-high`; dry-run modes (`jitterbug-run` `dry_run`, `phos-adopt` `--dry-run`) stay cheaper. |
| **`love_sync` large chain egress** | Low | Cap response size; stream; meter as `metered-low`. |
| **Session affinity for stateful backends** | Medium | Pin `Mcp-Session-Id → backend child set`; on HTTP reconnect, route to same children or re-init. |
| **Secret leakage** | High | All keys via Wrangler secrets; `x402` private keys never leave facilitator; `oasis_execute` sandbox has no access to secret mounts. |

---

## 8. Build phases

**Phase 0 — Bridge MVP (no payments).**
Node service spawns the 4 stdio servers; implement `initialize`/`tools/list`
(aggregated 46) / `tools/call` over MCP Streamable HTTP + SSE. Verify all 46
tools route correctly via `curl`/MCP client. No x402 yet.

**Phase 1 — x402 Worker (standalone).**
Add the `x402-hono` `paymentMiddleware` to the thin Worker (reuse
`taler-bridge-billing` primitives). Wire `PAY_TO`, facilitator, `PRICING_JSON`.
Gate `premium`/`premium-high` tools with 402; `free` tools open. Land revenue
via `POST /api/revenue/ingest`.

**Phase 2 — Identity + free tier.**
DID-key JWT verification (`apps/auth`); KV free-tier quota; rate tiers
(`anonymous`/`did-verified`/`partner`); per-tool pricing hot-reload.

**Phase 3 — Hardening.**
Container sandbox for the Node service; `oasis_execute` allowlist + non-root;
child-process caps/timeouts/reaping; idempotent settlement reconciliation;
observability (Axiom/Sentry per `AGENTS.md`).

**Phase 4 — Cloudflare Monetization Gateway + full rollout.**
Put managed Monetization Gateway in front (402/facilitator/settlement + WAF);
keep custom Worker for MCP transport + per-tool pricing. Publish
`/.well-known/mcp-pricing`, docs, and `agent-card.json` advertisement. Promote
`metered-low`/`premium` tiers to public; keep `oasis_execute` opt-in.
