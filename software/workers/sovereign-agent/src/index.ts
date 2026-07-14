/**
 * sovereign-agent — CWP-2026-028 Phase 1
 *
 * Single self-contained edge node for NGI pilot deployments. It:
 *   - proxies identity APIs to the `love-ledger` service binding,
 *   - proxies care + credential APIs to `ledger-bridge` (URL-based),
 *   - reads the shared LOVE_DB for dashboard KPI aggregation,
 *   - serves PHOS static assets from R2 (Phase 2 — bucket `phos-assets`).
 *
 * No new cryptography, no new standards claims: it glues existing, verified
 * services behind one route.
 */

import { Hono } from "hono";

interface Env {
  LOVE_DB: D1Database;
  ASSETS: R2Bucket;
  LOVE_LEDGER: Fetcher;
}

const BRIDGE = "https://ledger-bridge.trimtab-signal.workers.dev";
const VERSION = "cwp-2026-028.1";

const MIME: Record<string, string> = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  json: "application/json; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  ico: "image/x-icon",
  woff: "font/woff",
  woff2: "font/woff2",
  txt: "text/plain; charset=utf-8",
  map: "application/json; charset=utf-8",
};

function contentType(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() || "";
  return MIME[ext] || "application/octet-stream";
}

function proxyHeaders(resp: Response, requestId: string): Headers {
  const h = new Headers(resp.headers);
  h.delete("transfer-encoding");
  h.set("x-request-id", requestId);
  return h;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/health", async (c) => {
  const start = Date.now();
  const report: Record<string, unknown> = {
    ok: true,
    service: "sovereign-agent",
    version: VERSION,
    timestamp: new Date().toISOString(),
  };

  // D1 connectivity check
  try {
    await c.env.LOVE_DB.prepare("SELECT 1").first();
    report.d1 = { status: "ok", latency_ms: Date.now() - start };
  } catch (e: any) {
    report.d1 = { status: "error", error: e.message };
    report.ok = false;
  }

  // R2 bucket check
  try {
    const r2Start = Date.now();
    await c.env.ASSETS.list({ limit: 1 });
    report.r2 = { status: "ok", latency_ms: Date.now() - r2Start, bucket: "phos-assets" };
  } catch (e: any) {
    report.r2 = { status: "error", error: e.message };
    // R2 failure is non-critical (PHOS still works without static assets)
  }

  report.total_latency_ms = Date.now() - start;
  return c.json(report, report.ok ? 200 : 503);
});

// ── Identity APIs → love-ledger (service binding) ────────────────────────
app.all("/identity/*", async (c) => {
  const requestId = c.req.header("x-request-id") || crypto.randomUUID();
  try {
    const req = new Request(c.req.raw, { headers: { ...Object.fromEntries(c.req.raw.headers), "x-request-id": requestId } });
    const resp = await c.env.LOVE_LEDGER.fetch(req);
    return new Response(resp.body, { status: resp.status, headers: proxyHeaders(resp, requestId) });
  } catch (e: any) {
    return c.json({ error: "love-ledger service unavailable", detail: e.message, requestId }, 502);
  }
});

// ── Care + credential APIs → ledger-bridge (URL-based) ────────────────────
app.all("/care-proof", async (c) => {
  const requestId = c.req.header("x-request-id") || crypto.randomUUID();
  try {
    const req = new Request(c.req.raw, { headers: { ...Object.fromEntries(c.req.raw.headers), "x-request-id": requestId } });
    const resp = await fetch(`${BRIDGE}/care-proof`, req);
    return new Response(resp.body, { status: resp.status, headers: proxyHeaders(resp, requestId) });
  } catch (e: any) {
    return c.json({ error: "ledger-bridge unavailable", detail: e.message, requestId }, 502);
  }
});

app.all("/credential/*", async (c) => {
  const requestId = c.req.header("x-request-id") || crypto.randomUUID();
  try {
    const req = new Request(c.req.raw, { headers: { ...Object.fromEntries(c.req.raw.headers), "x-request-id": requestId } });
    const resp = await fetch(`${BRIDGE}${c.req.path}`, req);
    return new Response(resp.body, { status: resp.status, headers: proxyHeaders(resp, requestId) });
  } catch (e: any) {
    return c.json({ error: "ledger-bridge unavailable", detail: e.message, requestId }, 502);
  }
});

// ── Dashboard KPI reads → shared LOVE_DB ──────────────────────────────────
app.get("/api/pilots", async (c) => {
  try {
    const rows = await c.env.LOVE_DB.prepare(`
      SELECT p.did, p.family_name, p.status, p.onboarded_at, p.active_nodes,
             p.mesh_health, p.eth_address,
             (SELECT COUNT(*) FROM care_proofs cp WHERE cp.did = p.did) AS mints
      FROM pilot_registry p
      ORDER BY p.onboarded_at DESC
    `).all();
    return c.json((rows as any).results || []);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.get("/api/stats", async (c) => {
  try {
    const s = (await c.env.LOVE_DB.prepare(`
      SELECT COUNT(*) AS total,
             SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active,
             SUM(CASE WHEN eth_address IS NOT NULL THEN 1 ELSE 0 END) AS with_eth,
             AVG(mesh_health) AS avg_health,
             SUM(active_nodes) AS nodes
      FROM pilot_registry
    `).first()) || {};
    const mints = await c.env.LOVE_DB.prepare("SELECT COUNT(*) AS n FROM care_proofs").first();
    let creds = { n: 0 } as any;
    try {
      creds = await c.env.LOVE_DB.prepare("SELECT COUNT(*) AS n FROM credential_issuance").first();
    } catch { /* table may not exist yet */ }
    return c.json({
      total: Number(s.total) || 0,
      active: Number(s.active) || 0,
      with_eth: Number(s.with_eth) || 0,
      avg_health: Number(s.avg_health) || 0,
      nodes: Number(s.nodes) || 0,
      mints: Number((mints as any)?.n) || 0,
      credentials: Number((creds as any)?.n) || 0,
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── PHOS static assets from R2 (Phase 2 — bucket `phos-assets`) ───────────
app.get("/*", async (c) => {
  const path = c.req.path;
  const key = path === "/" ? "index.html" : path.replace(/^\/+/, "");
  try {
    let obj = await c.env.ASSETS.get(key);
    if (!obj && !key.includes(".")) obj = await c.env.ASSETS.get("index.html");
    if (!obj) return c.notFound();
    const headers = new Headers();
    headers.set("Content-Type", contentType(key));
    headers.set("Cache-Control", key.includes(".html") ? "public, max-age=600, must-revalidate" : "public, max-age=86400, immutable");
    return new Response(obj.body, { headers });
  } catch {
    // Bucket not provisioned yet (Phase 2) — surface a clear status, not a crash.
    return c.json(
      { ok: false, note: "PHOS static assets not provisioned — run CWP-2026-028 Phase 2 (create + populate R2 bucket `phos-assets`)." },
      503,
    );
  }
});

export default app;
