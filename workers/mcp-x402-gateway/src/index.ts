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
import { verifyLoveHmac, resolveSecret } from "./love-auth";
import { meterGlm } from "./llm-meter";
import { runAgent } from "./orchestrator";

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
  // Phase 4 — GLM metering: where to call love-ledger /llm/* and which model.
  LOVE_LEDGER_URL?: string;
  GLM_MODEL?: string;
  // Revenue-ledger integration (Phase 1 completion).
  REVENUE_LEDGER_URL?: string;
  // Entitlement Service — preflight credit gate (Phase 2).
  ENTITLEMENT_URL?: string;
  ENTITLEMENT_API_TOKEN?: string;
  // Workers AI binding (GLM-4.7-Flash + others).
  AI?: any;
  // Phase 3 — Needle-as-a-Service binding (intent-resolver POST /classify).
  NEEDLE?: Fetcher;
  // CWP-2026-015 (A) — agent-runtime built-in tool executor.
  AGENT_RUNTIME?: Fetcher;
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
function facilitator(c: Env, version: 'v1' | 'v2') {
  const url = c.FACILITATOR_URL as `${string}://${string}`;
  if (c.FACILITATOR_KEY_ID && c.FACILITATOR_SECRET_KEY) {
    const cfg = createFacilitatorConfig(c.FACILITATOR_KEY_ID, c.FACILITATOR_SECRET_KEY);
    if (version === 'v2') {
      return { url, createAuthHeaders: cfg.createAuthHeaders, version: 'v2' as const };
    }
    return { url, createAuthHeaders: cfg.createAuthHeaders };
  }
  if (version === 'v2') {
    return { url, version: 'v2' as const };
  }
  return { url };
}

// Pricing tiers from spec §3.3 (seeded defaults; hot-reloadable via PRICING_JSON).

/**
 * Verify an x402 v2 payment token via the facilitator.
 * Calls POST /verify-v2 on the facilitator with the raw token + expected amount.
 * Uses CDP auth headers when FACILITATOR_KEY_ID + FACILITATOR_SECRET_KEY are set.
 */
async function verifyV2Payment(env: Env, token: string, expectedPrice: string): Promise<boolean> {
  const facilitatorUrl = env.FACILITATOR_URL;
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (env.FACILITATOR_KEY_ID && env.FACILITATOR_SECRET_KEY) {
      const cfg = createFacilitatorConfig(env.FACILITATOR_KEY_ID, env.FACILITATOR_SECRET_KEY);
    const authHeaders = cfg.createAuthHeaders?.();
    if (authHeaders) {
      Object.assign(headers, authHeaders);
    }
    }

    const res = await fetch(`${facilitatorUrl}/verify-v2`, {
      method: "POST",
      headers,
      body: JSON.stringify({ token, expected_amount: expectedPrice }),
    });
    const data = await res.json() as Record<string, any>;
    return data.verified === true;
  } catch {
    return false;
  }
}
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
  // SOULSAFE + Ground-Truth (2026-07-28, L3.5) — metered-low ($0.01)
  "soulsafe_gate1_self_review": { price: "0.01", network: "base-sepolia", description: "SOULSAFE Gate 1 self-review checklist" },
  "soulsafe_gate2_cross_review": { price: "0.01", network: "base-sepolia", description: "SOULSAFE Gate 2 cross-review (information barrier)" },
  "truth_verify_baseline": { price: "0.01", network: "base-sepolia", description: "Verify-suite baseline payload" },
  "truth_register_fact": { price: "0.01", network: "base-sepolia", description: "Write a verified fact to ground-truth registry" },
  // premium ($0.05)
  "soulsafe_gate3_full": { price: "0.05", network: "base-sepolia", description: "SOULSAFE Gate 3 architect verification (full suite)" },
  "soulsafe_run_protocol": { price: "0.05", network: "base-sepolia", description: "SOULSAFE full 3-gate protocol run" },
  // SPACESHIP (2026-08-07) — metered-low ($0.01)
  "neo_pixel_control": { price: "0.01", network: "base-sepolia", description: "Set NeoPixel LED mode/color/brightness (spaceship)" },
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
    const loveSecret = await resolveSecret(c.env.LOVE_AUTH_SECRET);
    const ok = await verifyLoveHmac(
      c.req.header("X-Love-Auth-MAC"),
      c.req.header("X-Love-Timestamp"),
      loveSecret,
    );
    if (!ok) {
      return c.json({ error: "Invalid LOVE settlement auth" }, 401);
    }
  }

  const did = c.req.header("X-DID") || c.req.header("X-User-DID");
  if (!did) return next();
  const body = (await c.req.raw.clone().json().catch(() => ({}))) as any;
  const price = PRICING[body?.params?.name ?? ""]?.price ?? "0";
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

