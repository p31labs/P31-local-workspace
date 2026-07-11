# L3.3 — Cloudflare Monetization Gateway Config (MCP waitlist clearance)

**CWP-2026-009 / Axis L3 (MCP Monetization).** Companion to `docs/MCP_MONETIZATION_GATEWAY_SPEC.md` §4.
Status: 🟡 DRAFT config — managed gateway is **waitlisted (~2026)**; custom `mcp-x402` Worker (L3.2, `bf8c991`) is the live fallback.

## 1. Topology (recommended split — spec §4)

```
caller ─┐
        ├──▶ [Cloudflare Monetization Gateway]  (waitlist, 2026)   ← 402 + facilitator + settlement + WAF/edge rate-limit
caller ─┘        │  /mcp (x402-aware edge)
                 ▼
        [mcp-x402 Worker]  (software/workers/mcp-x402-gateway)     ← MCP Streamable HTTP, per-tool pricing, free-tier KV quota
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
3. **Mirror pricing** (`$.05` premium, `$.25` premium-high) in the gateway's 402 rules so edge + Worker agree (Worker table remains source of truth for free-tier quota).
4. **Enable edge protections:** WAF managed rules + per-identity rate limit (anonymous smallest quota, highest price; `partner` allowlist).
5. **Keep** the Worker's `paymentMiddleware` active as defense-in-depth (idempotent — a payment accepted at the edge is re-verified, not double-charged; facilitator is read-only verify).
6. **Verify** end-to-end on `base-sepolia` (Worker `NETWORK="base-sepolia"`), then flip `NETWORK` to mainnet `base` only after settlement payout is confirmed.

## 3. Gateway route / rate-limit sketch (illustrative)

```
route:  https://mcp.p31ca.org/mcp   →  Monetization Gateway  →  upstream: mcp-x402 Worker
402 assets:  USDC on Base; price map = { premium: $0.05, premium-high: $0.25 }
edge rate-limit:  anonymous 20 req/min; did-verified 200 req/min; partner custom
WAF:  managed OWASP + bot mitigation; allowlist partner callerIds
fallback:  if gateway route disabled → DNS/proxy returns Worker directly (standalone x402)
```

## 4. Fallback (live today, no gateway)

The `mcp-x402` Worker already issues 402 + verifies via `facilitator()` (testnet `FACILITATOR_URL`, no-auth fallback) and routes paid tools through `paymentMiddleware`. L3.4 (Node bridge + first paid tools) attaches behind it. No Cloudflare Gateway dependency is required for the system to function.

## 5. Open questions (resolve at clearance)

- Does the managed gateway accept the **same** `Payment-Signature` header shape as `x402-hono`? (If not, add an adapter at the Worker ingress.)
- Settlement payout address = Worker `PAY_TO` (reuse) or a gateway-managed treasury? (Recommend reuse `PAY_TO` to keep `RevenueTracker` single-source.)
- Gateway quota vs Worker KV quota: confirm gateway honors Worker-issued free-tier `callerId` tiers or re-derive from `Payment-Signature` payer address.
