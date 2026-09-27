/**
 * P31 Unified Starfield — Canvas 2D ambient mesh.
 * Merges @p31ca/ui/starfield.ts (325 lines) with p31-starfield.js (917 lines).
 * All visual values imported from @p31ca/design-core tokens.
 * Spoon-aware, framework-agnostic, zero dependencies (except design-core).
 */

import { STARFIELD as SFC } from './math/colors';

export interface StarfieldConfig {
  count: number;
  speed: number;
  connR: number;
  hearthA: number;
  tealGlowA: number;
  coralRatio: number;
  baseAlpha: number;
  breathRate: number;
  dimFactor: number;
}

export interface StarfieldOptions {
  container?: HTMLElement;
  spoons?: number;
  fps?: number;
  voltage?: 'GREEN' | 'AMBER' | 'RED' | 'BLUE';
  remembranceStars?: Array<{ x: number; y: number }>;
  connectionAudio?: boolean;
  poetsMode?: boolean;
  safeMode?: boolean;
}

export interface StarfieldInstance {
  setSpoons(level: number): void;
  setVoltage(v: 'GREEN' | 'AMBER' | 'RED' | 'BLUE'): void;
  setRemembrance(stars: Array<{ x: number; y: number }>): void;
  setConfig(partial: Partial<StarfieldConfig>): void;
  burst(x: number, y: number, color?: string): void;
  destroy(): void;
}

const DEFAULT_CONFIG: StarfieldConfig = {
  count: 80,
  speed: 0.15,
  connR: 80,
  hearthA: 0.04,
  tealGlowA: 0.02,
  coralRatio: 0.15,
  baseAlpha: 0.25,
  breathRate: 0.0008,
  dimFactor: 1,
};

function configFromSpoons(spoons: number, safeMode?: boolean): StarfieldConfig {
  const s = Math.max(0, Math.min(5, Number(spoons) || 3));
  if (safeMode || s <= 1) {
    return {
      count: 12, speed: 0.005, connR: 30,
      hearthA: 0.01, tealGlowA: 0.008, coralRatio: 0.1,
      baseAlpha: 0.06, breathRate: 0.0004, dimFactor: 0.15,
    };
  }
  if (s <= 3) {
    return {
      count: 50, speed: 0.08, connR: 60,
      hearthA: 0.035, tealGlowA: 0.016, coralRatio: 0.3,
      baseAlpha: 0.18, breathRate: 0.00075, dimFactor: 0.7,
    };
  }
  return { ...DEFAULT_CONFIG };
}

function applyVoltage(cfg: StarfieldConfig, voltage: string): StarfieldConfig {
  const c = { ...cfg };
  switch (voltage) {
    case 'AMBER':
      c.coralRatio = Math.min(0.85, c.coralRatio + 0.2);
      c.dimFactor *= 0.92;
      break;
    case 'RED':
      c.coralRatio = Math.min(0.92, c.coralRatio + 0.35);
      c.dimFactor *= 0.88;
      break;
    case 'BLUE':
      c.coralRatio = Math.max(0.05, c.coralRatio - 0.1);
      c.tealGlowA *= 1.3;
      break;
  }
  return c;
}

interface Particle {
  x: number; y: number; r: number;
  vx: number; vy: number; a: number;
  color: number[]; life: number | null;
}

interface Burst {
  x: number; y: number; r: number;
  vx: number; vy: number; a: number;
  color: number[]; life: number;
}

interface RemStar { x: number; y: number; a: number; phase: number; }

function makeParticle(w: number, h: number, cfg: StarfieldConfig): Particle {
  const isCoral = Math.random() < cfg.coralRatio;
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 1.2 + 0.35,
    vx: (Math.random() - 0.5) * cfg.speed * 2,
    vy: (Math.random() - 0.5) * cfg.speed * 2,
    a: Math.random() * cfg.baseAlpha + 0.05,
    color: isCoral ? [...SFC.coral] : [...SFC.teal],
    life: null,
  };
}

