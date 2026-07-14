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
  :root{
    --bg:#0b1220; --panel:rgba(255,255,255,0.04); --border:rgba(255,255,255,0.10);
    --text:#e6f1ff; --muted:#9fb3c8; --accent:#22d3ee; --warn:#f59e0b; --ok:#34d399;
    --radius:18px;
  }
  *{box-sizing:border-box}
  html,body{margin:0;background:var(--bg);color:var(--text);
    font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
  a{color:var(--accent)}
  .skip{position:absolute;left:-999px;top:0;background:var(--accent);color:#001;padding:.5rem 1rem;border-radius:8px}
  .skip:focus{left:8px;top:8px;z-index:10}
  header{padding:1.5rem clamp(1rem,4vw,3rem);border-bottom:1px solid var(--border)}
  h1{margin:0;font-size:1.4rem;letter-spacing:.3px}
  h1 .accent{color:var(--accent)}
  .sub{color:var(--muted);font-size:.9rem;margin-top:.25rem}
  main{padding:1.5rem clamp(1rem,4vw,3rem);max-width:1100px;margin:0 auto}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem;margin-bottom:2rem}
  .card{padding:1rem 1.1rem;border-radius:var(--radius);border:1px solid var(--border)}
  .glass{background:var(--panel);backdrop-filter:blur(12px)}
  .card-val{font-size:1.8rem;font-weight:700;color:var(--accent)}
  .card-label{color:var(--muted);font-size:.85rem;margin-top:.15rem}
  table{width:100%;border-collapse:collapse;margin-top:.5rem}
  caption{text-align:left;color:var(--muted);font-size:.85rem;margin-bottom:.5rem}
  th,td{padding:.6rem .5rem;text-align:left;border-bottom:1px solid var(--border);vertical-align:middle}
  thead th{color:var(--muted);font-size:.78rem;text-transform:uppercase;letter-spacing:.04em}
  .mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.82rem}
  .badge{display:inline-block;width:8px;height:8px;border-radius:50%;margin-left:.4rem;vertical-align:middle}
  .badge.ok{background:var(--ok)} .badge.warn{background:var(--warn)}
  .ok-tag{color:var(--ok);font-size:.85rem}
  .anom{color:var(--warn);font-size:.82rem}
  .bar{display:inline-block;width:80px;height:8px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden;vertical-align:middle}
  .bar-fill{height:100%;background:linear-gradient(90deg,var(--accent),var(--ok))}
  .sr-num{margin-left:.5rem;color:var(--muted);font-size:.8rem}
  .invite-btn{
    background:var(--accent);color:#001;border:none;border-radius:8px;
    padding:.4rem .8rem;font-size:.82rem;cursor:pointer;font-weight:600;
    min-height:44px;min-width:44px;
  }
  .invite-btn:disabled{opacity:.5;cursor:not-allowed}
  .invite-btn:hover:not(:disabled){filter:brightness(1.1)}
  footer{color:var(--muted);font-size:.8rem;padding:1rem clamp(1rem,4vw,3rem) 2rem}
  :focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  @media (prefers-reduced-motion: reduce){*{transition:none!important;animation:none!important}}
  @media (prefers-reduced-transparency: reduce){.glass{background:rgba(255,255,255,.06);backdrop-filter:none}}
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
  // Skip auth for internal invite routes (dashboard page only)
  if (c.req.path === "/api/invite" || c.req.path === "/api/invite/track") {
    return next();
  }
  return requireAuth(c, next);
});

app.get("/", async (c) => {
  const pilots = await loadPilots(c.env);
  const stats = await loadStats(c.env, pilots);
  return c.html(renderDashboard(pilots, stats));
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
});

app.post("/api/invite", async (c) => {
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
});

app.post("/api/invite/track", async (c) => {
  const { did, event } = await c.req.json<{ did?: string; event?: string }>();
  if (!did || !event) return c.json({ error: "did and event required" }, 400);

  await ensureOnboardingTable(c.env.LOVE_DB);
  await c.env.LOVE_DB.prepare(
    "INSERT INTO onboarding_events (did, event, timestamp) VALUES (?, ?, ?)"
  ).bind(did, event, Date.now()).run();

  return c.json({ ok: true });
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
