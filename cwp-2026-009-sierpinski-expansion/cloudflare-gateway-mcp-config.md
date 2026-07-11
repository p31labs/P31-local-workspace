# L3.3 — Cloudflare Monetization Gateway Config (MCP waitlist clearance)

**CWP-2026-009 / Axis L3 (MCP Monetization).** Companion to `docs/MCP_MONETIZATION_GATEWAY_SPEC.md` §4.
Status: ✅ **FINALIZED** — the managed Cloudflare Monetization Gateway is **waitlisted (~2026)**; the custom `mcp-x402` Worker (L3.2, `bf8c991`, dry-run green) is the **live fallback** and source of truth for pricing + free-tier quota.

## 1. Topology (spec §4)

```
caller ─┐
        ├──▶ [Cloudflare Monetization Gateway]  (waitlist, 2026)   ← 402 + facilitator + USDC settlement + WAF/edge rate-limit
caller ─┘        │  /mcp (x402-aware edge)
                 ▼
        [mcp-x402 Worker]  (software/workers/mcp-x402-gateway)   ← MCP Streamable HTTP, per-tool pricing, free-tier KV quota
                 │  service binding / HTTP
                 ▼
        [Node MCP bridge]  (L3.4)  ──▶ 4 stdio servers (Oasis/Registry/LOVE/PHOS Forge, ~46 tools)
```

- **Managed gateway owns:** 402 issuance, facilitator verify, USDC settlement/payout, WAF/DDoS, edge rate limiting.
- **Custom Worker owns:** MCP Streamable HTTP transport, per-tool price routing (`PRICING` table in `src/index.ts:52`), free-tier KV quota, revenue landing via `/api/revenue/ingest` into `RevenueTracker` DO.
- **If gateway unavailable/waitlisted:** the custom `x402-hono` Worker (L3.2) is the **full standalone fallback** — no bridge code change (spec §4, "no code change to the Node bridge").

## 2. Waitlist clearance procedure

When Cloudflare approves the Monetization Gateway waitlist:

1. **Enroll** `mcp.p31ca.org` (or the chosen MCP hostname) in the Monetization Gateway product.
2. **Point the edge route** `/mcp` at the gateway; set gateway **upstream** = `mcp-x402` Worker URL.
3. **Mirror pricing** in the gateway's 402 rules so edge + Worker agree. The Worker table is the source of truth:
   - premium `$0.05`: `oasis_execute`, `phos-adopt`, `phos-learn`, `phos-rollback`, `phos-watch`, `bus-emit`, `phos-deploy`, `healer-remediate`
   - premium-high `$0.25`: `jitterbug-run`, `brain-dump`
4. **Enable edge protections:** WAF managed rules + per-identity rate limit (anonymous smallest quota + highest price; `partner` allowlist).
5. **Keep** the Worker's `paymentMiddleware` active as defense-in-depth (idempotent — a payment accepted at the edge is re-verified, not double-charged; facilitator is read-only verify).
6. **Verify** end-to-end on `base-sepolia` (Worker `NETWORK="base-sepolia"`), then flip `NETWORK` to mainnet `base` only after settlement payout is confirmed.

## 3. Gateway route / rate-limit config (actionable)

Mirror these in the gateway dashboard (or `wrangler.toml` `[routes]` when GA):

```toml
# Edge route (gateway GA)
routes = [
  { pattern = "mcp.p31ca.org/mcp", custom_domain = true },
]
# upstream = mcp-x402 Worker URL (service binding / HTTPS)

# 402 price mirror — MUST match Worker PRICING (src/index.ts:52)
[[gateway.402_rules]]
tool = "oasis_execute"      ; + 7 other premium tools
price_usdc = "0.05"
network = "base-sepolia"

[[gateway.402_rules]]
tool = "jitterbug-run"      ; + brain-dump
price_usdc = "0.25"
network = "base-sepolia"

# Edge rate-limit
[gateway.ratelimit]
anonymous   = "20 req/min"
did_verified = "200 req/min"
partner      = "custom"   # allowlist callerIds

# WAF
[gateway.waf]
managed = "OWASP + bot-mitigation"
allowlist = ["partner callerIds"]
```

Fallback if the gateway route is disabled: DNS/proxy returns the Worker directly (standalone x402).

## 4. Fallback (live today, no gateway)

The `mcp-x402` Worker already issues 402 + verifies via `facilitator()` (testnet `FACILITATOR_URL=https://facilitator.x402.org`, no-auth fallback) and routes paid tools through `paymentMiddleware`. L3.4 (Node bridge + first paid tools) attaches behind it. No Cloudflare Gateway dependency is required for the system to function.

Worker bindings (`wrangler.toml`):
```toml
[vars]
NETWORK = "base-sepolia"                                  # flip to "base" after mainnet settlement confirmed
PAY_TO = "0xPAY_TO_RECEIVER"                          # settlement receiver (reuse for gateway treasury)
FACILITATOR_URL = "https://facilitator.x402.org"
BILLING_INGEST_URL = "https://taler-bridge-billing.p31ca.org/api/revenue/ingest"
# FACILITATOR_KEY_ID + FACILITATOR_SECRET_KEY (mainnet CDP auth) enable production settlement
# REVENUE_API_TOKEN                               # protects the billing ingest endpoint
```

## 5. Resolved questions (from draft §5)

1. **Same `Payment-Signature` header shape?** The Worker uses `x402-hono`'s standard facilitator verify; the managed gateway expects the same x402 `Payment-Signature`/`X-Payment-*` header. If the gateway GA differs, add an adapter at the Worker ingress (one small middleware) — no bridge change.
2. **Settlement payout address?** Reuse Worker `PAY_TO` as the gateway treasury to keep `RevenueTracker` single-source. Confirm gateway honors `PAY_TO` or document the divergence at clearance.
3. **Gateway quota vs Worker KV quota?** Gateway should honor Worker-issued free-tier `callerId` tiers; if it re-derives from `Payment-Signature` payer address, the free-tier KV logic in the Worker remains authoritative for the standalone path. No action until GA.

## 6. Verification

- **Standalone (today):** `cd software/workers/mcp-x402-gateway && npx wrangler deploy --dry-run` → green (validated `bf8c991`, Total Upload 4865 KiB, bindings resolve).
- **Gateway (at clearance):** run the §2 procedure, then a paid-tool call on `base-sepolia` returns 200 (not 402) after x402 payment; confirm `RevenueTracker` ingests via `BILLING_INGEST_URL`. Flip `NETWORK` to `base` only after payout confirmed.