// Entitlement preflight gate — checks DID balance before x402 payment middleware.
// Runs AFTER LOVE dual-settlement router (line 127) but BEFORE x402 v2/v1 middlewares.
// Returns 402 if user has insufficient entitlement balance.
app.use("/mcp", async (c, next) => {
  if (c.req.method !== "POST") return next();

  const toolName = ((await c.req.raw.clone().json().catch(() => ({}))) as any)?.params?.name ?? "";
  const priced = PRICING[toolName];
  if (!priced) return next(); // free tools bypass entitlement check

  const did = c.req.header("X-DID") || c.req.header("X-User-DID");
  if (!did) return next(); // no DID = anonymous, let x402 handle payment

  const entitlementUrl = c.env.ENTITLEMENT_URL;
  if (!entitlementUrl) return next(); // entitlement not configured, fall through to x402

  try {
    const checkUrl = `${entitlementUrl}/entitlement/check`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (c.env.ENTITLEMENT_API_TOKEN) {
      headers["Authorization"] = `Bearer ${c.env.ENTITLEMENT_API_TOKEN}`;
    }

    const res = await fetch(checkUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        did,
        tool_id: toolName,
        estimated_cost_usdc: priced.price,
      }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      return c.json({
        error: data.error || "Entitlement check failed",
        x402_version: "2.0",
        tool: toolName,
        cost: priced.price,
      }, res.status === 402 ? 402 : 500);
    }

    const result = await res.json() as any;
    if (!result.ok) {
      return c.json({
        error: result.message || "Insufficient entitlement balance",
        x402_version: "2.0",
        tool: toolName,
        cost: priced.price,
        balance: result.balance,
      }, 402, {
        "X-Entitlement-Balance": result.balance || "0",
        "X-Entitlement-Required": priced.price,
      });
    }
  } catch {
    // Entitlement service unreachable — fail open to x402 payment flow
    return next();
  }

  return next();
});

// x402 v2 header-based payment middleware (stateless, self-hosted paywalls).
// Reads payment proof from X-Payment-Token header instead of request body.
// Runs BEFORE the v1 body-based middleware to maintain dual-mode support.
app.use("/mcp", async (c, next) => {
  if (c.req.method !== "POST") return next();

  const paymentToken = c.req.header("X-Payment-Token");
  if (!paymentToken) return next(); // no v2 token → let v1 middleware handle it

  const toolName = ((await c.req.raw.clone().json().catch(() => ({}))) as any)?.params?.name ?? "";
  const priced = PRICING[toolName];
  if (!priced) return next(); // free tools: always 200, no payment needed

  const verified = await verifyV2Payment(c.env, paymentToken, priced.price);
  if (!verified) {
    return c.json({
      error: "Payment required",
      x402_version: "2.0",
      payment_required: `$${priced.price}`,
      network: c.env.NETWORK,
      payTo: c.env.PAY_TO,
    }, 402, {
      'X-Payment-Required': `$${priced.price}`,
      'X-Payment-Network': c.env.NETWORK,
      'X-Payment-Accept': 'application/x402-v2',
      'Access-Control-Expose-Headers': 'X-Payment-Required, X-Payment-Network, X-Payment-Accept',
    });
  }

  // Payment verified, proceed to v1 middleware (no-op since payment is settled).
  return next();
});

