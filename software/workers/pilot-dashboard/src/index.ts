/**
 * pilot-dashboard — CWP-2026-027 C
 *
 * Pilot operations dashboard for P31. Binds the SHARED LOVE_DB (no new D1 on
 * the Free-Plan cap). Serves a server-rendered, accessible dashboard at "/"
 * and HMAC-gated JSON APIs at "/api/pilots" + "/api/stats".
 *
 * Auth: LOVE_AUTH_SECRET (HMAC-SHA256, 60s TTL). Header:
 *   x-p31-auth: <unix-ms>:<hex-hmac>
 * The HTML page is server-rendered (data injected), so it needs no client auth.
 */

import { Hono } from "hono";

interface Env {
  LOVE_DB: D1Database;
  LOVE_AUTH_SECRET: string;
}

interface Pilot {
  did: string;
  family_name: string;
  status: string;
  onboarded_at: number | null;
  active_nodes: number;
  mesh_health: number;
  eth_address: string | null;
  mints: number;
  credentials: number;
  anomaly: boolean;
  anomaly_reason: string;
}

interface Stats {
  total: number;
  active: number;
  with_eth: number;
  avg_health: number;
  nodes: number;
  mints: number;
  credentials: number;
  anomalies: number;
  invited: number;
}

const enc = new TextEncoder();
let _key: CryptoKey | null = null;

async function getKey(secret: string): Promise<CryptoKey> {
  if (_key) return _key;
  _key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return _key;
}

async function sign(ts: string, secret: string): Promise<string> {
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(ts));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// HMAC gate for /api/* — 60s TTL, same scheme as mcp-x402 LOVE path.
async function requireAuth(c: any, next: any) {
  c.header('x-request-id', c.req.header('x-request-id') || crypto.randomUUID());
  const secret = c.env.LOVE_AUTH_SECRET as string | undefined;
  if (!secret) return c.json({ error: "LOVE_AUTH_SECRET not configured" }, 500);
  const header = c.req.header("x-p31-auth") || "";
  const [tsStr, mac] = header.split(":");
  if (!tsStr || !mac) return c.json({ error: "missing x-p31-auth" }, 401);
  const ts = Number(tsStr);
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > 60_000) {
    return c.json({ error: "stale or invalid timestamp" }, 401);
  }
  const expected = await sign(tsStr, secret);
  if (mac !== expected) return c.json({ error: "bad signature" }, 401);
  return next();
}

async function safeFirst(env: Env, sql: string): Promise<any> {
  const start = Date.now();
  try {
    const result = await env.LOVE_DB.prepare(sql).first();
    const duration = Date.now() - start;
    if (duration > 500) {
      console.warn(`[SLOW_QUERY] ${duration}ms: ${sql.slice(0, 100)}`);
    }
    return result;
  } catch {
    return null;
  }
}

function shortDid(did: string): string {
  if (did.length <= 24) return did;
  return `${did.slice(0, 16)}…${did.slice(-6)}`;
}

async function loadPilots(env: Env): Promise<Pilot[]> {
  const rows = (await env.LOVE_DB.prepare(`
    SELECT p.did, p.family_name, p.status, p.onboarded_at, p.active_nodes,
           p.mesh_health, p.eth_address,
           (SELECT COUNT(*) FROM care_proofs cp WHERE cp.did = p.did) AS mints
    FROM pilot_registry p
    ORDER BY p.onboarded_at DESC
  `).all()) as unknown as { results: any[] };

  // credential_issuance is created lazily by ledger-bridge; guard if absent.
  const credMap = new Map<string, number>();
  try {
    const creds = (await env.LOVE_DB.prepare(
      "SELECT did, COUNT(*) AS n FROM credential_issuance GROUP BY did",
    ).all()) as unknown as { results: any[] };
    for (const r of creds.results) credMap.set(r.did, r.n);
  } catch {
    /* table not yet created — 0 credentials */
  }

  return rows.results.map((r) => {
    const mints = Number(r.mints) || 0;
    const credentials = credMap.get(r.did) || 0;
    const health = Number(r.mesh_health) || 0;
    const reasons: string[] = [];
    if (r.status !== "active") reasons.push(`status: ${r.status}`);
    if (mints === 0) reasons.push("no mints");
    if (health < 0.5) reasons.push(`mesh ${health.toFixed(2)}`);
    return {
      did: r.did,
      family_name: r.family_name,
      status: r.status,
      onboarded_at: r.onboarded_at,
      active_nodes: Number(r.active_nodes) || 0,
      mesh_health: health,
      eth_address: r.eth_address,
      mints,
      credentials,
      anomaly: reasons.length > 0,
      anomaly_reason: reasons.join(" · "),
    };
  });
}

