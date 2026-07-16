import { Hono } from 'hono';

type Env = {
  DB: D1Database;
  K4_CAGE: Fetcher;
};

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html>
<head><title>LOVE Arcade</title>
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
<h1>LOVE Arcade</h1>
<p>Live pilot dashboard — the LOVE ecosystem in real time.</p>
<div class="stats" id="stats"></div>
<div id="app">Loading...</div>
<script>
async function load() {
  try {
    const [pilotsRes, healthRes] = await Promise.all([
      fetch('/api/pilots'),
      fetch('/api/health')
    ]);
    const pilots = await pilotsRes.json();
    const health = await healthRes.json();

    document.getElementById('stats').innerHTML =
      '<div class="stat"><div class="stat-value">' + (health.total_pilots || 0) + '</div><div class="stat-label">Families</div></div>' +
      '<div class="stat"><div class="stat-value">' + (health.active_pilots || 0) + '</div><div class="stat-label">Active</div></div>' +
      '<div class="stat"><div class="stat-value">' + (health.total_nodes || 0) + '</div><div class="stat-label">Nodes</div></div>' +
      '<div class="stat"><div class="stat-value">' + (health.avg_health ? health.avg_health.toFixed(2) : '0.00') + '</div><div class="stat-label">Avg Health</div></div>';

    const html = '<div class="pilot-grid">' + pilots.map(p =>
      '<div class="pilot-card ' + (p.status || '') + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
          '<strong>' + (p.family_name || p.did) + '</strong>' +
          '<span class="status-badge">' + (p.status || 'unknown') + '</span>' +
        '</div>' +
        '<div style="font-size:0.9rem;color:var(--p31-text-secondary);margin-top:0.5rem;">' +
          'Nodes: ' + (p.active_nodes || 0) + ' · Care events: ' + (p.care_events || 0) +
        '</div>' +
        '<div class="health-bar"><div class="health-fill" style="width:' + ((p.mesh_health || 0) * 100) + '%;"></div></div>' +
        '<div style="font-size:0.7rem;color:var(--p31-text-tertiary);margin-top:0.2rem;">Health: ' + (p.mesh_health || 0).toFixed(2) + '</div>' +
      '</div>'
    ).join('') + '</div>';
    document.getElementById('app').innerHTML = html;
  } catch (e) {
    document.getElementById('app').innerHTML = '<p style="color:var(--p31-accent-red);">Error loading data: ' + e.message + '</p>';
  }
}
load();
setInterval(load, 60000);
</script>
</body>
</html>`);
});

app.get('/api/pilots', async (c) => {
  try {
    const pilots = await c.env.DB.prepare(`
      SELECT p.did, p.family_name, p.status, p.onboarded_at, p.active_nodes, p.mesh_health,
             COUNT(c.id) as care_events
      FROM pilot_registry p
      LEFT JOIN love_chain c ON c.from_did = p.did AND c.type = 'transfer'
      GROUP BY p.did
      ORDER BY p.onboarded_at DESC
    `).all();

    let k4Topology: any = null;
    try {
      const k4Res = await c.env.K4_CAGE.fetch('https://k4/api/topology/summary');
      if (k4Res.ok) k4Topology = await k4Res.json();
    } catch { /* K4 unavailable — non-fatal */ }

    const enriched = pilots.results.map((p: any) => {
      if (k4Topology && k4Topology.totalLove > 0) {
        return {
          ...p,
          mesh_health: k4Topology.online / k4Topology.vertices || p.mesh_health,
          active_nodes: k4Topology.online || p.active_nodes,
          k4_love: k4Topology.totalLove,
          k4_online: k4Topology.online,
          k4_rigidity: k4Topology.rigidity,
        };
      }
      return p;
    });

    return c.json(enriched);
  } catch (err) {
    return c.json({ error: 'Failed to query pilots' }, 500);
  }
});

app.get('/api/health', async (c) => {
  try {
    const stats = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total_pilots,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_pilots,
        AVG(mesh_health) as avg_health,
        SUM(active_nodes) as total_nodes
      FROM pilot_registry
    `).first();
    return c.json(stats || { total_pilots: 0, active_pilots: 0, avg_health: 0, total_nodes: 0 });
  } catch (err) {
    return c.json({ error: 'Failed to query health' }, 500);
  }
});

app.get('/health', (c) => c.json({ ok: true, service: 'arcade' }));

export default app;
