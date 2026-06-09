/**
 * P31 Starfield — canvas 2D ambient mesh (weather, not notifications).
 * Mesh touches: docs/P31-STARFIELD-MESH-TOUCHES.md + p31-mesh-touches.js
 */
import * as MT from "./p31-mesh-touches.js";

export const P31_STARFIELD_VERSION = "1.1.0";

/** @typedef {{ count: number; speed: number; connR: number; hearthA: number; tealGlowA: number; coralRatio: number; baseAlpha: number; breathRate: number; dimFactor: number; }} StarfieldConfig */

export const DEFAULT_STARFIELD_CONFIG = /** @type {StarfieldConfig} */ ({
  count: 80,
  speed: 0.15,
  connR: 80,
  hearthA: 0.04,
  tealGlowA: 0.02,
  coralRatio: 0.15,
  baseAlpha: 0.25,
  breathRate: 0.0008,
  dimFactor: 1,
});

const TEAL = [77, 184, 168];
const CORAL = [204, 98, 71];
const PHOSPHOR = [59, 163, 114];
const BUTTER = [205, 168, 82];
const WHITE = [255, 255, 255];
const GOLD = [175, 200, 140];

/** Consecrated / remembered vertices — canon: p31-constants.json `mesh.remembranceWarmWhite`. */
export const P31_REMEMBRANCE_WARM_WHITE = "#f5f0e8";
export const REMEMBRANCE_RGB = [245, 240, 232];

export function configFromSpoons(spoons, safeMode = false) {
  const s = Math.max(0, Math.min(12, Number(spoons) || 8));
  if (safeMode) {
    return {
      count: 12,
      speed: 0.005,
      connR: 30,
      hearthA: 0.01,
      tealGlowA: 0.008,
      coralRatio: 0.1,
      baseAlpha: 0.06,
      breathRate: 0.0004,
      dimFactor: 0.15,
    };
  }
  if (s <= 3) {
    return {
      count: 25,
      speed: 0.03,
      connR: 40,
      hearthA: 0.02,
      tealGlowA: 0.012,
      coralRatio: 0.6,
      baseAlpha: 0.1,
      breathRate: 0.0006,
      dimFactor: 0.4,
    };
  }
  if (s <= 7) {
    return {
      count: 50,
      speed: 0.08,
      connR: 60,
      hearthA: 0.035,
      tealGlowA: 0.016,
      coralRatio: 0.3,
      baseAlpha: 0.18,
      breathRate: 0.00075,
      dimFactor: 0.7,
    };
  }
  return { ...DEFAULT_STARFIELD_CONFIG };
}

export function applyVoltageToConfig(voltage, base) {
  const v = String(voltage || "GREEN").toUpperCase();
  const c = { ...base };
  if (v === "AMBER") {
    c.coralRatio = Math.min(0.85, c.coralRatio + 0.2);
    c.dimFactor *= 0.92;
  }
  if (v === "RED") {
    c.coralRatio = Math.min(0.92, c.coralRatio + 0.35);
    c.dimFactor *= 0.88;
  }
  return c;
}

/**
 * @returns {Promise<{ config: StarfieldConfig; hints: ReturnType<typeof MT.mergeApiTouchHints> }>}
 */
export async function resolveStarfieldConfig(apiUrl) {
  const url =
    apiUrl ||
    (typeof window !== "undefined" && window.__P31_STARFIELD_API__) ||
    "https://api.phosphorus31.org/api/state";
  try {
    const r = await fetch(url, { credentials: "omit", cache: "no-store" });
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    const st = j?.state ?? j;
    const spoons = st?.current_spoons ?? st?.currentSpoons ?? 8;
    const safe = !!(st?.safe_mode_active ?? st?.safeModeActive);
    const voltage = st?.system_voltage ?? st?.systemVoltage ?? "GREEN";
    let cfg = configFromSpoons(spoons, safe);
    cfg = applyVoltageToConfig(voltage, cfg);
    const hints = MT.mergeApiTouchHints(st);
    return { config: cfg, hints };
  } catch {
    return { config: { ...DEFAULT_STARFIELD_CONFIG }, hints: {} };
  }
}