async function loadStats(env: Env, pilots: Pilot[]): Promise<Stats> {
  const s = (await safeFirst(
    env,
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN eth_address IS NOT NULL THEN 1 ELSE 0 END) AS with_eth,
            AVG(mesh_health) AS avg_health,
            SUM(active_nodes) AS nodes
     FROM pilot_registry`,
  )) || {};
  const mintsRow = await safeFirst(env, "SELECT COUNT(*) AS n FROM care_proofs");
  const credRow = await safeFirst(env, "SELECT COUNT(*) AS n FROM credential_issuance");
  let invited = 0;
  try {
    const invRow = await safeFirst(env, "SELECT COUNT(*) AS n FROM onboarding_events WHERE event = 'invited'");
    invited = Number(invRow?.n) || 0;
  } catch { /* table may not exist */ }
  return {
    total: Number(s.total) || 0,
    active: Number(s.active) || 0,
    with_eth: Number(s.with_eth) || 0,
    avg_health: Number(s.avg_health) || 0,
    nodes: Number(s.nodes) || 0,
    mints: Number(mintsRow?.n) || 0,
    credentials: Number(credRow?.n) || 0,
    anomalies: pilots.filter((p) => p.anomaly).length,
    invited,
  };
}

function logError(requestId: string, service: string, error: string, path: string) {
  console.error(JSON.stringify({ level: 'error', requestId, service, error, path, timestamp: new Date().toISOString() }));
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

async function ensureOnboardingTable(db: D1Database): Promise<void> {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS onboarding_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        did TEXT NOT NULL,
        event TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        metadata TEXT
      )
    `).run();
  } catch {
    // Table creation best-effort
  }
}

