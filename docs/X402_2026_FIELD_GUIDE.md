# x402 Protocol — 2026 Field Guide

**Status:** Production (P31 Labs L3.2–L3.5)  
**Authoritative standard:** [x402.org](https://x402.org) — Linux Foundation project  
**Scale:** 161M+ transactions, $43M+ settled (July 2026)

> x402 is an open HTTP/402 payment protocol. When a server requires payment for a resource, it returns
> HTTP 402 Payment Required with standardised headers. The client constructs a proof-of-payment,
> attaches it to the re-request, and the server verifies it (locally or via a facilitator).

---

## 1. Wire Protocol

### 1.1 Request/Challenge Flow

```
Client                                    Server / Facilitator
  │                                              │
  ├── GET /mcp ──────────────────────────────────┤
  │                                              │
  │   402 PAYMENT-REQUIRED                       │
  │   X-Network: base-sepolia                    │
  │   X-Accept: usdc,eth                         │
  │   X-Price: $0.05                            │
  │   X-Pay-To: 0x...                            │
  │   X-Challenge: eyJzY2hlbWUiOiJ...            │  ← Base64 JSON
  │                                              │
  ├── POST /mcp (retry) ────────────────────────┤
  │   PAYMENT-SIGNATURE: eyJzY2hlbWUiOiJ...      │  ← Base64 JSON
  │   Content-Type: application/json             │
  │   { "jsonrpc": "2.0", ... }                  │
  │                                              │
  │   ── Server verifies:                        │
  │     1. Local: check PAYMENT-SIGNATURE        │
  │        matches PAYMENT-REQUIRED challenge     │
  │     2. OR facilitator POST /verify           │
  │     3. POST /settle (atomic)                 │
  │                                              │
  │   200 OK (tool result)                       │
```

### 1.2 Headers (V2)

| Header | Direction | Format | Purpose |
|--------|-----------|--------|---------|
| `PAYMENT-REQUIRED` | Server → Client | Base64 JSON | Challenge: scheme, network, price, pay-to address, deadline, nonce |
| `PAYMENT-SIGNATURE` | Client → Server | Base64 JSON | Proof-of-payment: signed transaction or transfer auth |
| `PAYMENT-RESPONSE` | Server → Client | Base64 JSON | Settlement confirmation (txId, amount settled, block hash) |

### 1.3 Schemes

| Scheme | Description | Live |
|--------|-------------|------|
| `exact` | Pay the exact amount requested (single tx) | ✅ |
| `upto` | Pay up to a ceiling (the facilitator picks the actual amount) | ✅ |
| `transfer-with-authorization` | Authorise a transfer without submitting (deferred settle) | ✅ |
| `spl-transfer` | Solana Program Library token transfer | ✅ |

### 1.4 Facilitator

The **facilitator** (`FACILITATOR_URL`) is the off-chain verification and settlement service.
Two endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/verify` | POST | Validate a `PAYMENT-SIGNATURE` proof-of-payment (idempotent) |
| `/settle` | POST | Atomically settle the verified payment on-chain (non-idempotent — uses idempotency key) |

The public Coinbase facilitator (`facilitator.x402.org`) is testnet-only. Mainnet requires CDP API-key auth
(`FACILITATOR_KEY_ID` + `FACILITATOR_SECRET_KEY`) — the x402-hono middleware (`@coinbase/x402`
`createFacilitatorConfig`) attaches CDP-signed auth headers transparently.

---

## 2. P31 Integration

### 2.1 Architecture (L3.2–L3.5)

```
User / MCP Client
      │
      ▼
┌─────────────────────────────────┐
│  mcp-x402-gateway (Hono Worker) │  ← L3.2: issues 402, verifies payment
│  - /mcp    (x402-gated)         │     then forwards to the bridge
│  - /mcp    (LOVE dual-rail)     │
│  - /llm/complete (GLM metering) │
│  - /classify (intent resolution)│
│  - /agent/run (orchestrator)    │
│  - /.well-known/mcp-pricing     │
│  - /api/revenue/ingest          │
│  Bindings: BRIDGE_URL,          │
│    FACILITATOR_URL, LOVE_LEDGER │
└──────────────┬──────────────────┘
               │ POST /mcp (BRIDGE_URL)
               ▼
┌─────────────────────────────────┐
│  L3.4 Bridge (Node stdio<->HTTP)│
│  - 10 stdio backends            │
│  - Supervised child processes   │
│  - WebSocket SSE notifications  │
└──────────────┬──────────────────┘
               │ node cli/*-server.js
               ▼
         Oasis | Registry | LOVE | PHOS Forge |
         Cog-Prosthetic | Cog-Comms | MARGE |
         BOB | SOULSAFE | Ground-Truth
```

### 2.2 Pricing Tiers

| Tier | Price | Tools gated | x402 behaviour |
|------|-------|-------------|----------------|
| **free** | $0 | All 10 soulsafe read tools, all 8 ground-truth read tools, existing free tools | Always 200 — no 402 challenge |
| **metered-low** | $0.01 | `soulsafe_gate1_self_review`, `soulsafe_gate2_cross_review`, `truth_verify_baseline`, `truth_register_fact` | 402 challenge → verify → forward |
| **premium** | $0.05 | `soulsafe_gate3_full`, `soulsafe_run_protocol`, `oasis_execute`, `phos-adopt/learn/rollback/watch/deploy`, `bus-emit`, `healer-remediate` | 402 challenge → verify → forward |
| **premium-high** | $0.25 | `jitterbug-run`, `brain-dump` | 402 challenge → verify → forward |

Pricing is per-tool and statically declared in the `PRICING` table (`src/index.ts:69`).
The `/.well-known/mcp-pricing` endpoint advertises the full table at runtime.

### 2.3 LOVE Dual-Rail Settlement

Requests carrying `X-Creation-Unit: love` bypass the x402 gate entirely and settle in
the P31 LOVE care-credit economy:

1. **Auth:** `X-Love-Auth-MAC` (HMAC-SHA256 of `love:<timestamp>`) + `X-Love-Timestamp`
   verified against the shared `LOVE_AUTH_SECRET` (60s TTL, constant-time compare in `./love-auth.ts`).
   Skipped when the secret is not configured (backward-compatible for local dev).
2. **Balance check:** Queries `love-ledger` D1 `love_accounts` for `did` → checks balance
   against the tool's price. Returns 402 on insufficient balance.
3. **Blind signature:** Issues a placeholder `X-LOVE-Signature` (GNU Taler Clause Blind
   Schnorr issuance is TODO; current path issues a UUID placeholder).
4. **Forward:** Proxies straight to the L3.4 bridge — no 402 challenge on the LOVE rail.
5. **Spoon protection:** The HMAC gate prevents external callers from spoofing
   `X-Creation-Unit: love` to reach paid tools for free. Only the trusted first-party
   renderer (PHOS / cockpit) holds the secret.

---

## 3. MCP 2026-07-28 Protocol

The P31 bridge and all 10 CLI servers now speak the **2026-07-28 stateless protocol**:

- **No session handshake.** `initialize` returns `protocolVersion: '2026-07-28'` with no session ID.
  All state is carried in the request envelope.
- **`_meta.protocolVersion`** in every request.
- **New methods:** `server/discover`, `subscriptions/listen` (SSE stream).
- **Backward compatibility:** The old `2024-11-05` handshake (`initialize` → `initialized`)
  is preserved in some deployed edge servers but is deprecated for new servers.

All P31 CLI servers (BOB, MARGE, SOULSAFE, Ground-Truth) advertise `2026-07-28` and the
`upgraded: true` flag in server info.

---

## 4. Cloudflare Monetization Gateway

Cloudflare opened a **Monetization Gateway waitlist** on July 1, 2026 — MCP tools hosted
on Workers can be monetized without running a facilitator. At the time of writing, P31
uses the hand-rolled `x402-hono` pattern (not the waitlist product) because:

1. The L3.4 bridge requires a Node OS process tree (Cloudflare Workers cannot spawn children).
2. The LOVE dual-rail settlement has no Cloudflare-managed equivalent.

The `@coinbase/x402` + `x402-hono` pattern in `src/index.ts` mirrors the same primitives
the waitlist Gateway uses internally. Migration path: if Cloudflare ships a process-launcher
binding, the L3.4 bridge could move behind the fully-managed Gateway with zero code changes
to the x402 middleware layer.

### Agents SDK Alternative

Cloudflare's Agents SDK provides `withX402()` and `paidTool()` as alternative x402
integration for Durable Object agents. The P31 `agent-runtime` Worker uses this path
for built-in tools (`send_notification`, `generate_care_report`). The CLI MCP servers
use the HTTP gateway path (`x402-hono`), not the SDK path. Both settle into the same
RevenueTracker DO via `POST /api/revenue/ingest`.

---

## 5. Network Matrix

| Network | Facilitator | Purpose |
|---------|-------------|---------|
| `base-sepolia` | `facilitator.x402.org` | P31 production (testnet USDC) |
| `base` | CDP-authenticated | Mainnet USDC (opt-in, FACILITATOR_KEY_ID required) |
| `solana-devnet` | `facilitator.x402.org` | Solana SPL token settlement |
| `polygon-amoy` | `facilitator.x402.org` | Polygon testnet |
| `abstract-testnet` | `facilitator.x402.org` | Abstract L2 testnet |

All P31 pricing currently uses `base-sepolia`. The `NETWORK` env var is runtime-configurable
per deployment. The `FacilitatorConfig` pattern in `src/index.ts:61-68` handles the CDP-auth
upgrade path transparently.

---

## 6. Reference

- **Standard:** [x402.org](https://x402.org) — Linux Foundation
- **Package:** `@coinbase/x402` (facilitator config), `x402-hono` (Hono middleware)
- **P31 source:** `workers/mcp-x402-gateway/src/index.ts`
- **Bridge:** `workers/mcp-x402-gateway/bridge/src/`
- **LOVE auth:** `workers/mcp-x402-gateway/src/love-auth.ts` (HMAC-SHA256, constant-time)
- **GLM metering:** `workers/mcp-x402-gateway/src/llm-meter.ts` (reserve → stream → refund)
- **Orchestrator:** `workers/mcp-x402-gateway/src/orchestrator.ts` (classify → plan → execute → settle)
- **Pricing:** `GET /.well-known/mcp-pricing` on the deployed gateway
- **Cloudflare Monetization:** Monitisation Gateway waitlist opened July 1, 2026
- **Agents SDK:** `withX402()` / `paidTool()` for DO-bound agents
