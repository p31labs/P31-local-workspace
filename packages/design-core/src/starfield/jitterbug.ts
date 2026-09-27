/**
 * Jitterbug Molecular Starfield — combined background system.
 * Composes @p31ca/design-core starfield (particles + connections + glows)
 * with Buckminster Fuller's jitterbug (morphing cuboctahedron→icosahedron→octahedron).
 *
 * Spoon-aware, zero framework dependencies, mounts to any container div.
 * SMART notification API: notify(type, x, y, msg) triggers burst + visual feedback.
 */

interface Vec3 { x: number; y: number; z: number; }

/* ═════════════════════════════════════════════════════════════════ */
/* Jitterbug Geometry Engine (from @p31ca/game-engine)                 */
/* ═════════════════════════════════════════════════════════════════ */

const PHI = (1 + Math.sqrt(5)) / 2;

const CUBOCTAHEDRON_VERTICES: Vec3[] = [
  { x:  1, y:  1, z:  0 }, { x:  1, y: -1, z:  0 }, { x: -1, y:  1, z:  0 }, { x: -1, y: -1, z:  0 },
  { x:  1, y:  0, z:  1 }, { x:  1, y:  0, z: -1 }, { x: -1, y:  0, z:  1 }, { x: -1, y:  0, z: -1 },
  { x:  0, y:  1, z:  1 }, { x:  0, y:  1, z: -1 }, { x:  0, y: -1, z:  1 }, { x:  0, y: -1, z: -1 },
];

const OCTAHEDRON_VERTICES: Vec3[] = [
  { x:  1, y:  0, z:  0 }, { x: -1, y:  0, z:  0 },
  { x:  0, y:  1, z:  0 }, { x:  0, y: -1, z:  0 },
  { x:  0, y:  0, z:  1 }, { x:  0, y:  0, z: -1 },
];

const ICOSAHEDRON_VERTICES: Vec3[] = [
  { x:  0, y:  1, z:  PHI }, { x:  0, y:  1, z: -PHI }, { x:  0, y: -1, z:  PHI }, { x:  0, y: -1, z: -PHI },
  { x:  1, y:  PHI, z:  0 }, { x:  1, y: -PHI, z:  0 }, { x: -1, y:  PHI, z:  0 }, { x: -1, y: -PHI, z:  0 },
  { x:  PHI, y:  0, z:  1 }, { x:  PHI, y:  0, z: -1 }, { x: -PHI, y:  0, z:  1 }, { x: -PHI, y:  0, z: -1 },
];

function lerpVertices(a: Vec3[], b: Vec3[], t: number): Vec3[] {
  const st = t * t * (3 - 2 * t);
  const len = Math.min(a.length, b.length);
  const r: Vec3[] = [];
  for (let i = 0; i < len; i++) {
    r.push({ x: a[i].x + (b[i].x - a[i].x) * st, y: a[i].y + (b[i].y - a[i].y) * st, z: a[i].z + (b[i].z - a[i].z) * st });
  }
  return r;
}

function jitterbugVertices(phase: number): Vec3[] {
  const c = Math.max(0, Math.min(1, phase || 0));
  if (c <= 0.5) return lerpVertices(CUBOCTAHEDRON_VERTICES, ICOSAHEDRON_VERTICES, c * 2);
  return lerpVertices(ICOSAHEDRON_VERTICES, OCTAHEDRON_VERTICES, (c - 0.5) * 2);
}

function spoonMorphSpeed(spoons: number): number {
  if (spoons <= 0) return 0.02;
  if (spoons <= 1) return 0.05;
  if (spoons <= 3) return 0.15;
  return 0.3;
}

/* ═════════════════════════════════════════════════════════════════ */
/* Starfield Engine (simplified from @p31ca/design-core/starfield)     */
/* ═════════════════════════════════════════════════════════════════ */

interface Particle {
  x: number; y: number; r: number;
  vx: number; vy: number; a: number;
  color: [number, number, number];
}

interface Burst {
  x: number; y: number; r: number;
  vx: number; vy: number; a: number;
  color: [number, number, number];
  life: number;
}