function renderDashboard(pilots: Pilot[], stats: Stats): string {
  const cards = [
    ["Pilots", stats.total],
    ["Active", stats.active],
    ["Invited", stats.invited],
    ["With ETH binding", stats.with_eth],
    ["Care mints", stats.mints],
    ["SD-JWTs", stats.credentials],
    ["Anomalies", stats.anomalies],
  ]
    .map(
      ([label, val]) =>
        `<div class="card glass"><div class="card-val">${val}</div><div class="card-label">${label}</div></div>`,
    )
    .join("");

  const rows = pilots
    .map((p) => {
      const healthPct = Math.max(0, Math.min(100, Math.round(p.mesh_health * 100)));
      const badge = p.status === "active" ? "ok" : "warn";
      const anom = p.anomaly
        ? `<span class="anom" role="img" aria-label="anomaly">⚠ ${esc(p.anomaly_reason)}</span>`
        : `<span class="ok-tag">ok</span>`;
      return `<tr>
        <th scope="row" class="mono">${esc(shortDid(p.did))}</th>
        <td>${esc(p.status)}<span class="badge ${badge}"></span></td>
        <td>${p.active_nodes}</td>
        <td><div class="bar" aria-hidden="true"><div class="bar-fill" style="width:${healthPct}%"></div></div><span class="sr-num">${healthPct}%</span></td>
        <td>${p.mints}</td>
        <td>${p.credentials}</td>
        <td>${anom}</td>
        <td>
          <button class="invite-btn" onclick="sendInvite('${esc(p.did)}')" 
                  aria-label="Send invitation to ${esc(p.family_name)}"
                  ${p.status === 'invited' || p.status === 'onboarded' ? 'disabled' : ''}>
            ${p.status === 'invited' ? 'Sent' : p.status === 'onboarded' ? 'Done' : 'Invite'}
          </button>
        </td>
      </tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="dark" />
<title>P31 Pilot Dashboard</title>
<style>
  :root {
    --p31-void: #0A0A0F;
    --p31-surface: #12121A;
    --p31-surface2: #1C1C2A;
    --p31-cloud: #A1A1AA;
    --p31-text-primary: #F5F5F7;
    --p31-text-secondary: rgba(245,245,247,0.6);
    --p31-text-tertiary: rgba(245,245,247,0.3);
    --p31-accent: #00F0FF;
    --p31-accent-violet: #A78BFA;
    --p31-accent-gold: #FBBF24;
    --p31-accent-green: #34D399;
    --p31-accent-red: #FB7185;
    --p31-accent-iris: #818CF8;
    --p31-glass-surface: rgba(255,255,255,0.04);
    --p31-glass-border: rgba(255,255,255,0.08);
    --p31-glass-border-hover: rgba(255,255,255,0.15);
    --p31-glass-surface-hover: rgba(255,255,255,0.06);
    --p31-glass-blur: 12px;
    --p31-glass-radius: 24px;
    --p31-glass-shadow: 0 8px 32px rgba(0,0,0,0.15);
    --p31-font-sans: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
    --p31-font-mono: JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    --p31-spacing-xs: 4px;
    --p31-spacing-sm: 8px;
    --p31-spacing-md: 16px;
    --p31-spacing-lg: 24px;
    --p31-spacing-xl: 32px;
    --p31-spacing-xxl: 64px;
    --p31-radius-none: 0;
    --p31-radius-sm: 8px;
    --p31-radius-md: 12px;
    --p31-radius-lg: 24px;
    --p31-radius-full: 9999px;
    --p31-h1: 51px;
    --p31-h2: 38px;
    --p31-h3: 28px;
    --p31-h4: 21px;
    --p31-body: 16px;
    --p31-body-sm: 14px;
    --p31-label: 12px;
    --p31-caption: 7px;
    --p31-duration-instant: 62.5ms;
    --p31-duration-fast: 125ms;
    --p31-duration-standard: 250ms;
    --p31-duration-slow: 500ms;
    --p31-duration-slower: 1000ms;
    --p31-easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
    --p31-easing-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
    --p31-easing-accelerate: cubic-bezier(0.4, 0.0, 1.0, 1);
  }
  *, *::before, *::after { box-sizing: border-box; }
  html {
    font-family: var(--p31-font-sans);
    font-size: var(--p31-body);
    line-height: 1.6;
    color: var(--p31-text-primary);
    background: var(--p31-void);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  body {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    background: var(--p31-void);
    color: var(--p31-text-primary);
  }
  h1 { font-size: var(--p31-h1); font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; }
  h2 { font-size: var(--p31-h2); font-weight: 600; line-height: 1.2; }
  h3 { font-size: var(--p31-h3); font-weight: 600; line-height: 1.3; }
  h4 { font-size: var(--p31-h4); font-weight: 600; line-height: 1.3; }
  a { color: var(--p31-accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  code, pre {
    font-family: var(--p31-font-mono);
    font-size: 13px;
  }
  .glass-panel {
    background: var(--p31-glass-surface);
    backdrop-filter: blur(var(--p31-glass-blur));
    -webkit-backdrop-filter: blur(var(--p31-glass-blur));
    border: 1px solid var(--p31-glass-border);
    border-radius: var(--p31-glass-radius);
    box-shadow: var(--p31-glass-shadow);
    transition: all var(--p31-duration-standard) var(--p31-easing-standard);
  }
  .glass-panel:hover {
    border-color: var(--p31-glass-border-hover);
    background: var(--p31-glass-surface-hover);
    transform: translateY(-2px);
    box-shadow: 0 12px 48px rgba(0,0,0,0.25);
  }
  .glass-card {
    background: var(--p31-glass-surface);
    backdrop-filter: blur(var(--p31-glass-blur));
    -webkit-backdrop-filter: blur(var(--p31-glass-blur));
    border: 1px solid var(--p31-glass-border);
    border-radius: var(--p31-glass-radius);
    padding: var(--p31-spacing-lg);
    box-shadow: var(--p31-glass-shadow);
    transition: all var(--p31-duration-standard) var(--p31-easing-standard);
  }
  .glass-navbar {
    background: var(--p31-glass-surface);
    backdrop-filter: blur(var(--p31-glass-blur));
    -webkit-backdrop-filter: blur(var(--p31-glass-blur));
    border: 1px solid var(--p31-glass-border);
    border-radius: var(--p31-glass-radius);
    position: fixed;
    top: var(--p31-spacing-md);
    left: 50%;
    transform: translateX(-50%);
    z-index: 50;
    padding: var(--p31-spacing-sm) var(--p31-spacing-md);
    width: 95%;
    max-width: 64rem;
  }
  .btn-primary {
    background: var(--p31-accent);
    color: var(--p31-void);
    font-weight: 700;
    padding: var(--p31-spacing-sm) var(--p31-spacing-lg);
    border-radius: var(--p31-radius-md);
    border: none;
    cursor: pointer;
    transition: all var(--p31-duration-fast) ease;
    box-shadow: 0 4px 16px rgba(0,240,255,0.2);
  }
  .btn-primary:hover {
    opacity: 0.8;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,240,255,0.3);
  }
  .btn-secondary {
    background: rgba(167,139,250,0.1);
    color: var(--p31-accent-violet);
    font-weight: 700;
    padding: var(--p31-spacing-sm) var(--p31-spacing-lg);
    border-radius: var(--p31-radius-md);
    border: 1px solid rgba(167,139,250,0.3);
    cursor: pointer;
    transition: all var(--p31-duration-fast) ease;
  }
  .btn-secondary:hover {
    background: rgba(167,139,250,0.2);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(167,139,250,0.15);
  }
  .btn-ghost {
    background: rgba(255,255,255,0.05);
    color: var(--p31-text-secondary);
    font-weight: 700;
    padding: var(--p31-spacing-sm) var(--p31-spacing-lg);
    border-radius: var(--p31-radius-md);
    border: 1px solid rgba(255,255,255,0.1);
    cursor: pointer;
    transition: all var(--p31-duration-fast) ease;
  }
  .btn-ghost:hover {
    background: rgba(255,255,255,0.1);
    color: var(--p31-text-primary);
  }
  .code-block {
    background: var(--p31-void);
    font-family: var(--p31-font-mono);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: var(--p31-radius-md);
    padding: var(--p31-spacing-md);
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }
  }
  [data-spoons="0"] *, [data-spoons="0"] *::before, [data-spoons="0"] *::after,
  [data-spoons="1"] *, [data-spoons="1"] *::before, [data-spoons="1"] *::after {
    animation-duration: 0s !important;
    transition-duration: 0s !important;
  }
  [data-spoons="2"] *, [data-spoons="2"] *::before, [data-spoons="2"] *::after {
    animation-duration: var(--p31-duration-slower) !important;
    transition-duration: var(--p31-duration-slow) !important;
  }
  [data-spoons="4"] *, [data-spoons="4"] *::before, [data-spoons="4"] *::after {
    animation-duration: var(--p31-duration-fast) !important;
    transition-duration: var(--p31-duration-instant) !important;
  }
  [data-spoons="5"] *, [data-spoons="5"] *::before, [data-spoons="5"] *::after {
    animation-duration: var(--p31-duration-instant) !important;
    transition-duration: var(--p31-duration-instant) !important;
  }
  .glass-panel { transition: all var(--p31-duration-standard) var(--p31-easing-standard); }
  .glass-card { transition: all var(--p31-duration-standard) var(--p31-easing-standard); }
  .btn-primary, .btn-secondary, .btn-ghost { transition: all var(--p31-duration-fast) ease; }
  .text-h1 { font-size: var(--p31-h1); font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; }
  .text-h2 { font-size: var(--p31-h2); font-weight: 600; line-height: 1.2; }
  .text-h3 { font-size: var(--p31-h3); font-weight: 600; line-height: 1.3; }
  .text-h4 { font-size: var(--p31-h4); font-weight: 600; line-height: 1.3; }
  .text-body { font-size: var(--p31-body); font-weight: 400; line-height: 1.6; }
  .text-body-sm { font-size: 14px; font-weight: 400; line-height: 1.5; }
  .text-label { font-size: var(--p31-label); font-weight: 500; line-height: 1; letter-spacing: 0.05em; text-transform: uppercase; }
  .text-caption { font-size: var(--p31-caption); font-weight: 400; line-height: 1.4; }
  .text-code { font-family: var(--p31-font-mono); font-size: 13px; line-height: 1.6; }
  .text-muted { color: var(--p31-text-secondary); }
  .text-dim { color: var(--p31-text-tertiary); }
  .text-accent { color: var(--p31-accent); }
  .text-violet { color: var(--p31-accent-violet); }
  .text-gold { color: var(--p31-accent-gold); }
  .text-green { color: var(--p31-accent-green); }
  .text-red { color: var(--p31-accent-red); }
</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header>
  <h1>P31 <span class="accent">Pilot</span> Dashboard</h1>
  <div class="sub">Care-proof + SD-JWT issuance operations · CWP-2026-027</div>
</header>
<main id="main">
  <section class="cards" aria-label="Summary statistics">${cards}</section>
  <table>
    <caption>Pilots (most recently onboarded first). Anomalies flag non-active status, zero mints, or low mesh health.</caption>
    <thead><tr>
      <th scope="col">DID</th><th scope="col">Status</th><th scope="col">Nodes</th>
      <th scope="col">Mesh health</th><th scope="col">Mints</th><th scope="col">SD-JWTs</th><th scope="col">Health</th>
      <th scope="col">Actions</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
</main>
<footer>Generated ${new Date().toISOString()} · data: shared LOVE_DB (love-ledger)</footer>
<script>
async function sendInvite(did) {
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Sending...';
  try {
    const resp = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ did })
    });
    const data = await resp.json();
    if (data.ok) {
      btn.textContent = 'Sent';
      await fetch('/api/invite/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did, event: 'invited' })
      });
    } else {
      btn.textContent = 'Error';
      btn.disabled = false;
    }
  } catch {
    btn.textContent = 'Error';
    btn.disabled = false;
  }
}
</script>
</body>
</html>`;
}

const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", async (c, next) => {
  if (c.req.path === "/api/invite" || c.req.path === "/api/invite/track" || c.req.path === "/api/onboard/status") {
    return next();
  }
  return requireAuth(c, next);
});

