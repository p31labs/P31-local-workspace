/**
 * Minimal /viz page for k4-personal: polls GET /api/mesh (same origin).
 */
import { CORS_HEADERS } from './http.js';

/**
 * @param {Record<string, string>} [extraHeaders] security / cache (merged last)
 */
export function personalVizResponse(extraHeaders = {}) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>K₄ Personal — Live</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 1rem; }
    h1 { font-size: 1.1rem; color: #4ecdc4; text-align: center; }
    .sub { text-align: center; color: #64748b; font-size: 0.75rem; margin-bottom: 1rem; }
    .badge { display: inline-block; background: #22c55e22; color: #4ade80; font-size: 0.65rem; padding: 0.2rem 0.5rem; border-radius: 4px; margin-left: 0.35rem; }
    .stats { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; margin-bottom: 1rem; font-size: 0.8rem; color: #94a3b8; }
    .stats strong { color: #4ecdc4; }
    .wrap { max-width: 420px; margin: 0 auto; }
    svg { width: 100%; height: auto; display: block; filter: drop-shadow(0 0 12px rgba(78,205,196,0.12)); }
    .edge { stroke: #334155; stroke-width: 1.5; }
    .node { stroke: #0f172a; stroke-width: 1.5; }
    .lbl { fill: #94a3b8; font-size: 8px; font-family: inherit; }
    .legend { margin-top: 1rem; font-size: 0.7rem; color: #64748b; text-align: center; line-height: 1.6; }
    .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; vertical-align: -1px; }
    .edges-panel { margin-top: 1rem; background: #111827; border: 1px solid #1e293b; border-radius: 8px; padding: 0.75rem; font-size: 0.72rem; color: #94a3b8; }
    .edges-panel h3 { color: #4ecdc4; font-size: 0.7rem; margin-bottom: 0.5rem; }
    .edge-row { padding: 0.25rem 0; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; }
    .edge-row:last-child { border-bottom: none; }
    #err { color: #f87171; text-align: center; font-size: 0.75rem; min-height: 1.2em; }
    a.back { display: block; text-align: center; margin-top: 1rem; color: #4ecdc4; font-size: 0.75rem; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>K₄ Personal <span class="badge">a–d</span></h1>
    <div class="sub">Four pillars · same rigid graph · isolated KV</div>
    <div class="stats" id="stats">
      <span>LOVE <strong id="love">—</strong></span>
      <span>Online <strong id="on">—</strong>/4</span>
      <span>Edges 24h <strong id="e24">—</strong>/6</span>
    </div>
    <div id="err"></div>
    <svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg" aria-label="K4 personal graph">
      <line class="edge" x1="100" y1="12" x2="32" y2="102"/>
      <line class="edge" x1="100" y1="12" x2="168" y2="102"/>
      <line class="edge" x1="100" y1="12" x2="100" y2="78"/>
      <line class="edge" x1="32" y1="102" x2="168" y2="102"/>
      <line class="edge" x1="32" y1="102" x2="100" y2="78"/>
      <line class="edge" x1="168" y1="102" x2="100" y2="78"/>
      <circle class="node" id="v-a" cx="100" cy="12" r="7" fill="#475569"/>
      <circle class="node" id="v-b" cx="32" cy="102" r="7" fill="#475569"/>
      <circle class="node" id="v-c" cx="168" cy="102" r="7" fill="#475569"/>
      <circle class="node" id="v-d" cx="100" cy="78" r="7" fill="#475569"/>
      <text class="lbl" x="100" y="8" text-anchor="middle">a</text>
      <text class="lbl" x="32" y="118" text-anchor="middle">b</text>
      <text class="lbl" x="168" y="118" text-anchor="middle">c</text>
      <text class="lbl" x="100" y="94" text-anchor="middle">d</text>
    </svg>
    <div class="legend">
      <span><i class="dot" style="background:#22c55e"></i>online</span>
      <span><i class="dot" style="background:#eab308"></i>away</span>
      <span><i class="dot" style="background:#475569"></i>offline</span>
    </div>
    <div class="edges-panel" id="edges"></div>
    <a class="back" href="/api">API routes</a>
  </div>
  <script>
  (function(){
    var map = { a: 'v-a', b: 'v-b', c: 'v-c', d: 'v-d' };
    function fillColor(st) {
      if (st === 'online') return '#22c55e';
      if (st === 'away') return '#eab308';
      return '#475569';
    }
    function tick() {
      fetch('/api/mesh', { cache: 'no-store' })
        .then(function(r){ return r.json(); })
        .then(function(d){
          document.getElementById('err').textContent = '';
          document.getElementById('love').textContent = d.totalLove != null ? d.totalLove : '0';
          document.getElementById('on').textContent = d.onlineCount != null ? d.onlineCount : '0';
          document.getElementById('e24').textContent = d.edgeActivity24h != null ? d.edgeActivity24h : '0';
          var mv = d.mesh && d.mesh.vertices;
          if (!mv) return;
          Object.keys(map).forEach(function(id) {
            var el = document.getElementById(map[id]);
            var vtx = mv[id];
            if (el && vtx) el.setAttribute('fill', fillColor(vtx.status));
          });
          var edges = d.mesh.edges;
          var html = '<h3>Edges (LOVE)</h3>';
          if (edges) {
            Object.keys(edges).sort().forEach(function(k) {
              var e = edges[k];
              var love = e.love != null ? e.love : 0;
              var la = e.lastActivity ? '<span style="color:#64748b">' + e.lastActivity.slice(0,16) + '</span>' : '—';
              html += '<div class="edge-row"><span>' + k.replace(/-/g,' ↔ ') + '</span><span>' + love + ' · ' + la + '</span></div>';
            });
          }
          document.getElementById('edges').innerHTML = html;
        })
        .catch(function(){ document.getElementById('err').textContent = 'Mesh unreachable'; });
    }
    tick();
    setInterval(tick, 4000);
  })();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'no-store',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

/**
 * @param {Record<string, string>} [extraHeaders]
 */
export function personalIndexHtml(extraHeaders = {}) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>k4-personal</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0c1222; color: #cbd5e1; padding: 2rem; max-width: 36rem; margin: 0 auto; line-height: 1.5; }
    h1 { color: #4ecdc4; font-size: 1.25rem; }
    a { color: #4ecdc4; }
    code { background: #1e293b; padding: 0.1rem 0.35rem; border-radius: 4px; font-size: 0.85rem; }
  </style>
</head>
<body>
  <h1>k4-personal</h1>
  <p>Dedicated K₄ mesh for the <strong>personal</strong> scope (vertices <code>a</code>–<code>d</code>), isolated from the family cage KV.</p>
  <ul>
    <li><a href="/api">Route index (JSON)</a></li>
    <li><a href="/api/mesh">GET /api/mesh</a></li>
    <li><a href="/viz">Live viz</a></li>
    <li><a href="https://k4-cage.trimtab-signal.workers.dev">Family cage (k4-cage)</a></li>
  </ul>
</body>
</html>`;
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'no-store',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}
