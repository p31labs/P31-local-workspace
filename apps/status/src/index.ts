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
  const maxLatency = Math.max(...results.map(r => r.latency_ms), 1);

  const rows = results.map(r => {
    const dotClass = r.status === 'up' ? 'up' : r.status === 'degraded' ? 'degraded' : 'down';
    const barPct = Math.min(Math.round((r.latency_ms / maxLatency) * 100), 100);
    const barColor = r.status === 'up' ? 'var(--p31-accent-green)' : r.status === 'degraded' ? 'var(--p31-accent-gold)' : 'var(--p31-accent-red)';
    return `<tr>
      <td style="padding:10px 16px"><span class="status-dot ${dotClass}"></span>${r.name}</td>
      <td style="padding:10px 16px;font-size:12px;color:${r.status === 'up' ? 'var(--p31-accent-green)' : r.status === 'degraded' ? 'var(--p31-accent-gold)' : 'var(--p31-accent-red)'};font-weight:600;text-transform:uppercase;letter-spacing:.05em">${r.status}</td>
      <td style="padding:10px 16px"><div class="latency-bar"><div class="latency-fill" style="width:${barPct}%;background:${barColor}"></div></div></td>
      <td style="padding:10px 16px;text-align:right;font-family:var(--p31-font-mono);font-size:13px">${r.latency_ms}ms</td>
      <td style="padding:10px 16px;font-size:11px;color:var(--p31-text-tertiary);font-family:var(--p31-font-mono)">${r.error || '—'}</td>
    </tr>`;
  }).join('');

  const summaryColor = upCount === totalCount ? 'var(--p31-accent)' : 'var(--p31-accent-gold)';
  const summaryText = upCount === totalCount ? 'All systems operational' : `${totalCount - upCount} service(s) degraded`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>P31 Status</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
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
<body data-spoons="3">
<canvas id="p31-starfield" style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0"></canvas>
<script>
(function(){var c=document.getElementById('p31-starfield'),x=c.getContext('2d'),W,H,p=[],N=50,S=0.08,CR=60,BA=0.18,HA=0.035,TG=0.016,CR2=0.3,BR=0.00075,DM=0.7;var TEAL=[77,184,168],CORAL=[204,98,71];function resize(){var r=c.getBoundingClientRect();var d=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;c.width=W*d;c.height=H*d;x.setTransform(d,0,0,d,0,0)}function seed(){p=[];for(var i=0;i<N;i++){var ic=Math.random()<CR2;p.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.2+.35,vx:(Math.random()-.5)*S*2,vy:(Math.random()-.5)*S*2,a:Math.random()*BA+.05,c:ic?[...CORAL]:[...TEAL]})}}function draw(t){var br=Math.sin(t*BR)*.5+.5;var g=x.createRadialGradient(W/2,H*.92,0,W/2,H*.92,H*.75);g.addColorStop(0,'rgba(204,98,71,'+HA*(.8+br*.4)*DM+')');g.addColorStop(.5,'rgba(204,98,71,'+HA*(.8+br*.4)*DM*.35+')');g.addColorStop(1,'rgba(5,8,12,0)');x.fillStyle=g;x.fillRect(0,0,W,H);var g2=x.createRadialGradient(W*.42,H*.22,0,W*.42,H*.22,H*.48);g2.addColorStop(0,'rgba(37,137,125,'+TG*DM+')');g2.addColorStop(1,'rgba(5,8,12,0)');x.fillStyle=g2;x.fillRect(0,0,W,H);for(var i=0;i<p.length;i++){for(var j=i+1;j<p.length;j++){var a=p[i],b=p[j],dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy;if(d2>CR*CR)continue;var d=Math.sqrt(d2),la=.042*(1-d/CR)*DM;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.strokeStyle='rgba('+a.c[0]+','+a.c[1]+','+a.c[2]+','+Math.min(la,.14)+')';x.lineWidth=.5;x.stroke()}}for(var i=0;i<p.length;i++){var q=p[i];q.x+=q.vx;q.y+=q.vy;if(q.x<-10)q.x=W+10;if(q.x>W+10)q.x=-10;if(q.y<-10)q.y=H+10;if(q.y>H+10)q.y=-10;var pa=q.a*DM*(.72+br*.28);x.beginPath();x.arc(q.x,q.y,q.r,0,Math.PI*2);x.fillStyle='rgba('+q.c[0]+','+q.c[1]+','+q.c[2]+','+pa+')';x.fill()}}function loop(now){draw(now);requestAnimationFrame(loop)}window.matchMedia('(prefers-reduced-motion: reduce)').matches?(resize(),seed(),draw(0)):(resize(),seed(),requestAnimationFrame(loop));window.addEventListener('resize',function(){resize();seed()})})();
</script>
<div class="container">
<header class="header">
<div style="width:80px;height:80px;background:radial-gradient(circle,rgba(0,240,255,.2) 0%,transparent 70%);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px">📡</div>
<div><h1>P31 <span class="accent">Status</span></h1><div class="sub">Service Health · Latency · Error Tracking</div></div>
</header>
<div class="spoon-controls" role="group" aria-label="Spoon level"><label>Spoons</label><button class="spoon-btn" data-spoon="0">0</button><button class="spoon-btn" data-spoon="1">1</button><button class="spoon-btn active" data-spoon="3">3</button><button class="spoon-btn" data-spoon="5">5</button></div>
<p class="summary">${summaryText} — ${upCount}/${totalCount}</p>
<div class="kpi-grid">
<div class="glass-panel kpi-card"><div class="kpi-value" style="color:var(--p31-accent-green)">${upCount}</div><div class="kpi-label">Services Up</div></div>
<div class="glass-panel kpi-card"><div class="kpi-value" style="color:${summaryColor}">${Math.round(results.reduce((a,r)=>a+r.latency_ms,0)/totalCount)}ms</div><div class="kpi-label">Avg Latency</div></div>
<div class="glass-panel kpi-card"><div class="kpi-value" style="color:var(--p31-accent)">${totalCount}</div><div class="kpi-label">Monitored</div></div>
</div>
<div class="glass-panel">
<table class="health-table">
<thead><tr><th>Service</th><th>Status</th><th>Latency</th><th style="text-align:right">ms</th><th>Error</th></tr></thead>
<tbody>${rows}</tbody>
</table>
</div>
<footer>Last checked: ${results[0]?.checked_at || new Date().toISOString()}</footer>
</div>
<script>
document.querySelectorAll('.spoon-btn').forEach(b=>{b.addEventListener('click',()=>{document.querySelectorAll('.spoon-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.body.dataset.spoons=b.dataset.spoon})});
</script>
</body>
</html>`;
}

const app = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      const results = await runChecks(env.DB);
      const checks: Record<string, { ok: boolean; latency_ms?: number }> = {};
      let allUp = true;
      for (const r of results) {
        const ok = r.status === 'up';
        checks[r.name] = { ok, latency_ms: r.latency_ms };
        if (!ok) allUp = false;
      }
      const upCount = results.filter(r => r.status === 'up').length;
      const hasDown = results.some(r => r.status === 'down');
      return new Response(JSON.stringify({
        ok: allUp,
        surface: 'status',
        version: '0.0.1',
        timestamp: new Date().toISOString(),
        status: hasDown ? 'degraded' : allUp ? 'operational' : 'degraded',
        checks,
      }), {
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