app.get("/", async (c) => {
  const requestId = c.req.header("x-request-id") || crypto.randomUUID();
  try {
    const pilots = await loadPilots(c.env);
    const stats = await loadStats(c.env, pilots);
    return c.html(renderDashboard(pilots, stats));
  } catch (e: any) {
    logError(requestId, 'pilot-dashboard', e.message, '/');
    return c.json({ error: e.message, requestId }, 500);
  }
});

app.get("/api/pilots", async (c) => {
  const pilots = await loadPilots(c.env);
  return c.json(pilots);
});

app.get("/api/stats", async (c) => {
  const pilots = await loadPilots(c.env);
  const stats = await loadStats(c.env, pilots);
  return c.json(stats);
});

// ── CWP-2026-030 Phase 6: Onboarding API ───────────────────────────────

app.get("/api/onboard/status", async (c) => {
  const pilots = await loadPilots(c.env);
  const total = pilots.length;
  const onboarded = pilots.filter((p) => p.status === "onboarded").length;
  const invited = pilots.filter((p) => p.status === "invited").length;
  const pending = total - onboarded - invited;
  return c.json({ total, onboarded, invited, pending });
});

app.post("/api/onboard", async (c) => {
  const requestId = c.req.header("x-request-id") || crypto.randomUUID();
  try {
    const { did } = await c.req.json<{ did?: string }>();
    if (!did) return c.json({ error: "did is required" }, 400);

    // Generate onboarding link
    const onboardUrl = `https://phos.p31ca.org?did=${encodeURIComponent(did)}`;

    // Update status to 'invited'
    await c.env.LOVE_DB.prepare(
      "UPDATE pilot_registry SET status = 'invited' WHERE did = ?"
    ).bind(did).run();

    return c.json({
      ok: true,
      did,
      onboardUrl,
      dashboardUrl: "https://pilot.p31ca.org",
      note: "Share the onboarding link with the pilot family.",
    });
  } catch (e: any) {
    logError(requestId, 'pilot-dashboard', e.message, '/api/onboard');
    return c.json({ error: e.message, requestId }, 500);
  }
});

