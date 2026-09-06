/**
 * taler-bridge-billing — x402 pay-per-call premium endpoint for the
 * LOVE Ledger <-> GNU Taler bridge.
 *
 * Fully automated revenue: a client pays USDC on Base via the x402 protocol
 * (no signup, no API keys) to receive a "community onboarding manifest" — a real
 * Taler reserve_pub (Crockford base32) plus the live exchange configuration.
 * No human interaction is required after deploy.
 *
 * Free Plan safe: no D1/KV needed; reads only env vars and makes outbound fetches.
 *
 * Strategy: docs/grants/DELTA_REVENUE_MESH.md
 */

import { Hono } from "hono";
import { paymentMiddleware } from "x402-hono";
import { createFacilitatorConfig } from "@coinbase/x402";
import { RevenueTracker, type RevenueEvent } from "./revenue-tracker.ts";
import { signPremiumToken } from "./premium-token.ts";
import { buildDonationOrder, fulfillDonation } from "./taler-donate.ts";
export { RevenueTracker };

interface Env {
  PAY_TO: string;
  NETWORK: string;
  EXCHANGE_BASE_URL: string;
  PREMIUM_PRICE: string;
  FACILITATOR_URL: string;
  FACILITATOR_KEY_ID: string;
  FACILITATOR_SECRET_KEY: string;
  PAYOUT_WALLET_ADDRESS?: string; // tournament prize escrow wallet
  TOURNAMENT_ENTRY_FEE?: string;  // e.g. "0.25"
  REVENUE_API_TOKEN?: string;     // bearer token for admin revenue endpoint
  PREMIUM_SECRET?: string;        // shared HMAC secret for premium tokens
  RevenueTracker: DurableObjectNamespace;
  // ── Taler donation / tip endpoint (ADDITIVE) ──
  TALER_EXCHANGE_URL?: string;        // Taler exchange base URL. Dev default: demo.
  TALER_MERCHANT_URL?: string;        // Taler merchant backend base URL (prod). If absent → direct payto mode.
  TALER_MERCHANT_PAYTO?: string;      // payto:// bank URI for direct donations (e.g. payto://iban/DE.../P31?receiver-name=P31).
  TALER_DONATION_CURRENCY?: string;   // e.g. "EUR". Default EUR.
  TALER_DONATION_DEFAULT_AMOUNT?: string; // e.g. "EUR:5". Default EUR:5.
  TALER_DONATION_FULFILL_URL?: string;    // public base URL for fulfillment callback (optional).
  TALER_WIRED?: string;               // "true" to perform live merchant-backend/exchange calls. Dev default false.
  // Revenue-ledger integration (Phase 1 completion).
  REVENUE_LEDGER_URL?: string;
}

type AppContext = { Bindings: Env };

const app = new Hono<AppContext>();

// Build the facilitator config. On mainnet this must carry CDP API-key auth
// (the public x402.org facilitator is testnet-only). We only attach auth headers
// when both key id + secret are present, so the testnet facilitator (no auth) keeps
// working unchanged.
function facilitator(c: AppContext["Bindings"]) {
  const base = { url: c.FACILITATOR_URL };
  if (c.FACILITATOR_KEY_ID && c.FACILITATOR_SECRET_KEY) {
    return { ...base, ...createFacilitatorConfig(c.FACILITATOR_KEY_ID, c.FACILITATOR_SECRET_KEY) };
  }
  return base;
}

// taler-bridge-billing → revenue-ledger (fire-and-forget, non-blocking).
async function forwardToRevenueLedger(c: AppContext["Bindings"], payload: Record<string, any>) {
  const url = c.REVENUE_LEDGER_URL;
  if (!url) return;
  c.executionCtx.waitUntil(
    fetch(`${url}/revenue/record`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {})
  );
}

// Record a successful payment in the RevenueTracker DO.
async function recordRevenue(
  c: AppContext["Bindings"],
  wallet: string,
  amount: string,
  source: string,
  extra?: { timestamp?: number; txId?: string }
) {
  try {
    const id = c.RevenueTracker.idFromName("global");
    const stub = c.RevenueTracker.get(id);
    await stub.fetch("https://e/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet,
        amount,
        source,
        timestamp: extra?.timestamp ?? Date.now(),
        ...(extra?.txId ? { txId: extra.txId } : {}),
      }),
    });
  } catch {}
}