/** Legacy: config only */
export async function resolveStarfieldConfigFlat(apiUrl) {
  const r = await resolveStarfieldConfig(apiUrl);
  return r.config;
}

function makeAmbient(w, h, cfg, coralRatio, birthdayMode) {
  const isCoral = Math.random() < coralRatio;
  let x = Math.random() * w;
  let y = Math.random() * h;
  if (birthdayMode === "bash") {
    const strip = Math.floor(Math.random() * 12);
    x = (strip / 12) * w * 0.85 + w * 0.075;
    y = (Math.random() * h * 0.35 + h * 0.55) * (0.92 + Math.random() * 0.08);
  } else if (birthdayMode === "willow") {
    const pair = Math.floor(Math.random() * 40);
    const px = (pair % 10) / 10;
    x = px * w * 0.9 + w * 0.05;
    y = ((pair % 2) * 0.04 + 0.45 + (Math.floor(pair / 10) % 5) * 0.08) * h;
  }
  return {
    x,
    y,
    r: Math.random() * 1.2 + 0.35,
    vx: (Math.random() - 0.5) * cfg.speed * 2,
    vy: (Math.random() - 0.5) * cfg.speed * 2,
    a: Math.random() * cfg.baseAlpha + 0.05,
    color: isCoral ? [...CORAL] : [...TEAL],
    life: null,
    birthdayPin: birthdayMode || null,
  };
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {StarfieldConfig} config
 * @param {object} [options]
 * @param {import('./p31-mesh-touches.js').P31Surface} [options.surface]
 * @param {boolean} [options.connectionAudio]
 * @param {boolean} [options.touchRipple]
 * @param {'fuller'|'operator'|'children'} [options.poetsQuoteTone]
 * @param {boolean} [options.poetsMode]
 * @param {string} [options.pulsePollUrl] optional full URL e.g. http://127.0.0.1:3131/api/mesh-pulse (command center)
 */
export function initStarfield(canvas, config, options = {}) {
  const ctx = canvas.getContext("2d");
  const surface = options.surface || "hub";
  const poetsMode = !!options.poetsMode;
  const allowRipple = options.touchRipple !== false;

  if (!ctx) {
    return createNoopApi();
  }

  let cfg = { ...config };
  let w = 0;
  let h = 0;
  let dpr = 1;
  let particles = [];
  let bursts = [];
  /** @type {Array<{x:number;y:number;a:number}>} */
  let fixedStars = MT.loadConstellation();
  /** Server mesh remembrance — warm white fixed stars (normalized 0–1). */
  let remembranceStars = [];
  let flashWave = null;
  let raf = 0;
  let running = true;
  let lastT = performance.now();
  let reducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let touchHints = {};
  let birthdayMode = MT.birthdayTouchMode();
  let fersBias = MT.fersDriftBias(new Date(), false);
  let moonMul = MT.moonOpacityMultiplier();
  let calciumGold = 0;
  let deepWork = false;
  let restingHrBr = null;
  let emptyRoomPhase = "off";
  let emptyRoomCenter = { x: 0, y: 0 };
  let mergedOrb = null;
  let sessionStart = performance.now();
  let sessionWarmthBonus = 0;
  let shimmerUntil = 0;
  let commitPulseUntil = 0;
  let sunrisePhase = null;
  let accommodationNight = false;
  let bondingOverlay = null;
  let bondingOverlayUntil = 0;
  /** NFC / printed K₄ — host sets true when tag in range */
  let physicalK4Near = false;
  let physicalK4NearUntil = 0;
  let lastProximityNotifyMs = 0;
  let genesisFlashIdx = -1;
  let genesisFlashFrames = 0;
  let prevConnKeys = new Set();
  let audioCtx = null;
  let audioWarm = false;
  /** @type {'fuller'|'operator'|'children'} */
  let poetsTone = options.poetsQuoteTone || "fuller";
  let poetParticle = null;

  const connAudio = !!options.connectionAudio && surface !== "poets";

  function layout() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, rect.width);
    h = Math.max(1, rect.height);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    emptyRoomCenter = { x: w / 2, y: h / 2 };
  }

  function warmAudio() {
    if (audioWarm || typeof AudioContext === "undefined") return;
    try {
      audioCtx = new AudioContext();
      audioWarm = true;
    } catch {
      /* ignore */
    }
  }

  function playTick(freq = 880, dur = 0.012) {
    if (!connAudio || reducedMotion || !audioCtx) return;
    try {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.value = 0.02;
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + dur);
    } catch {
      /* ignore */
    }
  }

  function playTone(freq, dur, vol = 0.08) {
    if (!audioCtx) return;
    try {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + dur);
    } catch {
      /* ignore */
    }
  }

  function makeBurstParticle(cx0, cy0, color, spread) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * spread * 0.35;
    return {
      x: cx0 + Math.cos(angle) * dist,
      y: cy0 + Math.sin(angle) * dist,
      r: Math.random() * 1.8 + 0.6,
      vx: Math.cos(angle) * (0.4 + Math.random() * 1.2),
      vy: Math.sin(angle) * (0.4 + Math.random() * 1.2),
      a: 0.75,
      color: [...color],
      life: 1,
    };
  }

  function seedAmbient() {
    particles = [];
    birthdayMode = MT.birthdayTouchMode();
    fersBias = MT.fersDriftBias(new Date(), !!touchHints.fersFiled);
    moonMul = MT.moonOpacityMultiplier();
    const mobile =
      typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;
    const n = poetsMode ? 16 : mobile ? Math.round(cfg.count * 0.62) : cfg.count;
    for (let i = 0; i < n; i++) particles.push(makeAmbient(w, h, cfg, cfg.coralRatio, birthdayMode));
    if (poetsMode) {
      const col = MT.poetsParticleColor(poetsTone);
      poetParticle = {
        x: w * 0.5,
        y: h * 0.42,
        r: 2.2,
        vx: (Math.random() - 0.5) * cfg.speed * 0.35,
        vy: (Math.random() - 0.5) * cfg.speed * 0.35,
        a: 0.42,
        color: col,
        life: null,
        poet: true,
      };
    } else poetParticle = null;
  }

  function syncAmbientCount() {
    const mobile =
      typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;
    const target = poetsMode ? 12 : mobile ? Math.round(cfg.count * 0.62) : cfg.count;
    while (particles.length > target) particles.pop();
    while (particles.length < target)
      particles.push(makeAmbient(w, h, cfg, cfg.coralRatio, birthdayMode));
    for (const p of particles) {
      if (p.poet) continue;
      p.vx = (Math.random() - 0.5) * cfg.speed * 2;
      p.vy = (Math.random() - 0.5) * cfg.speed * 2;
      p.color = Math.random() < cfg.coralRatio ? [...CORAL] : [...TEAL];
    }
  }

  function ingestHints(h) {
    touchHints = { ...touchHints, ...h };
    if (Array.isArray(h.remembranceFixedStars) && h.remembranceFixedStars.length > 0) {
      remembranceStars = h.remembranceFixedStars.map((p) => ({
        x: p.x,
        y: p.y,
        a: p.a,
      }));
    }
    if (h.restingHr != null) {
      const br = MT.breathRateFromHeartRate(h.restingHr);
      restingHrBr = br;
    }

    let lastMed = null;
    try {
      lastMed = Number(localStorage.getItem(MT.STORAGE.lastMedTs)) || null;
    } catch {
      lastMed = null;
    }
    let active =
      h.calciumWindowActive === true ||
      (h.calciumWindowActive !== false && MT.calciumWindowActive(Date.now(), lastMed));
    if (h.calciumWindowActive === false) active = false;
    calciumGold = MT.calciumHearthGoldMix(active, h.vyvanseSafe !== false);

    if (h.sentinelScene === "deep-work" || h.sentinelScene === "deep_work") deepWork = true;
    else if (h.sentinelScene) deepWork = false;

    let cold =
      h.meshAllEdgesCold48h === true ||
      (h.meshAllEdgesCold48h !== false && MT.meshEdgesCold48h(Date.now()));
    if (h.meshAllEdgesCold48h === false) cold = false;

    if (cold) {
      if (emptyRoomPhase === "off") emptyRoomPhase = "converging";
    } else if (emptyRoomPhase === "merged") {
      emptyRoomPhase = "explode";
    } else {
      emptyRoomPhase = "off";
      mergedOrb = null;
    }
  }

  function draw(t, dt) {
    const step = typeof dt === "number" && dt > 0 ? dt : 1;
    ctx.clearRect(0, 0, w, h);

    const breathRate =
      restingHrBr != null && !reducedMotion ? restingHrBr : cfg.breathRate;
    const breathPhase = Math.sin(t * breathRate) * 0.5 + 0.5;

    let dim = cfg.dimFactor * moonMul;
    if (sunrisePhase != null) {
      dim *= Math.min(1, sunrisePhase);
      sunrisePhase = Math.min(1, sunrisePhase + 0.022 * step);
      if (sunrisePhase >= 1) sunrisePhase = null;
    }

    const shimmer =
      shimmerUntil > t ? Math.sin(((t - (shimmerUntil - 5000)) / 5000) * Math.PI) * 0.15 + 1 : 1;
    const commitBoost = commitPulseUntil > t ? 1.1 : 1;

    sessionWarmthBonus = Math.min(0.05, Math.floor((t - sessionStart) / 3e5) * 0.01);

    const hearthAlpha =
      (cfg.hearthA + sessionWarmthBonus) * (0.8 + breathPhase * 0.4) * dim * shimmer * commitBoost;

    if (calciumGold > 0.05) {
      const grd = ctx.createRadialGradient(w / 2, h * 0.92, 0, w / 2, h * 0.92, h * 0.75);
      grd.addColorStop(0, `rgba(${GOLD[0]},${GOLD[1]},${GOLD[2]},${hearthAlpha * calciumGold})`);
      grd.addColorStop(0.35, `rgba(204,98,71,${hearthAlpha * (1 - calciumGold * 0.85)})`);
      grd.addColorStop(0.65, `rgba(204,98,71,${hearthAlpha * 0.35})`);
      grd.addColorStop(1, "rgba(5,8,12,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
    } else {
      const grd = ctx.createRadialGradient(w / 2, h * 0.92, 0, w / 2, h * 0.92, h * 0.75);
      grd.addColorStop(0, `rgba(204,98,71,${hearthAlpha})`);
      grd.addColorStop(0.5, `rgba(204,98,71,${hearthAlpha * 0.35})`);
      grd.addColorStop(1, "rgba(5,8,12,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
    }

    const grd2 = ctx.createRadialGradient(w * 0.42, h * 0.22, 0, w * 0.42, h * 0.22, h * 0.48);
    grd2.addColorStop(0, `rgba(37,137,125,${cfg.tealGlowA * dim})`);
    grd2.addColorStop(1, "rgba(5,8,12,0)");
    ctx.fillStyle = grd2;
    ctx.fillRect(0, 0, w, h);

    if (accommodationNight && !reducedMotion) {
      const glow = 0.04 * Math.sin((t / 1200) * Math.PI * 2) + 0.04;
      ctx.fillStyle = `rgba(255,255,255,${glow * dim})`;
      ctx.fillRect(0, 0, w, h);
    }

    if (flashWave && !reducedMotion) {
      flashWave.t += 0.028 * step;
      if (flashWave.t < 1) {
        const R = flashWave.t * Math.max(w, h) * 0.85;
        const alpha = (1 - flashWave.t) * 0.14;
        ctx.beginPath();
        ctx.arc(flashWave.cx, flashWave.cy, R, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(204,98,71,${alpha})`;
        ctx.lineWidth = 2.5 * (1 - flashWave.t);
        ctx.stroke();
      } else {
        flashWave = null;
      }
    }

    const effConn = deepWork ? 0 : poetsMode ? 0 : cfg.connR;

    const all = particles.concat(bursts);
    if (poetParticle) all.push(poetParticle);

    const currConn = new Set();
    if (effConn > 0 && !reducedMotion) {
      for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
          const a = all[i];
          const b = all[j];
          if (a.poet || b.poet) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          let cr = effConn;
          if (a.life != null || b.life != null) cr *= 1.45;
          if (d2 > cr * cr) continue;
          const k = i < j ? `${i}-${j}` : `${j}-${i}`;
          currConn.add(k);
          const d = Math.sqrt(d2);
          let lineA = 0.042 * (1 - d / cr) * dim;
          if (a.life != null) lineA *= a.life * 2.5;
          if (b.life != null) lineA *= b.life * 2.5;
          const mc = a.life != null ? a.color : b.color;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${mc[0]},${mc[1]},${mc[2]},${Math.min(lineA, 0.14)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
      if (connAudio && audioCtx && currConn.size > prevConnKeys.size) {
        let newN = 0;
        for (const k of currConn) {
          if (!prevConnKeys.has(k)) newN++;
        }
        if (newN > 0)
          playTick(660 + Math.min(220, newN * 30), 0.01 + Math.min(0.02, newN * 0.002));
      }
      prevConnKeys = currConn;
    } else {
      prevConnKeys = new Set();
    }

    const bereavementDim =
      touchHints.bereavementActive === true ? Math.min(1, dim * 1.08) : dim;
    for (const fs of remembranceStars) {
      ctx.beginPath();
      ctx.arc(fs.x * w, fs.y * h, 1.35, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${REMEMBRANCE_RGB[0]},${REMEMBRANCE_RGB[1]},${REMEMBRANCE_RGB[2]},${fs.a * bereavementDim})`;
      ctx.fill();
    }
    for (const fs of fixedStars) {
      ctx.beginPath();
      ctx.arc(fs.x * w, fs.y * h, 1.1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(77,184,168,${fs.a * dim})`;
      ctx.fill();
    }

    if (bondingOverlay && bondingOverlayUntil > t && bondingOverlay.angles) {
      const cx = w * 0.5;
      const cy = h * 0.48;
      const rr = bondingOverlay.r || 40;
      ctx.strokeStyle = `rgba(59,163,114,${0.35 * dim})`;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < bondingOverlay.angles.length; i++) {
        for (let j = i + 1; j < bondingOverlay.angles.length; j++) {
          const a1 = bondingOverlay.angles[i];
          const a2 = bondingOverlay.angles[j];
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a1) * rr, cy + Math.sin(a1) * rr);
          ctx.lineTo(cx + Math.cos(a2) * rr, cy + Math.sin(a2) * rr);
          ctx.stroke();
        }
      }
      for (const a of bondingOverlay.angles) {
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59,163,114,${0.55 * dim})`;
        ctx.fill();
      }
    }

    if (emptyRoomPhase === "converging" && !reducedMotion && !poetsMode) {
      const cx = emptyRoomCenter.x;
      const cy = emptyRoomCenter.y;
      for (const p of particles) {
        if (p.poet) continue;
        p.x += (cx - p.x) * 0.008 * step;
        p.y += (cy - p.y) * 0.008 * step;
      }
      let maxd = 0;
      for (const p of particles) {
        const d = Math.hypot(p.x - cx, p.y - cy);
        if (d > maxd) maxd = d;
      }
      if (maxd < 28 && particles.length > 1) {
        mergedOrb = { x: cx, y: cy, r: 6, a: 0.85 };
        emptyRoomPhase = "merged";
      }
    }

    if (emptyRoomPhase === "explode" && !reducedMotion) {
      seedAmbient();
      fireBurst("ping", {});
      emptyRoomPhase = "off";
      mergedOrb = null;
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      if (!reducedMotion && emptyRoomPhase !== "merged") {
        p.x += (p.vx + fersBias.fx * cfg.speed * 8) * step;
        p.y += (p.vy + fersBias.fy * cfg.speed * 8) * step;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
      }
      let col = p.color;
      if (genesisFlashIdx === i && genesisFlashFrames > 0) col = WHITE;
      const pa = p.a * dim * (0.72 + breathPhase * 0.28) * commitBoost;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${pa})`;
      ctx.fill();
    }
    if (genesisFlashFrames > 0) genesisFlashFrames--;

    if (mergedOrb && emptyRoomPhase === "merged") {
      ctx.beginPath();
      ctx.arc(mergedOrb.x, mergedOrb.y, mergedOrb.r + breathPhase * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(77,184,168,${mergedOrb.a * dim})`;
      ctx.fill();
    }

    if (poetParticle && !reducedMotion) {
      const pp = poetParticle;
      pp.x += pp.vx * step;
      pp.y += pp.vy * step;
      if (pp.x < 40) pp.vx = Math.abs(pp.vx);
      if (pp.x > w - 40) pp.vx = -Math.abs(pp.vx);
      if (pp.y < 40) pp.vy = Math.abs(pp.vy);
      if (pp.y > h - 40) pp.vy = -Math.abs(pp.vy);
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, pp.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${pp.color[0]},${pp.color[1]},${pp.color[2]},${pp.a * dim})`;
      ctx.fill();
    }

    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      if (!reducedMotion) {
        b.x += b.vx * step;
        b.y += b.vy * step;
        b.vx *= Math.pow(0.97, step);
        b.vy *= Math.pow(0.97, step);
        b.life -= 0.014 * step;
      } else {
        b.life -= 0.06;
      }
      if (b.life <= 0) {
        bursts.splice(i, 1);
        continue;
      }
      const ba = b.a * b.life * dim;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * b.life + 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${b.color[0]},${b.color[1]},${b.color[2]},${ba})`;
      ctx.fill();
    }
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min(3, (now - lastT) / 16.67);
    lastT = now;
    draw(now, dt);
    if (!reducedMotion) {
      raf = requestAnimationFrame(frame);
    }
  }

  function onResize() {
    layout();
    seedAmbient();
    fixedStars = MT.loadConstellation();
    if (reducedMotion) draw(0, 1);
  }

  function onVis() {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else {
      running = true;
      lastT = performance.now();
      if (!reducedMotion) raf = requestAnimationFrame(frame);
      else draw(0, 1);
    }
  }

  function fireBurst(type, _meta = {}) {
    if (reducedMotion && type !== "hostile") return;
    let cx0 = w / 2;
    let cy0 = h / 2;
    let color = TEAL;
    let count = 12;
    let spread = 90;
    if (type === "ping") {
      color = TEAL;
      count = 15;
      spread = 120;
      cx0 = w * (0.28 + Math.random() * 0.44);
      cy0 = h * (0.28 + Math.random() * 0.44);
    } else if (type === "med") {
      color = PHOSPHOR;
      count = 8;
      spread = 70;
      cx0 = w * 0.5;
      cy0 = h * 0.72;
      try {
        localStorage.setItem(MT.STORAGE.lastMedTs, String(Date.now()));
      } catch {
        /* ignore */
      }
      MT.recordMeshActivity("med");
      MT.pushConstellationPoint(cx0 / w, cy0 / h);
      fixedStars = MT.loadConstellation();
    } else if (type === "agent") {
      color = TEAL;
      count = 6;
      spread = 45;
      cx0 = w * 0.72;
      cy0 = h * 0.22;
      MT.recordMeshActivity("agent");
    } else if (type === "hostile") {
      flashWave = { t: 0, cx: w / 2, cy: h / 2 };
      color = CORAL;
      count = 18;
      spread = 200;
    } else if (type === "love") {
      color = BUTTER;
      count = 12;
      spread = 100;
    } else if (type === "bonding") {
      color = PHOSPHOR;
      count = 10;
      spread = 85;
      MT.recordMeshActivity("bonding");
    } else if (type === "touch") {
      color = TEAL;
      count = 6;
      spread = 36;
    }
    for (let i = 0; i < count; i++) {
      bursts.push(makeBurstParticle(cx0, cy0, color, spread));
    }
  }

  function pointerRipple(ev) {
    if (!allowRipple || reducedMotion) return;
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    warmAudio();
    fireBurst("touch", { x, y });
  }

  layout();
  seedAmbient();

  const mqRm = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onRm = () => {
    reducedMotion = mqRm.matches;
  };
  if (typeof mqRm.addEventListener === "function") mqRm.addEventListener("change", onRm);
  else mqRm.addListener(onRm);

  window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", onVis);
  if (allowRipple) canvas.addEventListener("pointerdown", pointerRipple);

  /** bfcache resume — `pageshow` fires on initial load AND on back/forward
   *  cache restore (`event.persisted === true`). Without this, RAF stays
   *  paused after a "hidden via bfcache" cycle and the sky goes static.   */
  function onPageShow(ev) {
    if (!ev || !ev.persisted) return;
    running = true;
    lastT = performance.now();
    if (!reducedMotion) raf = requestAnimationFrame(frame);
    else draw(0, 1);
  }
  function onPageHide() {
    running = false;
    cancelAnimationFrame(raf);
  }
  window.addEventListener("pageshow", onPageShow);
  window.addEventListener("pagehide", onPageHide);

  if (reducedMotion) {
    draw(0, 1);
  } else {
    raf = requestAnimationFrame(frame);
  }

  /** @type {ReturnType<typeof setInterval> | null} */
  let pulseTimer = null;
  if (options.pulsePollUrl && typeof options.pulsePollUrl === "string") {
    const pu = options.pulsePollUrl;
    async function pollPulse() {
      try {
        const r = await fetch(pu, { credentials: "omit", cache: "no-store" });
        if (r.status === 204 || r.status === 404) return;
        const j = await r.json();
        if (j && j.type === "bookmark") {
          warmAudio();
          try {
            audioCtx?.resume?.();
          } catch {
            /* ignore */
          }
          playTone(863, 0.1, 0.07);
        }
      } catch {
        /* offline */
      }
    }
    pulseTimer = setInterval(() => void pollPulse(), 9000);
    void pollPulse();
  }

  const uninstallChannel = MT.installMeshTouchChannel((msg) => {
    if (!msg || typeof msg !== "object") return;
    if (msg.type === "commit") {
      commitPulseUntil = performance.now() + 220;
    } else if (msg.type === "genesis") {
      genesisFlashIdx = particles.length ? Math.floor(Math.random() * particles.length) : -1;
      genesisFlashFrames = 2;
    } else if (msg.type === "shimmer") {
      shimmerUntil = performance.now() + 5000;
    } else if (msg.type === "sunrise") {
      sunrisePhase = 0.001;
      seedAmbient();
    } else if (msg.type === "warm-edge") {
      cfg.connR *= 1.35;
      setTimeout(() => {
        cfg.connR = Math.min(120, cfg.connR / 1.35);
      }, 380);
    }
  });

  function destroyInner() {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("pageshow", onPageShow);
    window.removeEventListener("pagehide", onPageHide);
    if (allowRipple) canvas.removeEventListener("pointerdown", pointerRipple);
    if (typeof mqRm.removeEventListener === "function") mqRm.removeEventListener("change", onRm);
    else mqRm.removeListener(onRm);
    uninstallChannel();
    if (pulseTimer) clearInterval(pulseTimer);
    try {
      audioCtx?.close();
    } catch {
      /* ignore */
    }
  }

  return {
    destroy: destroyInner,
    setConfig: (partial) => {
      cfg = { ...cfg, ...partial };
      syncAmbientCount();
      if (reducedMotion) draw(0, 1);
    },
    fireBurst,
    ingestTouchHints: ingestHints,
    pulseCommit: () => {
      commitPulseUntil = performance.now() + 220;
      MT.broadcastMeshTouch({ type: "commit" });
    },
    pulseGenesis: () => {
      genesisFlashIdx = particles.length ? Math.floor(Math.random() * particles.length) : -1;
      genesisFlashFrames = 2;
      MT.broadcastMeshTouch({ type: "genesis" });
    },
    pulseAccommodationShimmer: () => {
      shimmerUntil = performance.now() + 5000;
      MT.broadcastMeshTouch({ type: "shimmer" });
    },
    spoonSunrise: () => {
      sunrisePhase = 0.02;
      seedAmbient();
      MT.broadcastMeshTouch({ type: "sunrise" });
    },
    notifyWarmEdge: () => {
      MT.broadcastMeshTouch({ type: "warm-edge" });
      cfg.connR = Math.min(120, cfg.connR * 1.35);
      setTimeout(() => syncAmbientCount(), 400);
    },
    setBondingMolecule: (key) => {
      const g = MT.bondingMoleculeGeometry(key);
      if (g) {
        bondingOverlay = { angles: g.angles, r: g.r };
        bondingOverlayUntil = performance.now() + 2000;
      }
    },
    setDeepWork: (on) => {
      deepWork = !!on;
    },
    setPoetsTone: (tone) => {
      poetsTone = tone || "fuller";
      if (poetParticle) poetParticle.color = [...MT.poetsParticleColor(poetsTone)];
    },
    playBookmarkChime: () => {
      warmAudio();
      playTone(863, 0.1, 0.07);
    },
    /** @param {boolean} night */
    setAccommodationNight: (night) => {
      accommodationNight = !!night;
    },
    /**
     * NFC / printed K₄ — when `near` is true, brief warm conn-radius pulse (throttled, respects reduced motion).
     * @param {boolean} near
     */
    setPhysicalK4Proximity: (near) => {
      physicalK4Near = !!near;
      physicalK4NearUntil = performance.now() + (physicalK4Near ? 14e3 : 0);
      if (!physicalK4Near || reducedMotion) return;
      const now = performance.now();
      if (now - lastProximityNotifyMs < 4e3) return;
      lastProximityNotifyMs = now;
      MT.broadcastMeshTouch({ type: "warm-edge" });
      cfg.connR = Math.min(120, cfg.connR * 1.08);
      setTimeout(() => syncAmbientCount(), 500);
    },
  };
}

function createNoopApi() {
  const noop = () => {};
  return {
    destroy: noop,
    setConfig: noop,
    fireBurst: noop,
    ingestTouchHints: noop,
    pulseCommit: noop,
    pulseGenesis: noop,
    pulseAccommodationShimmer: noop,
    spoonSunrise: noop,
    notifyWarmEdge: noop,
    setBondingMolecule: noop,
    setDeepWork: noop,
    setPoetsTone: noop,
    playBookmarkChime: noop,
    setAccommodationNight: noop,
    setPhysicalK4Proximity: noop,
  };
}

export default {
  initStarfield,
  resolveStarfieldConfig,
  resolveStarfieldConfigFlat,
  configFromSpoons,
  applyVoltageToConfig,
  DEFAULT_STARFIELD_CONFIG,
  P31_STARFIELD_VERSION,
};