export function initStarfield(
  canvas: HTMLCanvasElement,
  options: StarfieldOptions = {}
): StarfieldInstance {
  const ctx = canvas.getContext('2d');
  if (!ctx) return createNoopApi();

  let spoons = options.spoons ?? 3;
  let voltage = options.voltage || 'GREEN';
  let cfg = applyVoltage(configFromSpoons(spoons, options.safeMode), voltage);
  let w = 0, h = 0, dpr = 1;
  let particles: Particle[] = [];
  let bursts: Burst[] = [];
  let remembrance: RemStar[] = [];
  let raf = 0;
  let running = true;
  let lastT = performance.now();
  let reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const poetsMode = !!options.poetsMode;
  let audioCtx: AudioContext | null = null;

  function layout() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, rect.width);
    h = Math.max(1, rect.height);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    particles = [];
    const mobile =
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 640px)').matches;
    const n = poetsMode ? 16 : mobile ? Math.round(cfg.count * 0.62) : cfg.count;
    for (let i = 0; i < n; i++) particles.push(makeParticle(w, h, cfg));
  }

  function syncCount() {
    const mobile =
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 640px)').matches;
    const target = poetsMode ? 16 : mobile ? Math.round(cfg.count * 0.62) : cfg.count;
    while (particles.length > target) particles.pop();
    while (particles.length < target) particles.push(makeParticle(w, h, cfg));
    for (const p of particles) {
      p.vx = (Math.random() - 0.5) * cfg.speed * 2;
      p.vy = (Math.random() - 0.5) * cfg.speed * 2;
    }
  }

  function playTone(freq: number, dur: number, vol = 0.08) {
    if (!audioCtx) return;
    try {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g); g.connect(audioCtx.destination);
      o.start(); o.stop(audioCtx.currentTime + dur);
    } catch { /* ignore */ }
  }

  function draw(t: number, dt: number) {
    const step = typeof dt === 'number' && dt > 0 ? dt : 1;
    ctx!.clearRect(0, 0, w, h);

    const breath = Math.sin(t * cfg.breathRate) * 0.5 + 0.5;
    const dim = cfg.dimFactor;

    // Hearth glow
    const hearthAlpha = cfg.hearthA * (0.8 + breath * 0.4) * dim;
    const grd = ctx!.createRadialGradient(w / 2, h * 0.92, 0, w / 2, h * 0.92, h * 0.75);
    grd.addColorStop(0, `rgba(204,98,71,${hearthAlpha})`);
    grd.addColorStop(0.5, `rgba(204,98,71,${hearthAlpha * 0.35})`);
    grd.addColorStop(1, 'rgba(10,10,15,0)');
    ctx!.fillStyle = grd;
    ctx!.fillRect(0, 0, w, h);

    // Teal ambient glow
    const grd2 = ctx!.createRadialGradient(w * 0.42, h * 0.22, 0, w * 0.42, h * 0.22, h * 0.48);
    grd2.addColorStop(0, `rgba(77,184,168,${cfg.tealGlowA * dim})`);
    grd2.addColorStop(1, 'rgba(10,10,15,0)');
    ctx!.fillStyle = grd2;
    ctx!.fillRect(0, 0, w, h);

    // Remembrance stars (warm white, fixed)
    for (const fs of remembrance) {
      const pulse = 0.6 + 0.4 * Math.sin(t * 0.001 + fs.phase);
      const a = fs.a * pulse * dim;
      ctx!.beginPath();
      ctx!.arc(fs.x * w, fs.y * h, 1.2 * pulse, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(245,240,232,${a})`;
      ctx!.fill();
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
          const lineA = 0.042 * (1 - d / cfg.connR) * dim;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.strokeStyle = `rgba(${a.color[0]},${a.color[1]},${a.color[2]},${Math.min(lineA, 0.14)})`;
          ctx!.lineWidth = 0.5;
          ctx!.stroke();
        }
      }
    }

    // Ambient particles
    for (const p of particles) {
      if (!reducedMotion) {
        p.x += p.vx * step;
        p.y += p.vy * step;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
      }
      const pa = p.a * dim * (0.72 + breath * 0.28);
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${pa})`;
      ctx!.fill();
    }

    // Bursts
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      if (!reducedMotion) {
        b.x += b.vx * step * 0.5;
        b.y += b.vy * step * 0.5;
      }
      b.life -= 0.03;
      if (b.life <= 0) { bursts.splice(i, 1); continue; }
      ctx!.beginPath();
      ctx!.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(${b.color[0]},${b.color[1]},${b.color[2]},${b.a * b.life})`;
      ctx!.fill();
    }
  }

  function frame(now: number) {
    if (!running) return;
    const dt = Math.min(3, (now - lastT) / 16.67);
    lastT = now;
    draw(now, dt);
    if (!reducedMotion) raf = requestAnimationFrame(frame);
  }

  function onResize() { layout(); seed(); if (reducedMotion) draw(0, 1); }

  function onVis() {
    if (document.hidden) { running = false; cancelAnimationFrame(raf); }
    else { running = true; lastT = performance.now();
      if (!reducedMotion) raf = requestAnimationFrame(frame);
      else draw(0, 1); }
  }

  function onPageShow(ev: PageTransitionEvent) {
    if (!ev || !ev.persisted) return;
    running = true; lastT = performance.now();
    if (!reducedMotion) raf = requestAnimationFrame(frame);
    else draw(0, 1);
  }

  const mqRm = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const onRm = () => { if (mqRm) reducedMotion = mqRm.matches; };
  if (mqRm) {
    if (typeof mqRm.addEventListener === 'function') mqRm.addEventListener('change', onRm);
    else (mqRm as any).addListener?.(onRm);
  }

  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('pageshow', onPageShow);
  window.addEventListener('pagehide', () => { running = false; cancelAnimationFrame(raf); });

  layout();
  seed();
  if (reducedMotion) draw(0, 1);
  else raf = requestAnimationFrame(frame);

  return {
    setSpoons(level: number) {
      spoons = level;
      cfg = applyVoltage(configFromSpoons(level, options.safeMode), voltage);
      syncCount();
      if (reducedMotion) draw(0, 1);
    },
    setVoltage(v: 'GREEN' | 'AMBER' | 'RED' | 'BLUE') {
      voltage = v;
      cfg = applyVoltage(configFromSpoons(spoons, options.safeMode), voltage);
    },
    setRemembrance(stars: Array<{ x: number; y: number }>) {
      remembrance = stars.map((p) => ({
        x: p.x, y: p.y,
        a: 0.3 + Math.random() * 0.2,
        phase: Math.random() * Math.PI * 2,
      }));
    },
    setConfig(partial: Partial<StarfieldConfig>) {
      cfg = { ...cfg, ...partial };
      syncCount();
      if (reducedMotion) draw(0, 1);
    },
    burst(x: number, y: number, color?: string) {
      const col = color === 'gold' ? SFC.butter
        : color === 'coral' ? SFC.coral
        : color === 'phosphor' ? SFC.phosphor
        : SFC.white;
      for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 40;
        bursts.push({
          x: x + Math.cos(angle) * dist * 0.35,
          y: y + Math.sin(angle) * dist * 0.35,
          r: Math.random() * 2 + 0.6,
          vx: Math.cos(angle) * (0.4 + Math.random() * 1.2),
          vy: Math.sin(angle) * (0.4 + Math.random() * 1.2),
          a: 0.75,
          color: [...col],
          life: 1,
        });
      }
      if (options.connectionAudio) playTone(880, 0.03, 0.04);
    },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pageshow', onPageShow);
      if (mqRm) {
        if (typeof mqRm.removeEventListener === 'function') mqRm.removeEventListener('change', onRm);
        else (mqRm as any).removeListener?.(onRm);
      }
    },
  };
}

function createNoopApi(): StarfieldInstance {
  return {
    setSpoons() {}, setVoltage() {}, setRemembrance() {},
    setConfig() {}, burst() {}, destroy() {},
  };
}

export function mountStarfield(
  container?: HTMLElement,
  options: StarfieldOptions = {}
): StarfieldInstance {
  const parent = container || document.body;
  const layer = document.createElement('div');
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0';
  const cvs = document.createElement('canvas');
  cvs.style.cssText = 'display:block;width:100%;height:100%';
  layer.appendChild(cvs);
  parent.appendChild(layer);
  return initStarfield(cvs, { ...options, container: parent });
}