app.post("/api/invite", async (c) => {
  const requestId = c.req.header("x-request-id") || crypto.randomUUID();
  try {
    const { did } = await c.req.json<{ did?: string }>();
    if (!did) return c.json({ error: "did is required" }, 400);

    // Validate DID exists in pilot_registry
    const pilot = await c.env.LOVE_DB.prepare(
      "SELECT did FROM pilot_registry WHERE did = ?"
    ).bind(did).first();
    if (!pilot) return c.json({ error: "unknown pilot DID" }, 404);

    // Update status to 'invited' (skip if already onboarded)
    await c.env.LOVE_DB.prepare(
      "UPDATE pilot_registry SET status = 'invited' WHERE did = ? AND status != 'onboarded'"
    ).bind(did).run();

    // Log event
    await ensureOnboardingTable(c.env.LOVE_DB);
    await c.env.LOVE_DB.prepare(
      "INSERT INTO onboarding_events (did, event, timestamp) VALUES (?, ?, ?)"
    ).bind(did, "invited", Date.now()).run();

    const onboardUrl = `https://phos.p31ca.org?did=${encodeURIComponent(did)}`;
    return c.json({ ok: true, did, onboardUrl });
  } catch (e: any) {
    logError(requestId, 'pilot-dashboard', e.message, '/api/invite');
    return c.json({ error: e.message, requestId }, 500);
  }
});

