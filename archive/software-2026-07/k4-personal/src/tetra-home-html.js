/**
 * Self-contained single-page “personal tetra” shell served from k4-personal (no p31ca build).
 * Docks: in-page #anchors; data from GET /agent/:userId/tetra (optional override).
 */
export function buildTetraHomePage(userId) {
  const u = String(userId).replace(/[^a-zA-Z0-9._-]/g, "") || "guest";
  const esc = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Personal tetra — ${esc(u)}</title>
  <style>
    :root { --bg: #0c0e12; --text: #d8d6d0; --muted: #6b6b6b; --edge: #2a2e38; --teal: #3b9a7a; --coral: #cc6247; }
    * { box-sizing: border-box; }
    body { font-family: system-ui, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); margin: 0; line-height: 1.5; }
    header { border-bottom: 1px solid var(--edge); padding: 1rem 1.25rem; }
    h1 { font-size: 1.1rem; font-weight: 600; margin: 0; }
    p.tag { color: var(--muted); font-size: 0.8rem; margin: 0.25rem 0 0; }
    main { max-width: 48rem; margin: 0 auto; padding: 1rem 1.25rem 3rem; }
    .tetra { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
    @media (min-width: 600px) { .tetra { grid-template-columns: 1fr 1fr; } }
    .dock { border: 1px solid var(--edge); border-radius: 10px; padding: 1rem; background: #11141a; }
    .dock h2 { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--teal); margin: 0 0 0.5rem; }
    .dock a { color: var(--coral); }
    .dock p { font-size: 0.9rem; margin: 0; color: var(--muted); }
    .api { font-family: ui-monospace, monospace; font-size: 0.7rem; color: #7a7a7a; margin-top: 0.75rem; word-break: break-all; }
    footer { color: var(--muted); font-size: 0.75rem; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--edge); }
  </style>
</head>
<body>
  <header>
    <h1>Personal K₄ — <span id="uid-label">${esc(u)}</span></h1>
    <p class="tag">Served from this Worker · agent &amp; mesh on same origin</p>
  </header>
  <main>
    <p style="color:var(--muted);font-size:0.9rem">Four docks (structure, connection, rhythm, creation). Override labels via <code>PUT /agent/${esc(u)}/tetra</code> (schema <code>p31.personalTetra/1.0.0</code>).</p>
    <div class="tetra" id="docks">
      <section class="dock" id="structure"><h2>Structure</h2><p id="blurb-structure">Build &amp; scaffold — geodesic, levels.</p><a href="https://p31ca.org/geodesic.html" target="_blank" rel="noopener">Open Geodesic (hub) ↗</a><div class="api">GET /api/mesh</div></section>
      <section class="dock" id="connection"><h2>Connection</h2><p id="blurb-connection">K₄ picture — family &amp; context as configured.</p><a href="https://p31ca.org/connect.html" target="_blank" rel="noopener">Open Connect (hub) ↗</a><div class="api">/viz</div></section>
      <section class="dock" id="rhythm"><h2>Rhythm</h2><p id="blurb-rhythm">Dial, pace, onboarding handoff.</p><a href="https://p31ca.org/planetary-onboard.html" target="_blank" rel="noopener">Planetary onboard ↗</a><div class="api">/agent/…/energy</div></section>
      <section class="dock" id="creation"><h2>Creation</h2><p id="blurb-creation">Code play &amp; EDE on hub until bundled here.</p><a href="https://p31ca.org/ede.html" target="_blank" rel="noopener">Open EDE (hub) ↗</a><div class="api">POST /agent/…/chat</div></section>
    </div>
    <section style="margin-top:1.5rem;border:1px solid var(--edge);border-radius:10px;padding:1rem" id="chat-box">
      <h2 style="font-size:0.85rem;margin:0 0 0.5rem;color:var(--teal)">Quick message (agent)</h2>
      <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.8rem;color:var(--muted);margin-bottom:0.5rem;cursor:pointer">
        <input type="checkbox" id="soulsafe" checked />
        SOULSAFE tetra — four specialist lenses + fusion (needs ≥3 spoons)
      </label>
      <textarea id="msg" rows="2" style="width:100%;background:#0a0c10;color:var(--text);border:1px solid var(--edge);border-radius:6px;padding:0.5rem" placeholder="Ask your personal agent (stored in this DO)…"></textarea>
      <button type="button" id="send" style="margin-top:0.5rem;padding:0.4rem 0.9rem;background:var(--teal);color:#0c0e12;border:none;border-radius:6px;cursor:pointer;font-weight:600">Send</button>
      <pre id="out" style="white-space:pre-wrap;font-size:0.8rem;color:#a0a0a0;margin-top:0.75rem"></pre>
      <pre id="effects" style="display:none;white-space:pre-wrap;font-size:0.72rem;color:#5a6a62;margin-top:0.5rem;border-top:1px solid var(--edge);padding-top:0.5rem"></pre>
    </section>
    <footer>
      <a href="https://p31ca.org" target="_blank" rel="noopener">p31ca.org</a> ·
      <a id="man-link" href="/agent/${esc(u)}/manifest">/agent/${esc(u)}/manifest</a> (JSON) ·
      Personal mesh: <a href="/api/mesh">/api/mesh</a>
    </footer>
  </main>
  <script>
  (function(){
    const USER = ${JSON.stringify(u)};
    const base = new URL('/agent/' + encodeURIComponent(USER), location.origin);
    const stateUrl = new URL('state', base);
    async function loadTetra() {
      try {
        const r = await fetch(new URL('tetra', base), { headers: { 'Accept': 'application/json' } });
        if (!r.ok) return;
        const j = await r.json();
        const docks = (j.docks) || {};
        for (const k of ['structure','connection','rhythm','creation']) {
          const d = docks[k];
          if (d && d.label) { const h = document.querySelector('#' + k + ' h2'); if (h) h.textContent = d.label; }
          if (d && d.hint) { const p = document.getElementById('blurb-' + k); if (p) p.textContent = d.hint; }
        }
      } catch (e) { /* offline */ }
    }
    async function pullSoulsafePrefs() {
      try {
        const r = await fetch(stateUrl, { headers: { 'Accept': 'application/json' } });
        if (!r.ok) return;
        const st = await r.json();
        if (st.soulsafe_prefs && typeof st.soulsafe_prefs.default === 'boolean') {
          const el = document.getElementById('soulsafe');
          if (el) el.checked = st.soulsafe_prefs.default;
        }
      } catch (e) { /* offline */ }
    }
    async function pushSoulsafePrefs() {
      const el = document.getElementById('soulsafe');
      if (!el) return;
      try {
        await fetch(stateUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ soulsafe_prefs: { default: el.checked } }),
        });
      } catch (e) { /* offline */ }
    }
    const soulsafeEl = document.getElementById('soulsafe');
    if (soulsafeEl) soulsafeEl.addEventListener('change', function () { void pushSoulsafePrefs(); });
    document.getElementById('send').addEventListener('click', async function() {
      const t = (document.getElementById('msg') || {}).value || '';
      const out = document.getElementById('out');
      const fx = document.getElementById('effects');
      const soulsafeEl = document.getElementById('soulsafe');
      if (!t.trim() || !out) return;
      out.textContent = '…';
      if (fx) { fx.style.display = 'none'; fx.textContent = ''; }
      try {
        const payload = { message: t, scope: 'personal' };
        if (soulsafeEl && soulsafeEl.checked) payload.soulsafe = true;
        const r = await fetch(new URL('chat', base), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const j = await r.json();
        out.textContent = (j.reply || j.error || JSON.stringify(j, null, 2));
        if (fx && j.soulsafe && j.soulsafe.effects) {
          fx.style.display = 'block';
          fx.textContent = 'Effects (transparency):' + "\\n" + JSON.stringify(j.soulsafe.effects, null, 2);
        } else if (fx && j.soulsafeSkipped) {
          fx.style.display = 'block';
          fx.textContent = 'SOULSAFE fusion skipped: ' + JSON.stringify(j.soulsafeSkipped);
        }
      } catch (e) { out.textContent = String(e); }
    });
    async function boot() {
      await Promise.all([loadTetra(), pullSoulsafePrefs()]);
      await pushSoulsafePrefs();
    }
    void boot();
  })();
  </script>
</body>
</html>`;
}
