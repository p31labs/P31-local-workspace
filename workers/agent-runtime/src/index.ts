/**
 * agent-runtime — P31 Agent Runtime Worker (CWP-2026-015, Workstream A).
 *
 * Built on the Cloudflare Agents SDK (`agents` package, v0.17.3). The `Agent`
 * class is retained for durable per-instance state + D1 `sql` + scheduling
 * (reused by later care-mesh work), but the built-in tools are served directly
 * from the Worker entry `fetch` — `routeAgentRequest` only dispatches
 * agent-protocol requests, so plain HTTP tool paths must be handled here.
 *
 * v1 built-in tools (per CWP-2026-015 §2.1):
 *   - send_notification    : Telegram (raw Bot API) or Discord (incoming webhook).
 *                             The SDK has no `messenger` export in 0.17.3, so both
 *                             channels use raw HTTP. did → telegram chat_id 1:1 for
 *                             now; a did→channel mapping table is a follow-up.
 *   - generate_care_report : queries love-ledger (`/care-score`, `/balance`)
 *                             via the LOVE_LEDGER service binding.
 *
 * The orchestrator (`mcp-x402-gateway`) routes these two built-ins here via a
 * service binding instead of the L3.4 bridge.
 */

import { Agent, routeAgentRequest } from "agents";

interface Env {
  // Durable Object namespace for this Agent (bound in wrangler.toml).
  AgentRuntime: any;
  // love-ledger Worker, for care-score / balance lookups.
  LOVE_LEDGER: Fetcher;
  // Telegram bot token (set via `wrangler secret put TELEGRAM_BOT_TOKEN`).
  TELEGRAM_BOT_TOKEN: string;
  // Discord incoming-webhook URL (set via `wrangler secret put DISCORD_WEBHOOK_URL`).
  // Used by the `discord` notification channel — a zero-cost Telegram alternative.
  DISCORD_WEBHOOK_URL?: string;
  // CWP-2026-016 (C) — Spike Land MCP integration (staged, off by default).
  ENABLE_SPIKE_LAND?: string;
  SPIKE_LAND_MCP_URL?: string;
  SPIKE_LAND_API_KEY?: string;
}

interface SendNotificationArgs {
  did: string;
  message: string;
  channel?: "telegram" | "discord" | "email" | "push";
  // Telegram chat id, OR a Discord webhook URL override (if it starts with http).
  // Falls back to `did` (Telegram 1:1 mapping) / `DISCORD_WEBHOOK_URL` (env).
  chat_id?: string;
}

interface CareReportArgs {
  did: string;
  date_range?: { from?: string; to?: string };
  format?: "json" | "text";
}

async function sendNotification(env: Env, body: SendNotificationArgs): Promise<Response> {
  const channel = body.channel ?? "telegram";

  if (channel === "telegram") {
    const chatId = body.chat_id ?? body.did;
    const token = env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return Response.json({ ok: false, error: "TELEGRAM_BOT_TOKEN not configured" }, { status: 500 });
    }
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: body.message, parse_mode: "HTML" }),
    });
    const data = await res.json().catch(() => null);
    return Response.json({ ok: res.ok, status: res.status, telegram: data });
  }

  if (channel === "discord") {
    // Allow a per-call webhook override (chat_id starting with http); otherwise
    // use the configured DISCORD_WEBHOOK_URL secret.
    const webhookUrl = body.chat_id?.startsWith("http") ? body.chat_id : env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      return Response.json({ ok: false, error: "DISCORD_WEBHOOK_URL not configured" }, { status: 500 });
    }
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: body.message }),
    });
    const data = await res.json().catch(() => null);
    return Response.json({ ok: res.ok, status: res.status, discord: data });
  }

  // v1: telegram + discord. email/push are stubbed for v2.
  return Response.json(
    { ok: false, error: `channel '${channel}' not implemented in v1 (telegram/discord only)` },
    { status: 501 },
  );
}

async function generateCareReport(env: Env, body: CareReportArgs): Promise<Response> {
  const did = body.did;
  if (!did) return Response.json({ ok: false, error: "Missing did" }, { status: 400 });

  // care-score and balance are independent — fetch in parallel (ephemeral,
  // stateless request path; removes one serial round-trip per report).
  const [scoreRes, balRes] = await Promise.all([
    env.LOVE_LEDGER.fetch(`https://love-ledger/care-score?did=${encodeURIComponent(did)}`),
    env.LOVE_LEDGER.fetch(`https://love-ledger/balance?did=${encodeURIComponent(did)}`),
  ]);
  const score = (await scoreRes.json().catch(() => null)) as { careScore?: number } | null;
  const balance = (await balRes.json().catch(() => null)) as any;

  const report = {
    did,
    careScore: score?.careScore ?? null,
    balance: balance ?? null,
    period: body.date_range ?? null,
    generated_at: Date.now(),
  };

  if (body.format === "text") {
    const text =
      `Care report for ${did}\n` +
      `Care score: ${report.careScore ?? "n/a"}\n` +
      `Balance: ${JSON.stringify(report.balance)}\n` +
      `Period: ${JSON.stringify(report.period)}\n` +
      `Generated: ${new Date(report.generated_at).toISOString()}`;
    return new Response(text, { headers: { "Content-Type": "text/plain" } });
  }
  return Response.json(report);
}

// Retained for durable state / scheduling (used by later care-mesh work).
export class AgentRuntime extends Agent<Env> {
  // CWP-2026-016 (C) — Spike Land MCP wiring (staged, off by default).
  // When ENABLE_SPIKE_LAND === "true" and SPIKE_LAND_MCP_URL is set, the agent
  // connects to Spike Land's MCP registry so its tools become available via
  // getAITools(). The endpoint is auth-gated and currently unverified, so this
  // is disabled by default and any failure is non-fatal.
  async onStart(): Promise<void> {
    if (this.env.ENABLE_SPIKE_LAND !== "true") return;
    const url = this.env.SPIKE_LAND_MCP_URL;
    if (!url) return;
    try {
      const headers: Record<string, string> = {};
      if (this.env.SPIKE_LAND_API_KEY) {
        headers["Authorization"] = `Bearer ${this.env.SPIKE_LAND_API_KEY}`;
      }
      await this.addMcpServer("spike-land", url, { transport: { headers } });
    } catch (e: any) {
      console.error("Spike Land MCP connection failed (staged, non-fatal):", e?.message ?? e);
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ status: "ok", service: "agent-runtime" });
    }

    if (request.method === "POST" && url.pathname === "/tool/send_notification") {
      try {
        return await sendNotification(env, await request.json<SendNotificationArgs>());
      } catch (e: any) {
        return Response.json({ ok: false, error: String(e?.message || e) }, { status: 400 });
      }
    }

    if (request.method === "POST" && url.pathname === "/tool/generate_care_report") {
      try {
        return await generateCareReport(env, await request.json<CareReportArgs>());
      } catch (e: any) {
        return Response.json({ ok: false, error: String(e?.message || e) }, { status: 400 });
      }
    }

    const res = await routeAgentRequest(request, env);
    return res ?? new Response("Not found", { status: 404 });
  },
  async scheduled(): Promise<void> {
    // Reserved: future cron-driven care-mesh aggregation lives here.
  },
};