// x402 v1 body-based payment middleware (legacy, maintained for backward compat).
// The Node bridge (L3.4) reads the stdio
// backends; this Worker issues the 402 + verifies payment, then forwards
// to the bridge over a service binding. Phase 1: issue + verify only.
app.use("/mcp", async (c, next) => {
  if (c.req.method !== "POST") return next();
  // Peek the body without consuming it (clone) so the downstream /mcp
  // route can still read the original request stream.
  const toolName = ((await c.req.raw.clone().json().catch(() => ({}))) as any)?.params?.name ?? "";
  const priced = PRICING[toolName];
  if (!priced) return next(); // free tools: always 200, no 402

  const mw = paymentMiddleware(
    c.env.PAY_TO as `0x${string}`,
    {
      "/mcp": {
        price: `$${priced.price}`,
        network: c.env.NETWORK as any,
        config: { description: priced.description },
      },
    },
    facilitator(c.env, 'v1')
  );
  return mw(c, next);
});

// mcp-x402-gateway → revenue-ledger (fire-and-forget, non-blocking).
async function recordX402Revenue(c: AppContext["Bindings"], toolName: string, did: string, price: string, network: string, execCtx: ExecutionContext) {
  const url = c.REVENUE_LEDGER_URL;
  if (!url) return;
  const body = JSON.stringify({
    source: "x402",
    payer_did: did,
    merchant_did: c.PAY_TO,
    amount_usdc: price,
    asset: "USDC",
    metadata: { tool: toolName, network },
  });
  execCtx.waitUntil(
    fetch(`${url}/revenue/record`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }).catch(() => {})
  );
}

