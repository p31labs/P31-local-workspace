import { Hono } from 'hono';

type Env = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html>
<head><title>LOVE Arcade</title>
<style>
body { font-family: system-ui; max-width: 1200px; margin: 0 auto; padding: 2rem; background: #0a0a0a; color: #eee; }
.card { background: #1a1a1a; border-radius: 12px; padding: 1.5rem; margin: 1rem 0; border: 1px solid #333; }
.pilot-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
.pilot-card { background: #1a1a1a; border-radius: 12px; padding: 1rem; border-left: 4px solid #4CAF50; }
.pilot-card.completed { border-left-color: #9E9E9E; }
.pilot-card.pending { border-left-color: #FFC107; }
.pilot-card.active { border-left-color: #4CAF50; }
.status-badge { display: inline-block; padding: 0.2rem 0.8rem; border-radius: 20px; font-size: 0.8rem; background: #333; }
h1 { color: #4CAF50; }
.health-bar { height: 6px; background: #333; border-radius: 3px; width: 100%; margin-top: 0.5rem; }
.health-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #4CAF50, #8BC34A); transition: width 0.5s; }
.stats { display: flex; gap: 2rem; margin: 1rem 0; }
.stat { text-align: center; }
.stat-value { font-size: 2rem; font-weight: bold; color: #4CAF50; }
.stat-label { font-size: 0.8rem; color: #aaa; }
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
        '<div style="font-size:0.9rem;color:#aaa;margin-top:0.5rem;">' +
          'Nodes: ' + (p.active_nodes || 0) + ' · Care events: ' + (p.care_events || 0) +
        '</div>' +
        '<div class="health-bar"><div class="health-fill" style="width:' + ((p.mesh_health || 0) * 100) + '%;"></div></div>' +
        '<div style="font-size:0.7rem;color:#666;margin-top:0.2rem;">Health: ' + (p.mesh_health || 0).toFixed(2) + '</div>' +
      '</div>'
    ).join('') + '</div>';
    document.getElementById('app').innerHTML = html;
  } catch (e) {
    document.getElementById('app').innerHTML = '<p style="color:#ff5722;">Error loading data: ' + e.message + '</p>';
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
    return c.json(pilots.results);
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
