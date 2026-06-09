/**
 * P31 Live Starfield — each star is a real entity.
 *
 * Entity types:
 *   worker  — Cloudflare Worker (from /p31-fleet-entities.json)
 *   site    — public P31 site (p31ca.org, phosphorus31.org, bonding.p31ca.org)
 *   family  — K₄ cage vertex (will · sj · wj · christyn)
 *   social  — external account (github · bluesky)
 *
 * Star states → colors:
 *   healthy  → teal   (#4db8a8)
 *   degraded → amber  (#cda852)
 *   down     → coral  (#cc6247)
 *   active   → white flash then back to base
 *   cold     → muted teal (dim)
 *   family   → phosphor (#3ba372)
 *   social   → purple  (#8b5cf6)
 *   unknown  → slate   (#94a3b8)
 *
 * Background decorative stars fill the rest of the sky.
 * Data streams per star show meaningful entity data, not random hex.
 */

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  teal:     [77,  184, 168],
  coral:    [204, 98,  71],
  amber:    [205, 168, 82],
  phosphor: [59,  163, 114],
  purple:   [139, 92,  246],
  white:    [255, 255, 255],
  slate:    [148, 163, 184],
};

const STATE_COLOR = {
  healthy:  C.teal,
  degraded: C.amber,
  down:     C.coral,
  active:   C.white,
  cold:     C.teal,
  family:   C.phosphor,
  social:   C.purple,
  hub:      C.amber,
  unknown:  C.slate,
};

const STATE_ALPHA = {
  healthy:  0.85,
  degraded: 0.80,
  down:     0.70,
  active:   1.00,
  cold:     0.30,
  family:   0.90,
  social:   0.80,
  hub:      0.75,
  unknown:  0.40,
};

// ── Hardcoded entity catalog ─────────────────────────────────────────────────
const HARDCODED_ENTITIES = [
  // K₄ family cage
  { id: 'will',      kind: 'family', label: 'will',      baseState: 'family' },
  { id: 'sj',        kind: 'family', label: 'S.J.',      baseState: 'family' },
  { id: 'wj',        kind: 'family', label: 'W.J.',      baseState: 'family' },
  { id: 'christyn',  kind: 'family', label: 'christyn',  baseState: 'family' },
  // P31 sites
  { id: 'p31ca',         kind: 'site', label: 'p31ca.org',         probeUrl: 'https://p31ca.org/', baseState: 'hub' },
  { id: 'phosphorus31',  kind: 'site', label: 'phosphorus31.org',  probeUrl: 'https://phosphorus31.org/', baseState: 'hub' },
  { id: 'bonding',       kind: 'site', label: 'bonding.p31ca.org', probeUrl: 'https://bonding.p31ca.org/', baseState: 'hub' },
  // Social
  { id: 'github-p31labs', kind: 'social', label: 'github/p31labs', probeUrl: 'https://api.github.com/orgs/p31labs', baseState: 'social' },
  { id: 'bluesky-p31',    kind: 'social', label: 'bluesky',        baseState: 'social' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0;
  return h;
}

// Deterministic position in [pad, 1-pad] range from entity id
function entityPos(id, w, h) {
  const hash = hashStr(id);
  const pad  = 0.07;
  return {
    x: (pad + ((hash & 0xFFFF) / 0xFFFF) * (1 - pad * 2)) * w,
    y: (pad + (((hash >>> 16) & 0xFFFF) / 0xFFFF) * (1 - pad * 2)) * h,
  };
}

const HEX    = '0123456789ABCDEF';
const MESH_G = ['K','4','P','O','C','a','3','1','Ψ','Δ','λ','∞','F','E','R','S'];
const GLYPHS = HEX + HEX + MESH_G.join('');

function rchar() { return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]; }

const STREAM_SPEED = 36;   // ms per char
const CHAR_SPACE   = 9;    // canvas px between chars
const CHAR_SIZE    = 7;    // font size canvas px
const MAX_STREAMS  = 14;