const TEAL: [number, number, number] = [77, 184, 168];
const CORAL: [number, number, number] = [204, 98, 71];
const GOLD: [number, number, number] = [245, 190, 11];
const WHITE: [number, number, number] = [245, 240, 232];

export interface JitterbugStarfieldOptions {
  spoons?: number;
  voltage?: 'GREEN' | 'AMBER' | 'RED' | 'BLUE';
  connectionAudio?: boolean;
  safeMode?: boolean;
  poetsMode?: boolean;
}

export interface VertexData {
  id: string;
  x: number; y: number;
  r: number;
  color: [number, number, number];
  pulse: number;
  spoons: number;
  status: 'online' | 'offline' | 'ghost';
  label?: string;
}

export interface BrightStarData {
  id: string;
  x: number; y: number;
  r: number;
  color: [number, number, number];
  pulse: number;
  health: 'healthy' | 'degraded' | 'offline';
  load: number;
}

export interface EdgeData {
  source: string;
  target: string;
  weight: number;
  color: [number, number, number];
}

export interface JitterbugStarfieldInstance {
  setSpoons(level: number): void;
  setVoltage(v: 'GREEN' | 'AMBER' | 'RED' | 'BLUE'): void;
  setPaused(paused: boolean): void;
  notify(type: string, x: number, y: number, msg?: string): void;
  updateVertices(data: VertexData[]): void;
  updateBrightStars(data: BrightStarData[]): void;
  updateEdges(data: EdgeData[]): void;
  destroy(): void;
}

