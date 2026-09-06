/**
 * Minimal HTML viz for k4-hubs: hub tetrahedron + dock binding indicators.
 */
import { CORS_HEADERS } from './http.js';

/**
 * @param {Record<string, string>} [extraHeaders]
 */
export function hubVizListResponse(extraHeaders = {}) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>K₄ Hubs</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0c1222; color: #cbd5e1; margin: 0; padding: 1.25rem; line-height: 1.5; max-width: 28rem; margin-inline: auto; }
    h1 { color: #4ecdc4; font-size: 1.15rem; }
    ul { list-style: none; padding: 0; }
    li { margin: 0.5rem 0; padding: 0.6rem 0.75rem; background: #111827; border: 1px solid #1e293b; border-radius: 8px; }
    a { color: #4ecdc4; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .meta { font-size: 0.72rem; color: #64748b; }
    #err { color: #f87171; font-size: 0.8rem; min-height: 1.2em; }
  </style>
</head>
<body>
  <h1>Hubs</h1>
  <p class="meta">Pick a life-context tetrahedron. <a href="/api">API</a></p>
  <div id="err"></div>
  <ul id="list"></ul>
  <script>
  (function(){
    fetch('/api/hubs', { cache: 'no-store' })
      .then(function(r){ return r.json(); })
      .then(function(d){
        var el = document.getElementById('list');
        if (!d.hubs || !d.hubs.length) {
          el.innerHTML = '<li class="meta">No hubs yet — POST /api/hubs</li>';
          return;
        }
        el.innerHTML = d.hubs.map(function(h){
          return '<li><a href="/viz?id=' + encodeURIComponent(h.hubId) + '">' + (h.title || h.kind || 'hub') + '</a>'
            + '<div class="meta">' + h.kind + ' · ' + h.hubId.slice(0,8) + '…</div></li>';
        }).join('');
      })
      .catch(function(){ document.getElementById('err').textContent = 'Could not load hubs'; });
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
 * @param {string} hubId
 * @param {Record<string, string>} [extraHeaders]
 */
export function hubVizHubResponse(hubId, extraHeaders = {}) {
  const hid = JSON.stringify(hubId);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Hub — K₄</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 1rem; }
    h1 { font-size: 1rem; color: #4ecdc4; text-align: center; }
    .sub { text-align: center; color: #64748b; font-size: 0.72rem; margin-bottom: 0.75rem; }
    .stats { display: flex; flex-wrap: wrap; gap: 0.6rem; justify-content: center; margin-bottom: 0.75rem; font-size: 0.75rem; color: #94a3b8; }
    .stats strong { color: #4ecdc4; }
    .wrap { max-width: 420px; margin: 0 auto; }
    svg { width: 100%; height: auto; display: block; filter: drop-shadow(0 0 10px rgba(78,205,196,0.1)); }
    .edge { stroke: #334155; stroke-width: 1.5; }
    .node { stroke: #0f172a; stroke-width: 1.5; }
    .dock-ring { fill: none; stroke-width: 1.2; opacity: 0.85; }
    .lbl { fill: #94a3b8; font-size: 7px; font-family: inherit; }
    .mini { opacity: 0.35; }
    #err { color: #f87171; text-align: center; font-size: 0.72rem; min-height: 1.2em; }
    a.back { display: block; text-align: center; margin-top: 0.75rem; color: #4ecdc4; font-size: 0.72rem; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1 id="title">Hub</h1>
    <div class="sub" id="subtitle">docks · personal bindings</div>
    <div class="stats" id="stats">
      <span>LOVE <strong id="love">—</strong></span>
      <span>Online <strong id="on">—</strong>/4</span>
      <span>Bound <strong id="bd">—</strong>/4</span>
    </div>
    <div id="err"></div>
    <svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg" aria-label="Hub K4">
      <line class="edge" x1="100" y1="12" x2="32" y2="102"/>
      <line class="edge" x1="100" y1="12" x2="168" y2="102"/>
      <line class="edge" x1="100" y1="12" x2="100" y2="78"/>
      <line class="edge" x1="32" y1="102" x2="168" y2="102"/>
      <line class="edge" x1="32" y1="102" x2="100" y2="78"/>
      <line class="edge" x1="168" y1="102" x2="100" y2="78"/>
      <circle class="dock-ring" id="ring-a" cx="100" cy="12" r="11" stroke="#64748b"/>
      <circle class="dock-ring" id="ring-b" cx="32" cy="102" r="11" stroke="#64748b"/>
      <circle class="dock-ring" id="ring-c" cx="168" cy="102" r="11" stroke="#64748b"/>
      <circle class="dock-ring" id="ring-d" cx="100" cy="78" r="11" stroke="#64748b"/>
      <circle class="node" id="v-a" cx="100" cy="12" r="7" fill="#475569"/>
      <circle class="node" id="v-b" cx="32" cy="102" r="7" fill="#475569"/>
      <circle class="node" id="v-c" cx="168" cy="102" r="7" fill="#475569"/>
      <circle class="node" id="v-d" cx="100" cy="78" r="7" fill="#475569"/>
      <text class="lbl" x="100" y="8" text-anchor="middle">a</text>
      <text class="lbl" x="32" y="118" text-anchor="middle">b</text>
      <text class="lbl" x="168" y="118" text-anchor="middle">c</text>
      <text class="lbl" x="100" y="94" text-anchor="middle">d</text>
    </svg>
    <a class="back" href="/viz">All hubs</a>
  </div>
  <script>
  (function(){
    var HID = ${hid};
    var map = { a: 'v-a', b: 'v-b', c: 'v-c', d: 'v-d' };
    var rings = { a: 'ring-a', b: 'ring-b', c: 'ring-c', d: 'ring-d' };
    function fillColor(st) {
      if (st === 'online') return '#22c55e';
      if (st === 'away') return '#eab308';
      return '#475569';
    }
    function tick() {
      fetch('/api/hubs/' + encodeURIComponent(HID) + '/mesh', { cache: 'no-store' })
        .then(function(r){ if (!r.ok) throw new Error('mesh ' + r.status); return r.json(); })
        .then(function(d){
          document.getElementById('err').textContent = '';
          if (d.manifest) {
            document.getElementById('title').textContent = d.manifest.title || d.manifest.kind || 'Hub';
            document.getElementById('subtitle').textContent = d.manifest.kind + ' · ' + HID.slice(0,8) + '…';
          }
          document.getElementById('love').textContent = d.totalLove != null ? d.totalLove : '0';
          document.getElementById('on').textContent = d.onlineCount != null ? d.onlineCount : '0';
          var mv = d.mesh && d.mesh.vertices;
          var dk = d.docks || {};
          var bound = 0;
          ['a','b','c','d'].forEach(function(id) {
            var b = dk[id] && dk[id].binding;
            if (b) bound++;
            var ring = document.getElementById(rings[id]);
            if (ring) {
              ring.setAttribute('stroke', b ? '#4ecdc4' : '#334155');
              ring.setAttribute('stroke-dasharray', b ? 'none' : '3 2');
            }
          });
          document.getElementById('bd').textContent = String(bound);
          if (!mv) return;
          Object.keys(map).forEach(function(id) {
            var el = document.getElementById(map[id]);
            var vtx = mv[id];
            if (el && vtx) el.setAttribute('fill', fillColor(vtx.status));
          });
        })
        .catch(function(e){ document.getElementById('err').textContent = e.message || 'Mesh unreachable'; });
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
