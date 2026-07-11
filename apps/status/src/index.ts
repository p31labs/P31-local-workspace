export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS: string;
}

const SERVICES = [
  { name: 'phos', url: 'https://phos.p31ca.org/health', expected: 'ok' },
  { name: 'gateway', url: 'https://gateway.p31ca.org/health', expected: 'ok' },
  { name: 'p31ca', url: 'https://p31ca.org', expected: '<!doctype' },
  { name: 'willow', url: 'https://willow.p31ca.org', expected: '<!doctype' },
  { name: 'bonding', url: 'https://bonding.p31ca.org', expected: '<!doctype' },
  { name: 'love-ledger', url: 'https://love-ledger.p31ca.org/health', expected: 'ok' },
  { name: 'status', url: 'https://status.p31ca.org/health', expected: 'ok' },
];

interface CheckResult {
  name: string;
  url: string;
  status: 'up' | 'down' | 'degraded';
  latency_ms: number;
  checked_at: string;
  error?: string;
}

async function checkService(svc: typeof SERVICES[0]): Promise<CheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(svc.url, {
      method: 'GET',
      headers: { 'User-Agent': 'p31-status/1.0' },
      signal: AbortSignal.timeout(10_000),
    });
    const latency = Date.now() - start;
    const body = await res.text();
    const ok = res.ok && body.toLowerCase().includes(svc.expected);
    return {
      name: svc.name,
      url: svc.url,
      status: ok ? (latency > 3000 ? 'degraded' : 'up') : 'down',
      latency_ms: latency,
      checked_at: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: svc.name,
      url: svc.url,
      status: 'down',
      latency_ms: Date.now() - start,
      checked_at: new Date().toISOString(),
      error: String(err),
    };
  }
}

async function runChecks(db: D1Database): Promise<CheckResult[]> {
  const results = await Promise.all(SERVICES.map(checkService));

  // Write results to D1
  for (const r of results) {
    await db.prepare(
      'INSERT INTO health_checks (service, status, latency_ms, checked_at, error) VALUES (?, ?, ?, ?, ?)'
    ).bind(r.name, r.status, r.latency_ms, r.checked_at, r.error || null).run();
  }

  // Prune old entries (keep 7 days)
  await db.prepare("DELETE FROM health_checks WHERE checked_at < datetime('now', '-7 days')").run();

  return results;
}

function dashboardHTML(results: CheckResult[]): string {
  const upCount = results.filter(r => r.status === 'up').length;
  const totalCount = results.length;
  const rows = results.map(r => `
    <tr>
      <td style="padding:8px 16px;font-weight:600">${r.name}</td>
      <td style="padding:8px 16px;color:${r.status === 'up' ? '#00e5ff' : r.status === 'degraded' ? '#fbbf24' : '#fca5a5'}">${r.status.toUpperCase()}</td>
      <td style="padding:8px 16px;text-align:right">${r.latency_ms}ms</td>
      <td style="padding:8px 16px;font-size:12px;color:#999">${r.error || '—'}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>P31 Status</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',system-ui,sans-serif; background:#0a0a0f; color:#e0e0e0; min-height:100vh; display:flex; align-items:center; justify-content:center; }
    .container { max-width:720px; width:100%; padding:32px; }
    h1 { font-size:24px; margin-bottom:4px; }
    .summary { color:${upCount === totalCount ? '#00e5ff' : '#fbbf24'}; font-size:14px; margin-bottom:24px; }
    table { width:100%; border-collapse:collapse; background:rgba(255,255,255,0.03); border-radius:12px; overflow:hidden; }
    th { padding:12px 16px; text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#94a3b8; border-bottom:1px solid rgba(255,255,255,0.06); }
    tr:hover { background:rgba(255,255,255,0.02); }
    td { border-bottom:1px solid rgba(255,255,255,0.04); }
    footer { margin-top:24px; font-size:12px; color:#94a3b8; text-align:center; }
  </style>
</head>
<body>
  <div class="container">
    <h1>P31 Status</h1>
    <p class="summary">${upCount}/${totalCount} services operational</p>
    <table>
      <thead><tr><th>Service</th><th>Status</th><th>Latency</th><th>Error</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <footer>Last checked: ${results[0]?.checked_at || new Date().toISOString()}</footer>
  </div>
</body>
</html>`;
}

const app = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      const results = await runChecks(env.DB);
      const upCount = results.filter(r => r.status === 'up').length;
      return new Response(JSON.stringify({ status: upCount === results.length ? 'ok' : 'degraded', services: results }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (url.pathname === '/api/checks') {
      const { results } = await env.DB.prepare('SELECT * FROM health_checks ORDER BY checked_at DESC LIMIT 100').all();
      return new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Dashboard HTML
    const results = await runChecks(env.DB);
    return new Response(dashboardHTML(results), {
      headers: { 'Content-Type': 'text/html;charset=utf-8' },
    });
  },

  async scheduled(event: ScheduledEvent, env: Env) {
    await runChecks(env.DB);
  },
};

export default app;