export function mountJitterbugStarfield(
  container: HTMLElement | null,
  options: JitterbugStarfieldOptions = {}
): JitterbugStarfieldInstance {
  if (!container) return { setSpoons() {}, setVoltage() {}, setPaused() {}, notify() {}, updateVertices() {}, updateBrightStars() {}, updateEdges() {}, destroy() {} };

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    container.removeChild(canvas);
    return { setSpoons() {}, setVoltage() {}, setPaused() {}, notify() {}, updateVertices() {}, updateBrightStars() {}, updateEdges() {}, destroy() {} };
  }

  let spoons = options.spoons ?? 3;
  let voltage = options.voltage || 'GREEN';
  const safeMode = !!options.safeMode;
  const poetsMode = !!options.poetsMode;
  let w = 0, h = 0, dpr = 1;
  let particles: Particle[] = [];
  let bursts: Burst[] = [];
  let vertexData: VertexData[] = [];
  let starData: BrightStarData[] = [];
  let edgeData: EdgeData[] = [];
  let raf = 0;
  let running = true;
  let paused = false;
  let lastT = performance.now();
  let phase = 0;
  let targetPhase = 0;
  let morphSpeed = spoonMorphSpeed(spoons);
  const driftState = new Map<string, { x: number; y: number; vx: number; vy: number }>();
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let audioCtx: AudioContext | null = null;
  if (options.connectionAudio && spoons > 1) {
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (AC) audioCtx = new AC();
    } catch { /* no audio */ }
  }

  function playTone(freq: number, dur: number, vol = 0.06) {
    if (!audioCtx || spoons <= 1) return;
    try {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g); g.connect(audioCtx.destination);
      o.start(); o.stop(audioCtx.currentTime + dur);
    } catch { /* ignore */ }
  }

  function config() {
    if (safeMode || spoons <= 1) return { count: 12, speed: 0.003, connR: 25, dimFactor: 0.12, coralRatio: 0.08 };
    if (spoons <= 3) return { count: poetsMode ? 22 : 50, speed: 0.06, connR: 55, dimFactor: 0.55, coralRatio: 0.2 };
    return { count: poetsMode ? 35 : 80, speed: 0.12, connR: 80, dimFactor: 1, coralRatio: 0.3 };
  }

  function makeParticle(): Particle {
    const cfg = config();
    const isCoral = Math.random() < cfg.coralRatio;
    return {
      x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.2 + 0.35,
      vx: (Math.random() - 0.5) * cfg.speed * 2, vy: (Math.random() - 0.5) * cfg.speed * 2,
      a: Math.random() * 0.3 + 0.08, color: isCoral ? [...CORAL] : [...TEAL],
    };
  }

  function layout() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, rect.width); h = Math.max(1, rect.height);
    canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    particles = [];
    const n = config().count;
    for (let i = 0; i < n; i++) particles.push(makeParticle());
  }

  function draw(t: number, dt: number) {
    const step = typeof dt === 'number' && dt > 0 ? dt : 1;
    const cfg = config();
    const dim = cfg.dimFactor;
    const breath = Math.sin(t * 0.0008) * 0.5 + 0.5;
    ctx!.clearRect(0, 0, w, h);

    // Hearth glow
    const grd = ctx!.createRadialGradient(w / 2, h * 0.92, 0, w / 2, h * 0.92, h * 0.7);
    grd.addColorStop(0, `rgba(200,100,70,${0.04 * dim * (0.8 + breath * 0.4)})`);
    grd.addColorStop(1, 'rgba(10,10,15,0)');
    ctx!.fillStyle = grd; ctx!.fillRect(0, 0, w, h);

    // Teal ambient glow
    const grd2 = ctx!.createRadialGradient(w * 0.42, h * 0.22, 0, w * 0.42, h * 0.22, h * 0.45);
    grd2.addColorStop(0, `rgba(70,180,165,${0.016 * dim})`);
    grd2.addColorStop(1, 'rgba(10,10,15,0)');
    ctx!.fillStyle = grd2; ctx!.fillRect(0, 0, w, h);

    // Voltage tint
    if (voltage === 'AMBER') {
      ctx!.fillStyle = `rgba(245,158,11,${0.025 * dim})`; ctx!.fillRect(0, 0, w, h);
    } else if (voltage === 'RED') {
      ctx!.fillStyle = `rgba(244,63,94,${0.03 * dim})`; ctx!.fillRect(0, 0, w, h);
    }

    // Connection lines
    if (cfg.connR > 0 && !reducedMotion) {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > cfg.connR * cfg.connR) continue;
          const d = Math.sqrt(d2);
          const la = 0.08 * (1 - d / cfg.connR) * dim;
          ctx!.beginPath(); ctx!.moveTo(a.x, a.y); ctx!.lineTo(b.x, b.y);
          ctx!.strokeStyle = `rgba(${a.color[0]},${a.color[1]},${a.color[2]},${Math.min(la, 0.12)})`;
          ctx!.lineWidth = 0.5; ctx!.stroke();
        }
      }
    }

    // Particles
    for (const p of particles) {
      if (!reducedMotion) {
        p.x += p.vx * step; p.y += p.vy * step;
        if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; if (p.y > h + 10) p.y = -10;
      }
      const pa = p.a * dim * (0.7 + breath * 0.3);
      ctx!.beginPath(); ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${pa})`;
      ctx!.fill();
    }

    // Live peer constellation (data-driven) — fallback to static molecular nodes
    const cx = w / 2, cy = h / 2;
    if (vertexData.length > 0) {
      drawConstellation(t, dim, breath, cx, cy);
    } else {
      const verts = jitterbugVertices(phase);
      const scale = Math.min(w, h) * 0.12;
      for (const v of verts) {
        const sx = cx + v.x * scale;
        const sy = cy - v.y * scale + 0.15 * h;
        const ja = 0.25 * dim * (0.6 + breath * 0.4);
        ctx!.beginPath(); ctx!.arc(sx, sy, 2.2, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(70,180,165,${ja})`;
        ctx!.fill();
      }
    }

    // Worker health bright stars
    drawBrightStars(t, dim, cx, cy);

    // Bursts
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      if (!reducedMotion) { b.x += b.vx * step * 0.5; b.y += b.vy * step * 0.5; }
      b.life -= 0.025;
      if (b.life <= 0) { bursts.splice(i, 1); continue; }
      ctx!.beginPath(); ctx!.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(${b.color[0]},${b.color[1]},${b.color[2]},${b.a * b.life})`;
      ctx!.fill();
    }

    // Phase morph
    const diff = targetPhase - phase;
    if (Math.abs(diff) > 0.001) {
      const stepAmt = Math.min(Math.abs(diff), morphSpeed * step);
      phase += Math.sign(diff) * stepAmt;
    }
  }

  function relaxConstellation() {
    const real = vertexData.filter((v) => v.status !== 'ghost');
    if (real.length < 2) { driftState.clear(); return; }
    for (const k of [...driftState.keys()]) if (!vertexData.some((v) => v.id === k)) driftState.delete(k);
    for (const v of real) if (!driftState.has(v.id)) driftState.set(v.id, { x: 0, y: 0, vx: 0, vy: 0 });

    for (let i = 0; i < real.length; i++) {
      for (let j = i + 1; j < real.length; j++) {
        const a = real[i], b = real[j];
        const da = driftState.get(a.id)!, db = driftState.get(b.id)!;
        const dx = (b.x + db.x) - (a.x + da.x);
        const dy = (b.y + db.y) - (a.y + da.y);
        const d = Math.hypot(dx, dy) + 1e-4;
        const f = 0.003 / d;
        const fx = (dx / d) * f, fy = (dy / d) * f;
        da.vx -= fx; da.vy -= fy;
        db.vx += fx; db.vy += fy;
      }
    }
    for (const v of real) {
      const s = driftState.get(v.id)!;
      s.vx += -s.x * 0.003;
      s.vy += -s.y * 0.003;
    }
    for (const s of driftState.values()) {
      s.vx *= 0.9; s.vy *= 0.9;
      s.x += s.vx; s.y += s.vy;
      const m = Math.hypot(s.x, s.y);
      if (m > 0.12) { s.x *= 0.12 / m; s.y *= 0.12 / m; }
    }
  }

  function drawConstellation(t: number, dim: number, breath: number, cx: number, cy: number) {
    const scale = Math.min(w, h) * 0.28;
    if (!reducedMotion && !paused) relaxConstellation();
    const rotAngle = reducedMotion ? 0 : t * 0.00015 * Math.max(1, morphSpeed * 6);
    const cos = Math.cos(rotAngle), sin = Math.sin(rotAngle);
    const pos = new Map<string, { sx: number; sy: number }>();
    for (const v of vertexData) {
      const d = driftState.get(v.id);
      const ox = v.x + (d ? d.x : 0);
      const oy = v.y + (d ? d.y : 0);
      const rx = ox * cos - oy * sin;
      const ry = ox * sin + oy * cos;
      pos.set(v.id, { sx: cx + rx * scale, sy: cy - ry * scale + 0.1 * h });
    }

    for (const e of edgeData) {
      const a = pos.get(e.source), b = pos.get(e.target);
      if (!a || !b) continue;
      const la = Math.min((0.12 + e.weight * 0.3) * dim, 0.45);
      ctx!.beginPath(); ctx!.moveTo(a.sx, a.sy); ctx!.lineTo(b.sx, b.sy);
      ctx!.strokeStyle = `rgba(${e.color[0]},${e.color[1]},${e.color[2]},${la})`;
      ctx!.lineWidth = 0.5 + e.weight * 1.4;
      ctx!.stroke();
    }

    for (const v of vertexData) {
      const p = pos.get(v.id);
      if (!p) continue;
      const ghost = v.status === 'ghost';
      const pa = Math.max(v.pulse * dim * (ghost ? 0.35 : 0.8) * (0.55 + breath * 0.45), 0.06);
      ctx!.beginPath(); ctx!.arc(p.sx, p.sy, v.r * 2.6, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(${v.color[0]},${v.color[1]},${v.color[2]},${pa * 0.18})`;
      ctx!.fill();
      ctx!.beginPath(); ctx!.arc(p.sx, p.sy, ghost ? v.r * 0.8 : v.r, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(${v.color[0]},${v.color[1]},${v.color[2]},${pa})`;
      ctx!.fill();
    }
  }

  function drawBrightStars(t: number, dim: number, cx: number, cy: number) {
    if (starData.length === 0) return;
    const scale = Math.min(w, h) * 0.46;
    starData.forEach((s, i) => {
      const sx = cx + s.x * scale;
      const sy = cy - s.y * scale;
      const pulse = 0.5 + 0.5 * Math.sin((reducedMotion ? 0 : t) * 0.0025 + i * 1.7);
      const healthAlpha = s.health === 'offline' ? 0.35 : s.health === 'degraded' ? 0.6 : 1;
      const grd = ctx!.createRadialGradient(sx, sy, 0, sx, sy, s.r * 6);
      grd.addColorStop(0, `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${0.22 * dim * healthAlpha})`);
      grd.addColorStop(1, 'rgba(10,10,15,0)');
      ctx!.fillStyle = grd; ctx!.beginPath(); ctx!.arc(sx, sy, s.r * 6, 0, Math.PI * 2); ctx!.fill();
      ctx!.beginPath(); ctx!.arc(sx, sy, s.r * (0.7 + 0.5 * pulse), 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${0.85 * healthAlpha})`;
      ctx!.fill();
    });
  }

  function frame(now: number) {
    if (!running) return;
    if (paused) { raf = 0; return; }
    const dt = Math.min(3, (now - lastT) / 16.67);
    lastT = now;
    draw(now, dt);
    if (!reducedMotion) raf = requestAnimationFrame(frame);
  }

  function onResize() { layout(); seed(); if (reducedMotion) draw(0, 1); }

  // ResizeObserver — handles initial layout + responsive resizing
  const ro = new ResizeObserver(() => { layout(); if (reducedMotion) draw(0, 1); });
  ro.observe(container);

  // Defer initial render by one RAF frame to guarantee DOM is painted
  requestAnimationFrame(() => {
    layout();
    seed();
    if (reducedMotion) draw(0, 1);
    else raf = requestAnimationFrame(frame);
  });

  window.addEventListener('resize', onResize);

  return {
    setSpoons(level: number) {
      spoons = Math.max(0, Math.min(5, level));
      morphSpeed = spoonMorphSpeed(spoons);
      seed();
      targetPhase = spoons <= 1 ? 1 : spoons <= 3 ? 0.5 : 0;
      if (reducedMotion) draw(0, 1);
    },
    setVoltage(v: 'GREEN' | 'AMBER' | 'RED' | 'BLUE') {
      voltage = v;
      if (v === 'RED') targetPhase = 1;
      else if (v === 'AMBER') targetPhase = 0.7;
      if (reducedMotion) draw(0, 1);
    },
    setPaused(p: boolean) {
      paused = p;
      if (!p && !reducedMotion && raf === 0 && running) {
        lastT = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (p && raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (p) {
        draw(0, 1);
      }
    },
    notify(type: string, x: number, y: number, _msg?: string) {
      const bx = (x || 0.5) * w;
      const by = (y || 0.5) * h;
      let col: [number, number, number] = [...WHITE];

      switch (type) {
        case 'love_mint': col = [...GOLD]; targetPhase = 0; morphSpeed = 0.5; playTone(880, 0.04, 0.04); break;
        case 'spoon_change': col = spoons <= 1 ? [...CORAL] : [...TEAL]; break;
        case 'task_complete': col = [...WHITE]; targetPhase = 0; playTone(660, 0.03, 0.03); break;
        case 'crisis_alert': col = [...CORAL]; voltage = 'RED'; targetPhase = 1; morphSpeed = 0.8; break;
        case 'mesh_peer': col = [...TEAL]; targetPhase = 0.3; break;
        case 'achievement': col = [...GOLD]; targetPhase = 0; morphSpeed = 0.6; playTone(1320, 0.05, 0.05); break;
      }

      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 60;
        bursts.push({
          x: bx + Math.cos(angle) * dist * 0.3,
          y: by + Math.sin(angle) * dist * 0.3,
          r: Math.random() * 2.5 + 0.8,
          vx: Math.cos(angle) * (0.5 + Math.random() * 1.5),
          vy: Math.sin(angle) * (0.5 + Math.random() * 1.5),
          a: 0.8, color: col, life: 1,
        });
      }
    },
    updateVertices(data: VertexData[]) {
      vertexData = data || [];
      if (reducedMotion) draw(0, 1);
    },
    updateBrightStars(data: BrightStarData[]) {
      starData = data || [];
      if (reducedMotion) draw(0, 1);
    },
    updateEdges(data: EdgeData[]) {
      edgeData = data || [];
      if (reducedMotion) draw(0, 1);
    },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', onResize);
      if (container.contains(canvas)) container.removeChild(canvas);
    },
  };
}