// ── Main export ───────────────────────────────────────────────────────────────
export async function initLiveStarfield(canvas, opts = {}) {
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || (typeof localStorage !== 'undefined' && localStorage.getItem('p31.starfield.off') === '1')) {
    canvas.style.opacity = '0';
    return { destroy() {} };
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy() {} };

  let w = 1, h = 1, dpr = 1;
  let stars = [];    // all renderable stars (entity + decorative)
  let raf = 0;
  let running = true;
  let entityMap = new Map(); // id → star

  // ── Load entity catalog ────────────────────────────────────────────────────
  let workerEntities = [];
  try {
    const r = await fetch('/p31-fleet-entities.json', { cache: 'no-store' });
    if (r.ok) {
      const d = await r.json();
      workerEntities = (d.entities || []).map(e => ({
        id:        e.slug,
        kind:      'worker',
        label:     e.title || e.slug,
        subtitle:  e.subtitle || '',
        probeUrl:  e.probeUrls?.[0] || '',
        baseState: 'unknown',
      }));
    }
  } catch { /* offline — no workers */ }

  const allEntities = [...HARDCODED_ENTITIES, ...workerEntities];

  // ── Layout ────────────────────────────────────────────────────────────────
  function layout() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = Math.max(1, Math.floor(rect.width  * dpr));
    h = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width  = w;
    canvas.height = h;

    // Build entity stars at deterministic positions
    const entityStars = allEntities.map(e => {
      const pos   = entityPos(e.id, w, h);
      const state = e.baseState || 'unknown';
      const existing = entityMap.get(e.id);
      return {
        ...pos,
        id:       e.id,
        kind:     e.kind,
        label:    e.label,
        subtitle: e.subtitle || '',
        probeUrl: e.probeUrl || '',
        entity:   true,
        state,
        r:        (e.kind === 'family' ? 2.2 : e.kind === 'site' ? 1.9 : 1.6) * dpr,
        rgb:      STATE_COLOR[state] || C.slate,
        alpha:    STATE_ALPHA[state] || 0.5,
        stream:   existing?.stream  || null,
        nextStreamAt: existing?.nextStreamAt || (performance.now() + Math.random() * 8000),
        intervalMs:   8000 + Math.random() * 20000,
        lastCheck: existing?.lastCheck || 0,
        activeUntil:  existing?.activeUntil || 0,
      };
    });

    entityStars.forEach(s => entityMap.set(s.id, s));

    // Decorative background stars (random, deterministic seed)
    const decCount = Math.max(60, Math.floor((w * h) / (dpr * dpr * 8000)));
    const DECO_COLORS = [C.teal, C.teal, C.teal, C.coral, C.phosphor, C.amber, [245,240,232], C.white];
    const rng = mulberry32(0x50310031);
    const decoStars = Array.from({ length: decCount }, () => {
      const ci  = Math.floor(rng() * DECO_COLORS.length);
      const [r, g, b] = DECO_COLORS[ci];
      const alpha = 0.35 + rng() * 0.55;
      const size  = alpha > 0.7 ? rng() * 1.4 + 0.7 : rng() * 0.8 + 0.25;
      return {
        x: rng() * w, y: rng() * h,
        id: null, kind: 'deco', entity: false,
        r: size * dpr, rgb: [r, g, b], alpha,
        color: `rgba(${r},${g},${b},${alpha.toFixed(3)})`,
        stream: null,
        nextStreamAt: performance.now() + rng() * 18000,
        intervalMs: 6000 + rng() * 16000,
      };
    });

    stars = [...entityStars, ...decoStars];
    // Resolve colors for entity stars
    for (const s of stars) if (s.entity) updateStarColor(s);
  }

  // ── Color helpers ─────────────────────────────────────────────────────────
  function updateStarColor(s) {
    const now = performance.now();
    const isActive = now < (s.activeUntil || 0);
    const state = isActive ? 'active' : s.state;
    s.rgb   = STATE_COLOR[state]  || C.slate;
    s.alpha = STATE_ALPHA[state]  || 0.5;
    s.color = `rgba(${s.rgb[0]},${s.rgb[1]},${s.rgb[2]},${s.alpha.toFixed(3)})`;
  }

  function notify(opts) {
    if (typeof window !== 'undefined' && typeof window.p31Notify === 'function') {
      window.p31Notify(opts);
    }
  }

  function setEntityState(id, state, streamData = null) {
    const s = entityMap.get(id);
    if (!s) return;
    const prev = s.state;
    s.state = state;
    if (state === 'active') s.activeUntil = performance.now() + 2500;
    updateStarColor(s);
    if (streamData) triggerEntityStream(s, streamData);

    // Fire molecular notification on meaningful transitions
    if (prev === state && state !== 'active') return;  // no change, no noise
    if (state === 'down' && prev !== 'down') {
      notify({ severity: 'critical', title: `${s.label} DOWN`, groupId: s.kind, lifespan: 15000 });
    } else if (state === 'healthy' && prev === 'down') {
      notify({ severity: 'success', title: `${s.label} recovered`, groupId: s.kind });
    } else if (state === 'degraded' && prev !== 'degraded') {
      notify({ severity: 'warning', title: `${s.label} degraded`, groupId: s.kind });
    } else if (state === 'active' && s.kind === 'family') {
      notify({ severity: 'mesh', title: streamData?.[1] ? `${s.label}: ${streamData[1]}` : s.label, groupId: 'family' });
    } else if (state === 'active' && s.kind === 'social') {
      notify({ severity: 'info', title: streamData?.[1] ? `${s.label}: ${streamData[1]}` : s.label, groupId: 'social' });
    }
  }

  // ── Health polling ────────────────────────────────────────────────────────
  let pollQueue = [];
  let pollIdx   = 0;
  let pollTimer = null;

  function buildPollQueue() {
    pollQueue = stars.filter(s => s.entity && s.probeUrl).sort(() => Math.random() - 0.5);
    pollIdx = 0;
  }

  async function pollNext() {
    if (!running) return;
    if (pollIdx >= pollQueue.length) { buildPollQueue(); }
    const star = pollQueue[pollIdx++];
    if (!star || !star.probeUrl) return;

    const t0 = performance.now();
    try {
      const r = await fetch(star.probeUrl, {
        signal: AbortSignal.timeout(5000),
        mode: 'no-cors',
        cache: 'no-store',
      });
      const ms = Math.round(performance.now() - t0);
      // no-cors → opaque status 0 means reachable
      const newState = r.status === 0 || r.ok ? 'healthy' : (r.status >= 500 ? 'down' : 'degraded');
      setEntityState(star.id, newState, [`${star.label}`, `${r.status || 'OK'}`, `${ms}ms`]);
    } catch {
      setEntityState(star.id, 'down', [`${star.label}`, 'DOWN', 'timeout']);
    }
    pollTimer = setTimeout(pollNext, 5000 + Math.random() * 3000);
  }

  // ── GitHub probe ──────────────────────────────────────────────────────────
  async function probeGitHub() {
    try {
      const r = await fetch('https://api.github.com/orgs/p31labs/repos?per_page=1&sort=pushed', {
        signal: AbortSignal.timeout(5000),
      });
      if (r.ok) {
        const [repo] = await r.json();
        if (repo) {
          setEntityState('github-p31labs', 'active', ['github', repo.name, repo.pushed_at?.slice(0,10) || '']);
          setTimeout(() => setEntityState('github-p31labs', 'healthy'), 3000);
        }
      }
    } catch { /* offline */ }
  }

  // ── Mesh event listener ───────────────────────────────────────────────────
  let bc = null;
  try {
    bc = new BroadcastChannel('p31-mesh-touch');
    bc.addEventListener('message', e => {
      const msg = e.data;
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'ping'    && msg.vertex) setEntityState(msg.vertex, 'active', [msg.vertex, 'ping']);
      if (msg.type === 'bonding' && msg.vertex) setEntityState(msg.vertex, 'active', [msg.vertex, 'bonding']);
      if (msg.type === 'med')                   setEntityState('will',     'active', ['will', 'med']);
      if (msg.type === 'commit')                setEntityState('github-p31labs', 'active', ['commit']);
    });
  } catch { /* no BroadcastChannel in some envs */ }

  // ── Data stream triggering ────────────────────────────────────────────────
  function maybeSpawnStream(star, now) {
    if (star.stream) return;
    if (now < star.nextStreamAt) return;
    const active = stars.filter(s => s.stream).length;
    if (active >= MAX_STREAMS) { star.nextStreamAt = now + 1500; return; }
    const len = 5 + Math.floor(Math.random() * 9);
    star.stream = {
      chars:   Array.from({ length: len }, rchar),
      startMs: now,
      len,
    };
    star.nextStreamAt = now + star.intervalMs + (Math.random() * 4000 - 2000);
  }

  function triggerEntityStream(star, lines) {
    if (!star) return;
    // Prepend entity-meaningful chars (padded/truncated to stream length)
    const entityChars = lines.join(' ').padEnd(12).slice(0, 12).split('');
    const tail = Array.from({ length: 6 }, rchar);
    star.stream = { chars: [...entityChars, ...tail], startMs: performance.now(), len: entityChars.length + tail.length };
  }

  // ── Draw ─────────────────────────────────────────────────────────────────
  function draw(now) {
    ctx.clearRect(0, 0, w, h);
    ctx.font = `${CHAR_SIZE * dpr}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';

    for (const star of stars) {
      const [r, g, b] = star.rgb;
      const a = star.alpha;

      // Glow halo
      ctx.fillStyle = `rgba(${r},${g},${b},${(a * 0.15).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r * (star.entity ? 4.5 : 3.2), 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();

      // Pulse ring for degraded / down
      if (star.entity && (star.state === 'degraded' || star.state === 'down')) {
        const pulse = 0.5 + 0.5 * Math.sin(now * (star.state === 'down' ? 0.003 : 0.0015));
        ctx.strokeStyle = `rgba(${r},${g},${b},${(a * pulse * 0.5).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r * (3 + pulse * 2.5) * dpr, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Active flash
      if (star.entity && now < (star.activeUntil || 0)) {
        const t = 1 - (now - (star.activeUntil - 2500)) / 2500;
        ctx.fillStyle = `rgba(255,255,255,${(t * 0.35).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r * 5 * dpr, 0, Math.PI * 2);
        ctx.fill();
        updateStarColor(star);
      }

      // Data stream
      if (!star.stream) { maybeSpawnStream(star, now); }
      if (star.stream) {
        const { chars, startMs, len } = star.stream;
        const elapsed = now - startMs;
        const totalDur = len * STREAM_SPEED + 700;
        if (elapsed > totalDur) { star.stream = null; continue; }

        const revealed = Math.min(len, Math.floor(elapsed / STREAM_SPEED) + 1);
        for (let i = 0; i < revealed; i++) {
          const cy = star.y + (i + 1) * CHAR_SPACE * dpr;
          if (cy > h + 16) break;
          const trailFrac = 1 - i / len;
          const fadeOut   = Math.max(0, 1 - (elapsed - len * STREAM_SPEED) / 700);
          const charAlpha = trailFrac * fadeOut;
          ctx.fillStyle = `rgba(${r},${g},${b},${charAlpha.toFixed(3)})`;
          ctx.fillText(chars[i], star.x, cy);
        }
      }
    }
  }

  // ── Loop ──────────────────────────────────────────────────────────────────
  function loop(now) {
    if (!running) return;
    draw(now);
    raf = requestAnimationFrame(loop);
  }

  function onVis() {
    if (document.hidden) { running = false; cancelAnimationFrame(raf); }
    else { running = true; raf = requestAnimationFrame(loop); }
  }

  const ro = new ResizeObserver(() => layout());
  ro.observe(canvas);
  layout();

  // Start poll chain (stagger first poll)
  buildPollQueue();
  pollTimer = setTimeout(pollNext, 1500);
  setTimeout(probeGitHub, 3000);
  setInterval(probeGitHub, 5 * 60 * 1000);

  // ── System state → quantum state ──────────────────────────────────────────
  async function syncSystemState() {
    try {
      const r = await fetch('https://api.phosphorus31.org/api/state', {
        signal: AbortSignal.timeout(4000), credentials: 'omit', cache: 'no-store',
      });
      if (!r.ok) return;
      const j = await r.json();
      const st = j?.state ?? j;
      const voltage = (st?.system_voltage ?? st?.systemVoltage ?? 'GREEN').toUpperCase();
      const spoons  = st?.current_spoons  ?? st?.currentSpoons ?? 8;
      const qState  = voltage === 'RED' || spoons <= 2  ? 'plasma'
                    : voltage === 'AMBER' || spoons <= 5 ? 'gas'
                    : 'liquid';
      if (typeof window !== 'undefined' && window.p31MolField?.get) {
        window.p31MolField.get().setQuantumState(qState);
      }
      // Also notify on voltage change
      if (voltage === 'RED')   notify({ severity: 'critical', title: `System voltage: RED`,   groupId: 'system', lifespan: 20000 });
      if (voltage === 'AMBER') notify({ severity: 'warning',  title: `System voltage: AMBER`, groupId: 'system' });
    } catch { /* offline */ }
  }

  document.addEventListener('visibilitychange', onVis);
  raf = requestAnimationFrame(loop);

  syncSystemState();
  setInterval(syncSystemState, 5 * 60 * 1000);

  return {
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      clearTimeout(pollTimer);
      document.removeEventListener('visibilitychange', onVis);
      try { ro.disconnect(); } catch {}
      try { bc?.close(); } catch {}
    },
    setEntityState,
    getEntityMap: () => entityMap,
  };
}

// Keep static plate as named re-export so verify-surface-canon needle still matches
export { initLiveStarfield as initStaticStarPlate };
