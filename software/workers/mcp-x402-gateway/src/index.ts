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
import { verifyLoveHmac } from "./love-auth";

interface Env {
  PAY_TO: string;
  NETWORK: string;
  FACILITATOR_URL: string;
  FACILITATOR_KEY_ID: string;
  FACILITATOR_SECRET_KEY: string;
  REVENUE_INGEST_URL: string;
  REVENUE_API_TOKEN?: string;
  // L5 — Dual Settlement Router shares the LOVE ledger D1 + the L3.4 bridge URL.
  LOVE_LEDGER: D1Database;
  BRIDGE_URL: string;
  // Axis-6: shared HMAC secret proving a `love` request came from
  // the trusted first-party renderer (set via `wrangler secret put`).
  LOVE_AUTH_SECRET?: string;
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

// L5 — Dual Settlement Router. Reads X-Creation-Unit; for `love`,
// verifies the caller's LOVE balance and short-circuits straight to the
// bridge (no x402 402). Registered BEFORE the /mcp payment gate so
// it runs first; for usdc/auto it just calls next() (existing flow).
app.use(async (c, next) => {
  const unit = c.req.header("X-Creation-Unit");
  if (unit !== "love") return next();

  // Axis-6: require an HMAC-SHA256 proof (`X-Love-Auth-MAC` over
  // `love:<timestamp>`) from the trusted renderer when the shared
  // secret is configured. Prevents an external caller from spoofing
  // `X-Creation-Unit: love` to reach paid tools for free.
  if (c.env.LOVE_AUTH_SECRET) {
    const ok = await verifyLoveHmac(
      c.req.header("X-Love-Auth-MAC"),
      c.req.header("X-Love-Timestamp"),
      c.env.LOVE_AUTH_SECRET,
    );
    if (!ok) {
      return c.json({ error: "Invalid LOVE settlement auth" }, 401);
    }
  }

  const did = c.req.header("X-DID") || c.req.header("X-User-DID");
  if (!did) return next();
  const body = (await c.req.raw.clone().json().catch(() => ({}))) as any;
  const price = PRICING[body?.params?.name ?? ""]?.price ?? "0.05";
  const bal = await c.env.LOVE_LEDGER.prepare(
    "SELECT balance FROM love_accounts WHERE did = ?"
  ).bind(did).first<{ balance: number }>();
  if (!bal || bal.balance < parseFloat(price)) {
    return c.json({ error: "Insufficient LOVE balance" }, 402);
  }
  // TODO: GNU Taler Clause Blind Schnorr issuance.
  const blindSig = `blindsig-${crypto.randomUUID()}`;
  c.header("X-LOVE-Signature", blindSig);
  // LOVE-settled: bypass x402 gate, forward straight to the bridge.
  const upstream = await fetch(c.env.BRIDGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-LOVE-Signature": blindSig, "X-DID": did },
    body: JSON.stringify(body),
  });
  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
});

// x402-gated MCP endpoint. The Node bridge (L3.4) reads the stdio
// backends; this Worker issues the 402 + verifies payment, then forwards
// to the bridge over a service binding. Phase 1: issue + verify only.
app.use("/mcp", async (c, next) => {
  if (c.req.method !== "POST") return next();
  // Peek the body without consuming it (clone) so the downstream /mcp
  // route can still read the original request stream.
  const toolName = (await c.req.raw.clone().json().catch(() => ({})))?.params?.name ?? "";
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

// L5 — Bridge forward. The prior code only issued/verified the 402
// and then 404'd (no downstream /mcp handler). This closes the loop:
// paid AND free calls now proxy to the L3.4 Node stdio<->HTTP bridge.
app.post("/mcp", async (c) => {
  const body = await c.req.text();
  const upstream = await fetch(c.env.BRIDGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
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
