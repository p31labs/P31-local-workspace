/**
 * mcp-x402-gateway — Thin x402 Worker (L3.2: Map x402 payment
 * middleware to local Base testnet fallback).
 *
 * Reuses the EXACT facilitator + paymentMiddleware pattern from
 * `software/workers/taler-bridge-billing/src/index.ts` (lines 15-20, 54-60,
 * 165-181) — the proven x402 primitives already shipping in production.
 *
 * Phase 1 (this file): standalone x402 Worker. Gates premium /
 * premium-high MCP tools with a 402 challenge. Free + metered-low tools
 * stay open. Settlement lands in the SAME RevenueTracker DO via
 * `POST /api/revenue/ingest` (taler-bridge-billing), so the
 * RevenueBadge dashboard shows combined x402 MCP revenue.
 *
 * The Node stdio bridge (spawns the 4 MCP servers) is L3.4.
 */

import { Hono } from "hono";
import { paymentMiddleware } from "x402-hono";
import { createFacilitatorConfig } from "@coinbase/x402";

interface Env {
  PAY_TO: string;
  NETWORK: string;
  FACILITATOR_URL: string;
  FACILITATOR_KEY_ID: string;
  FACILITATOR_SECRET_KEY: string;
  REVENUE_INGEST_URL: string;
  REVENUE_API_TOKEN?: string;
}

type AppContext = { Bindings: Env };

const app = new Hono<AppContext>();

/**
 * Build the facilitator config. On mainnet this must carry CDP API-key auth
 * (the public x402.org facilitator is testnet-only). We only attach auth
 * headers when both key id + secret are present, so the testnet facilitator
 * (no auth) keeps working unchanged. — mirrors `facilitator()` in
 * taler-bridge-billing/src/index.ts:54-60.
 */
function facilitator(c: Env) {
  const base = { url: c.FACILITATOR_URL };
  if (c.FACILITATOR_KEY_ID && c.FACILITATOR_SECRET_KEY) {
    return { ...base, ...createFacilitatorConfig(c.FACILITATOR_KEY_ID, c.FACILITATOR_SECRET_KEY) };
  }
  return base; // testnet fallback (no auth)
}

// Pricing tiers from spec §3.3 (seeded defaults; hot-reloadable via PRICING_JSON).
const PRICING: Record<string, { price: string; network: string; description: string }> = {
  // premium ($0.05)
  "oasis_execute": { price: "0.05", network: "base-sepolia", description: "Host command execution (sandboxed)" },
  "phos-adopt": { price: "0.05", network: "base-sepolia", description: "File adoption (spoon-gated)" },
  "phos-learn": { price: "0.05", network: "base-sepolia", description: "Filesystem scan + learn" },
  "phos-rollback": { price: "0.05", network: "base-sepolia", description: "Revert adopted moves" },
  "phos-watch": { price: "0.05", network: "base-sepolia", description: "Background file watcher" },
  "bus-emit": { price: "0.05", network: "base-sepolia", description: "Emit event-bus message" },
  "phos-deploy": { price: "0.05", network: "base-sepolia", description: "Cloudflare deploy (spoon-gated)" },
  "healer-remediate": { price: "0.05", network: "base-sepolia", description: "Autonomous remediation" },
  // premium-high ($0.25)
  "jitterbug-run": { price: "0.25", network: "base-sepolia", description: "Ambient exocortex LLM orchestration (spoon-gated)" },
  "brain-dump": { price: "0.25", network: "base-sepolia", description: "LLM elaboration (premium-high)" },
};

// x402-gated MCP endpoint. The Node bridge (L3.4) reads the stdio
// backends; this Worker issues the 402 + verifies payment, then forwards
// to the bridge over a service binding. Phase 1: issue + verify only.
app.use("/mcp", async (c, next) => {
  if (c.req.method !== "POST") return next();
  const toolName = (await c.req.json().catch(() => ({}))?.params?.name ?? "";
  const priced = PRICING[toolName];
  if (!priced) return next(); // free / metered-low: open

  const mw = paymentMiddleware(
    c.env.PAY_TO as `0x${string}`,
    {
      "/mcp": {
        price: `$${priced.price}`,
        network: c.env.NETWORK,
        config: { description: priced.description },
      },
    },
    facilitator(c.env)
  );
  return mw(c, next);
});

// Land settled MCP revenue into the SAME RevenueTracker DO as
// taler-bridge-billing (exact /api/revenue/ingest shape).
app.post("/api/revenue/ingest", async (c) => {
  const token = c.env.REVENUE_API_TOKEN;
  if (token) {
    const auth = c.req.header("Authorization") || "";
    if (auth !== `Bearer ${token}`) return c.json({ error: "Unauthorized" }, 401);
  }
  let body: { wallet?: string; amount?: string; source?: string; txId?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  if (!body.wallet || body.amount === undefined || !body.source) {
    return c.json({ error: "Missing wallet, amount, or source" }, 400);
  }
  // Forward to taler-bridge-billing ingest (already built for this shape).
  const res = await fetch(c.env.REVENUE_INGEST_URL, {
    method: "POST",
    headers: token ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` } : { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet: body.wallet,
      amount: String(body.amount),
      source: `mcp-x402:${body.source}`,
      txId: body.txId,
    }),
  });
  return c.json(await res.json().catch(() => ({ ok: res.ok })), res.status as 200 | 401 | 500);
});

app.get("/health", (c) => c.json({ status: "ok", service: "mcp-x402-gateway", network: c.env.NETWORK, timestamp: Date.now() }));

// Advertise per-tool cost (spec §3.3).
app.get("/.well-known/mcp-pricing", (c) => c.json({
  currency: "USDC",
  network: c.env.NETWORK,
  tiers: {
    free: "$0 (always 200, no 402)",
    "metered-low": "$0.01",
    premium: "$0.05",
    "premium-high": "$0.25",
  },
  tools: PRICING,
}));

export default app;