// mcp-x402-gateway → entitlement service (consume balance after payment).
async function consumeEntitlement(c: AppContext["Bindings"], did: string, toolName: string, price: string, execCtx: ExecutionContext) {
  const url = c.ENTITLEMENT_URL;
  if (!url || !did) return;
  const txHash = `x402-${toolName}-${crypto.randomUUID()}`;
  execCtx.waitUntil(
    fetch(`${url}/entitlement/consume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        did,
        tool_id: toolName,
        amount_usdc: price,
        tx_hash: txHash,
      }),
    }).catch(() => {})
  );
}

// L5 — Bridge forward. The prior code only issued/verified the 402
// and then 404'd (no downstream /mcp handler). This closes the loop:
// paid AND free calls now proxy to the L3.4 Node stdio<->HTTP bridge.
app.post("/mcp", async (c) => {
  const bodyText = await c.req.text();
  let body: any = {};
  try { body = JSON.parse(bodyText); } catch {}
  const toolName = body?.params?.name ?? "";
  const priced = PRICING[toolName];
  const did = c.req.header("X-DID") || c.req.header("X-User-DID");

  const upstream = await fetch(c.env.BRIDGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: bodyText,
  });
  const upstreamText = await upstream.text();

  if (priced && did) {
    recordX402Revenue(c.env, toolName, did, priced.price, priced.network, c.executionCtx as any);
    consumeEntitlement(c.env, did, toolName, priced.price, c.executionCtx as any);
  }

  return new Response(upstreamText, {
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

// Phase 4 (CWP-2026-013) — Reserve & Refund GLM metering endpoint.
// Reserves max LOVE upfront, streams GLM-4.7-Flash (Workers AI), and refunds
// the unspent difference on stream flush via ctx.waitUntil. Turns GLM into a
// self-funding revenue engine. Auth: X-DID + (optional) LOVE settlement HMAC.
app.post("/llm/complete", async (c) => {
  const did = c.req.header("X-DID") || c.req.header("X-User-DID");
  if (!did) return c.json({ error: "Missing X-DID header" }, 400);

  // Axis-6: require HMAC proof when LOVE_AUTH_SECRET is configured.
  if (c.env.LOVE_AUTH_SECRET) {
    const loveSecret = await resolveSecret(c.env.LOVE_AUTH_SECRET);
    const ok = await verifyLoveHmac(
      c.req.header("X-Love-Auth-MAC"),
      c.req.header("X-Love-Timestamp"),
      loveSecret,
    );
    if (!ok) return c.json({ error: "Invalid LOVE settlement auth" }, 401);
  }

  const body = (await c.req.json().catch(() => ({}))) as any;
  const maxTokens = Math.min(Math.max(parseInt(String(body.max_tokens ?? "4096"), 10) || 4096, 1), 32000);
  const model = body.model || c.env.GLM_MODEL || "glm-4.7-flash";
  const messages =
    body.messages ??
    (body.prompt ? [{ role: "user", content: String(body.prompt) }] : []);
  if (!Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: "Missing messages or prompt" }, 400);
  }

  return meterGlm(c.env, c.executionCtx, { did, maxTokens, model, messages });
});

// Phase 3 — proxy natural-language -> P31 tool resolution to the Needle
// service (intent-resolver POST /classify). Axis-6 HMAC-gated (creation action).
// A cold needle isolate is guarded by an 8s abort so it can never hang the
// gateway; on any failure we fail closed to a clean fallback.
app.post("/classify", async (c) => {
  if (!c.env.NEEDLE) return c.json({ error: "NEEDLE service not bound" }, 503);
  if (c.env.LOVE_AUTH_SECRET) {
    const loveSecret = await resolveSecret(c.env.LOVE_AUTH_SECRET);
    const ok = await verifyLoveHmac(
      c.req.header("X-Love-Auth-MAC"),
      c.req.header("X-Love-Timestamp"),
      loveSecret,
    );
    if (!ok) return c.json({ error: "Invalid LOVE settlement auth" }, 401);
  }
  const body = (await c.req.json().catch(() => ({}))) as any;
  if (!body?.prompt || !Array.isArray(body?.tools) || body.tools.length === 0) {
    return c.json({ error: "Missing prompt or tools[]" }, 400);
  }
  // Guard the sub-request so a cold needle isolate can never hang the gateway
  // indefinitely. The needle cold-start is ~20-28s (22 MB R2 model load), so
  // the ceiling tracks that rather than a tight timeout.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const upstream = await c.env.NEEDLE.fetch("https://intent-resolver/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: body.prompt, tools: body.tools }),
      signal: ctrl.signal,
    });
    return c.json(await upstream.json(), upstream.status as 200 | 400 | 503);
  } catch {
    // Needle cold-start/timeout — fail closed to a clean fallback.
    return c.json({ needle_used: false, fallback_reason: "Needle service unavailable" }, 200);
  } finally {
    clearTimeout(timer);
  }
});

app.get("/health", (c) => c.json({ status: "ok", service: "mcp-x402-gateway", network: c.env.NETWORK, timestamp: Date.now() }));

// CWP-2026-014 — Agent Orchestrator. Natural-language query → classify (needle
// → GLM fallback) → plan → execute via bridge → settle as a PQC care contract
// in LOVE. Axis-6 HMAC-gated (creation action). See orchestrator.ts.
app.post("/agent/run", async (c) => {
  const did = c.req.header("X-DID") || c.req.header("X-User-DID");
  if (!did) return c.json({ error: "Missing X-DID header" }, 400);
  if (c.env.LOVE_AUTH_SECRET) {
    const loveSecret = await resolveSecret(c.env.LOVE_AUTH_SECRET);
    const ok = await verifyLoveHmac(
      c.req.header("X-Love-Auth-MAC"),
      c.req.header("X-Love-Timestamp"),
      loveSecret,
    );
    if (!ok) return c.json({ error: "Invalid LOVE settlement auth" }, 401);
  }
  const body = (await c.req.json().catch(() => ({}))) as any;
  body.did = did;
  return runAgent(c.env, body);
});

// Advertise per-tool cost (spec §3.3) + x402 v2 dual-mode capability.
app.get("/.well-known/mcp-pricing", (c) => c.json({
  x402_version: "2.0",
  supports_v1: true,
  supports_v2: true,
  v2_header: "X-Payment-Token",
  v2_payment_header: "X-Payment-Required",
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

// MCP Server Card (2026-07-28 spec). Advertises the gateway's capabilities
// so agents can discover it without an initialize handshake.
app.get("/.well-known/mcp", (c) => c.json({
  protocolVersion: "2026-07-28",
  serverInfo: { name: "p31-mcp-x402-gateway", version: "2.0.0" },
  capabilities: { tools: {} },
  x402: { version: "2.0", supports_v1: true, supports_v2: true },
  url: c.env.BRIDGE_URL || "https://mcp-x402-bridge.p31ca.org/mcp",
  pricing: { wellKnown: "/.well-known/mcp-pricing" },
}));

export default app;