app.post("/api/invite/track", async (c) => {
  const requestId = c.req.header("x-request-id") || crypto.randomUUID();
  try {
    const { did, event } = await c.req.json<{ did?: string; event?: string }>();
    if (!did || !event) return c.json({ error: "did and event required" }, 400);

    await ensureOnboardingTable(c.env.LOVE_DB);
    await c.env.LOVE_DB.prepare(
      "INSERT INTO onboarding_events (did, event, timestamp) VALUES (?, ?, ?)"
    ).bind(did, event, Date.now()).run();

    return c.json({ ok: true });
  } catch (e: any) {
    logError(requestId, 'pilot-dashboard', e.message, '/api/invite/track');
    return c.json({ error: e.message, requestId }, 500);
  }
});

app.get("/health", async (c) => {
  const start = Date.now();
  const report: Record<string, unknown> = {
    ok: true,
    service: "pilot-dashboard",
    timestamp: new Date().toISOString(),
  };
  try {
    await c.env.LOVE_DB.prepare("SELECT 1").first();
    report.d1 = { status: "ok", latency_ms: Date.now() - start };
  } catch (e: any) {
    report.d1 = { status: "error", error: e.message };
    report.ok = false;
  }
  report.total_latency_ms = Date.now() - start;
  return c.json(report, report.ok ? 200 : 503);
});

export default app;