// ── Taler Crockford base32 (mirrors software/workers/taler-exchange-bridge) ──
const TALER_BASE32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function crockfordEncode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += TALER_BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += TALER_BASE32[(value << (5 - bits)) & 31];
  return out;
}

// A Taler reserve_pub is an Ed25519 public key; generate a real one and encode it
// in Taler's Crockford base32 wire format (no prefix). 32 bytes -> 52 chars.
async function generateReservePub(): Promise<string> {
  const kp = await crypto.subtle.generateKey({ name: "Ed25519" }, false, ["sign", "verify"]);
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
  return crockfordEncode(raw);
}

async function fetchExchangeConfig(baseUrl: string): Promise<{ currency: string | null; denominations: number }> {
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/config`);
    const body = (await res.json()) as any;
    return {
      currency: body?.currency ?? null,
      denominations: Array.isArray(body?.denominations) ? body.denominations.length : 0,
    };
  } catch {
    return { currency: null, denominations: 0 };
  }
}

// ── Public info (no payment required) ──
app.get("/", (c) =>
  c.json({
    service: "taler-bridge-billing",
    model: "x402 pay-per-call (USDC on Base)",
    network: c.env.NETWORK,
    premium: {
      endpoints: [
        "POST /api/community-onboarding",
        "POST /api/arcade-premium",
      ],
      price: c.env.PREMIUM_PRICE,
      description: "Reserve_pub + live Taler exchange config (onboarding) | Arcade Premium Mode (24h)",
    },
    see_also: "https://taler-exchange-bridge.trimtab-signal.workers.dev/status",
  })
);

app.get("/status", (c) =>
  c.json({
    service: "taler-bridge-billing",
    network: c.env.NETWORK,
    pay_to_configured: !c.env.PAY_TO.startsWith("0x0000"),
  })
);

app.get("/api/community-onboarding", (c) =>
  c.json({
    endpoint: "POST /api/community-onboarding",
    price: c.env.PREMIUM_PRICE,
    network: c.env.NETWORK,
    pay_instructions:
      "Send an x402 payment (USDC on Base) and retry with the Payment-Signature header. See https://x402.org.",
  })
);

// ── Premium, payment-gated route (POST only; GET stays free) ──
// Attach on the path (all methods) and gate only POST inside, so the public GET
// info handler stays free. The route key "/" + verb "*" matches POST via x402.
app.use("/api/community-onboarding", async (c, next) => {
  if (c.req.method !== "POST") return next();
  const mw = paymentMiddleware(
    c.env.PAY_TO as `0x${string}`,
    {
      "/api/community-onboarding": {
        price: c.env.PREMIUM_PRICE,
        network: c.env.NETWORK,
        config: {
          description: "Community Taler onboarding manifest (reserve_pub + live exchange config)",
        },
      },
    },
    facilitator(c)
  );
  return mw(c, next);
});

app.post("/api/community-onboarding", async (c) => {
  const reservePub = await generateReservePub();
  const cfg = await fetchExchangeConfig(c.env.EXCHANGE_BASE_URL);
  await recordRevenue(c.env, c.env.PAY_TO, c.env.PREMIUM_PRICE.replace("$", ""), "community-onboarding");
  forwardToRevenueLedger(c.env, {
    source: "taler",
    payer_did: c.env.PAY_TO,
    merchant_did: c.env.PAY_TO,
    amount_usdc: c.env.PREMIUM_PRICE.replace("$", ""),
    asset: "EUR",
    metadata: { currency: "EUR", exchange_rate: "1.08" },
  });
  return c.json({
    reserve_pub: reservePub,
    exchange_base_url: c.env.EXCHANGE_BASE_URL,
    currency: cfg.currency,
    denominations_available: cfg.denominations,
    onboarding_manifest: [
      "Provision/point EXCHANGE_BASE_URL at your Taler exchange (or testnet)",
      "Fund the reserve via bank wire referencing the reserve_pub above",
      "Wallet performs blind withdrawal against the exchange",
      "Spend with payer anonymity; merchant transparency preserved",
    ],
    generated_at: new Date().toISOString(),
    billed_via: "x402 (USDC on Base)",
  });
});

// ── Arcade Premium (Phase 4 of the arcade overhaul) ──
// x402-gated unlock for all four games. Real, automated revenue with no signup
// and no human interaction. The browser client probes this route; a 402 with the
// x402 Payment-Requirements header tells the wallet what to pay.
app.use("/api/arcade-premium", async (c, next) => {
  if (c.req.method !== "POST") return next();
  const mw = paymentMiddleware(
    c.env.PAY_TO as `0x${string}`,
    {
      "/api/arcade-premium": {
        price: c.env.PREMIUM_PRICE,
        network: c.env.NETWORK,
        config: {
          description: "P31 Arcade — Premium Mode (bashball, gridiron, cards, strategy-board)",
        },
      },
    },
    facilitator(c)
  );
  return mw(c, next);
});

app.post("/api/arcade-premium", async (c) => {
  await recordRevenue(c.env, c.env.PAY_TO, c.env.PREMIUM_PRICE.replace("$", ""), "arcade-premium");
  forwardToRevenueLedger(c.env, {
    source: "taler",
    payer_did: c.env.PAY_TO,
    merchant_did: c.env.PAY_TO,
    amount_usdc: c.env.PREMIUM_PRICE.replace("$", ""),
    asset: "EUR",
    metadata: { currency: "EUR", exchange_rate: "1.08" },
  });
  // Mint a server-signed premium token the client must present to the
  // arcade-room Durable Object to open an online (multiplayer) WebSocket.
  const premium = c.env.PREMIUM_SECRET
    ? await signPremiumToken(c.env.PREMIUM_SECRET)
    : { token: "", expiresAt: Date.now() + 24 * 60 * 60 * 1000 };
  return c.json({
    premium: true,
    games: ["bashball", "gridiron", "cards", "board"],
    duration_hours: 24,
    unlocked_at: new Date().toISOString(),
    billed_via: "x402 (USDC on Base)",
    token: premium.token,
    expiresAt: premium.expiresAt,
  });
});

// ── Tournament Entry Fee (Phase B) ──
// x402-gated entry fee for tournaments. Payment goes to the separate payout
// wallet (PAYOUT_WALLET_ADDRESS), NOT the Phenix donation wallet.
app.get("/api/tournament-entry", (c) =>
  c.json({
    endpoint: "POST /api/tournament-entry",
    price: c.env.TOURNAMENT_ENTRY_FEE || "0.25",
    network: c.env.NETWORK,
    pay_to: c.env.PAYOUT_WALLET_ADDRESS || c.env.PAY_TO,
  })
);

app.use("/api/tournament-entry", async (c, next) => {
  if (c.req.method !== "POST") return next();
  const payTo = (c.env.PAYOUT_WALLET_ADDRESS || c.env.PAY_TO) as `0x${string}`;
  const mw = paymentMiddleware(
    payTo,
    {
      "/api/tournament-entry": {
        price: c.env.TOURNAMENT_ENTRY_FEE || "0.25",
        network: c.env.NETWORK,
        config: {
          description: "P31 Arcade — Tournament Entry Fee",
        },
      },
    },
    facilitator(c)
  );
  return mw(c, next);
});

app.post("/api/tournament-entry", async (c) => {
  const wallet = c.env.PAYOUT_WALLET_ADDRESS || c.env.PAY_TO;
  const fee = c.env.TOURNAMENT_ENTRY_FEE || "0.25";
  await recordRevenue(c.env, wallet, fee, "tournament-entry");
  forwardToRevenueLedger(c.env, {
    source: "taler",
    payer_did: wallet,
    merchant_did: c.env.PAY_TO,
    amount_usdc: fee,
    asset: "EUR",
    metadata: { currency: "EUR", exchange_rate: "1.08" },
  });
  return c.json({
    paid: true,
    tournament_access: true,
    amount: fee,
    paid_to: wallet,
    billed_via: "x402 (USDC on Base)",
  });
});

// ── Taler Donation / Tip endpoint (ADDITIVE, privacy-preserving) ──
// Donor pays P31 (merchant) directly from a Taler wallet — no registration, no
// chargebacks. GET returns a Taler payment URI; POST records a completed donation
// into the SAME RevenueTracker DO as x402 payments (source: "donation").
app.get("/donate", async (c) => {
  const req = {
    amount: c.req.query("amount"),
    message: c.req.query("message"),
  };
  try {
    const order = await buildDonationOrder(c.env, req);
    return c.json(order);
  } catch {
    return c.json({ error: "failed to build donation order" }, 500);
  }
});

app.post("/donate", async (c) => {
  let proof: any = {};
  try {
    proof = await c.req.json();
  } catch {
    /* allow empty body; proof may come via query/headers */
  }
  try {
    const result = await fulfillDonation(c.env, {
      amount: proof?.amount,
      order_id: proof?.order_id,
      wire_subject: proof?.wire_subject,
      coin_pub: proof?.coin_pub,
      txId: proof?.txId,
    });
    const eurAmount = String(proof?.amount || c.env.TALER_DONATION_DEFAULT_AMOUNT || "EUR:5").replace("EUR:", "");
    forwardToRevenueLedger(c.env, {
      source: "taler",
      payer_did: proof?.coin_pub || proof?.wallet || "taler-wallet",
      merchant_did: c.env.PAY_TO,
      amount_usdc: eurAmount,
      asset: "EUR",
      metadata: { currency: "EUR", exchange_rate: "1.08" },
    });
    return c.json({ ok: true, ...result, billed_via: "GNU Taler (merchant direct)" });
  } catch (e) {
    return c.json({ error: (e as Error).message || "donation fulfillment failed" }, 400);
  }
});

// ── Revenue Dashboard ──
// Returns live totals from the RevenueTracker DO.
// Admin endpoint — requires REVENUE_API_TOKEN bearer token.
app.get("/api/admin/revenue", async (c) => {
  const token = c.env.REVENUE_API_TOKEN;
  if (token) {
    const auth = c.req.header("Authorization") || "";
    if (auth !== `Bearer ${token}`) return c.json({ error: "Unauthorized" }, 401);
  }
  const id = c.env.RevenueTracker.idFromName("global");
  const stub = c.env.RevenueTracker.get(id);
  const res = await stub.fetch("https://e/");
  return res;
});

// Public revenue summary — no auth, only total + count (no per-wallet breakdown).
app.get("/api/revenue", async (c) => {
  const id = c.env.RevenueTracker.idFromName("global");
  const stub = c.env.RevenueTracker.get(id);
  const res = await stub.fetch("https://e/");
  const data = await res.json<{ totalRevenue: string; recentEvents: unknown[] }>();
  return c.json({ total: data.totalRevenue, count: Array.isArray(data.recentEvents) ? data.recentEvents.length : 0 });
});

// ── External revenue ingest (ADDITIVE) ──
// Lets the local `mcp-x402-gateway` (and any other x402 surface) land settled
// payments into the SAME RevenueTracker DO, so they appear on the dashboard
// RevenueBadge. Mirrors `recordRevenue()`'s DO /record shape:
//   { wallet, amount, source, timestamp, txId? }
// `amount` is a plain dollar string (e.g. "0.05"); the DO parseFloat()s it.
// Protected by a bearer token when REVENUE_API_TOKEN is set (dev default: open).
app.post("/api/revenue/ingest", async (c) => {
  const token = c.env.REVENUE_API_TOKEN;
  if (token) {
    const auth = c.req.header("Authorization") || "";
    if (auth !== `Bearer ${token}`) return c.json({ error: "Unauthorized" }, 401);
  }
  let body: Partial<RevenueEvent>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  if (!body.wallet || body.amount === undefined || !body.source) {
    return c.json({ error: "Missing wallet, amount, or source" }, 400);
  }
  await recordRevenue(
    c.env,
    String(body.wallet),
    String(body.amount),
    String(body.source),
    body.txId ? { timestamp: body.timestamp, txId: String(body.txId) } : undefined
  );
  forwardToRevenueLedger(c.env, {
    source: "x402",
    payer_did: String(body.wallet),
    merchant_did: c.env.PAY_TO,
    amount_usdc: String(body.amount),
    asset: "USDC",
    settlement_tx: body.txId,
  });
  return c.json({ ok: true });
});

export default app;
