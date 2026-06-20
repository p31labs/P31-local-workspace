#!/usr/bin/env node

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

const STATE_PATH = '/tmp/phos-cognitive-state.json';
const TIDE_PATH = '/tmp/phos-tide-state.json';

function dotBit(col, row) {
  if (col === 0) return row < 3 ? row : 6;
  return row < 3 ? row + 3 : 7;
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s));
  l = Math.max(0, Math.min(100, l));
  const H = h / 360, S = s / 100, L = l / 100;
  if (S === 0) { const v = Math.round(L * 255); return { r: v, g: v, b: v }; }
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = L < 0.5 ? L * (1 + S) : L + S - L * S;
  const p = 2 * L - q;
  return {
    r: Math.round(hue2rgb(p, q, H + 1/3) * 255),
    g: Math.round(hue2rgb(p, q, H) * 255),
    b: Math.round(hue2rgb(p, q, H - 1/3) * 255),
  };
}

function rgbToAnsi256(r, g, b) {
  if (Math.abs(r - g) < 5 && Math.abs(g - b) < 5) {
    return 232 + Math.min(23, Math.max(0, Math.round(r / 255 * 23)));
  }
  return 16 + 36 * Math.round(r / 255 * 5) + 6 * Math.round(g / 255 * 5) + Math.round(b / 255 * 5);
}

function fgAnsi(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  return `\x1B[38;5;${rgbToAnsi256(r, g, b)}m`;
}

function bgAnsi(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  return `\x1B[48;5;${rgbToAnsi256(r, g, b)}m`;
}

function readState() {
  try {
    if (!existsSync(STATE_PATH)) return null;
    return JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
  } catch { return null; }
}

function readTideWave() {
  try {
    if (!existsSync(TIDE_PATH)) return null;
    const tide = JSON.parse(readFileSync(TIDE_PATH, 'utf-8'));
    if (!tide.temporal_model?.hourly) return null;
    const counts = tide.temporal_model.hourly.map(h => h.events);
    const max = Math.max(...counts, 1);
    return counts.map(c => c / max);
  } catch { return null; }
}

const WAVE_CHARS = ['\u2581', '\u2582', '\u2583', '\u2584', '\u2585', '\u2586', '\u2587', '\u2588'];

const DIM_CONFIG = [
  { key: 'cognitive_load', label: 'LOAD', baseH: 35, baseS: 35, baseL: 45, hueShift: 0 },
  { key: 'fatigue',       label: 'FATG', baseH: 215, baseS: 15, baseL: 30, hueShift: 0 },
  { key: 'flow',          label: 'FLOW', baseH: 165, baseS: 45, baseL: 40, hueShift: 0 },
  { key: 'creativity',    label: 'CREA', baseH: 270, baseS: 30, baseL: 45, hueShift: 50 },
  { key: 'stress',        label: 'STRS', baseH: 15,  baseS: 35, baseL: 40, hueShift: -15 },
];

function dimHSL(dim, value, state) {
  const fatigue = state?.fatigue || 0;
  let h = dim.baseH + dim.hueShift * value;
  let s = dim.baseS + 15 * value;
  let l = dim.baseL + 10 * value * (1 - fatigue * 0.3);
  return { h: ((h % 360) + 360) % 360, s: Math.min(50, s), l: Math.max(20, Math.min(55, l)) };
}

function globalHSL(state) {
  if (!state) return { h: 210, s: 40, l: 50 };
  const cl = state.cognitive_load || 0;
  const fa = state.fatigue || 0;
  const fl = state.flow || 0;
  const cr = state.creativity || 0;
  const st = state.stress || 0;
  return {
    h: ((210 + cl * 60 + cr * 30 - st * 40) % 360 + 360) % 360,
    s: Math.min(100, 40 + fl * 60),
    l: Math.min(80, Math.max(20, 50 + cl * 20 - fa * 30)),
  };
}

const MAX_PARTICLES = 120;
const FRAME_MS = 100;

class ParticleSystem {
  constructor(cols, rows) {
    this.cols = cols || 80;
    this.rows = rows || 24;
    this.count = 0;
    this.x = new Float32Array(MAX_PARTICLES);
    this.y = new Float32Array(MAX_PARTICLES);
    this.vx = new Float32Array(MAX_PARTICLES);
    this.vy = new Float32Array(MAX_PARTICLES);
    this.life = new Float32Array(MAX_PARTICLES);
    this.maxLife = new Float32Array(MAX_PARTICLES);
    this.dimIdx = new Uint8Array(MAX_PARTICLES);
    this.seed();
  }

  seed() {
    const n = Math.min(MAX_PARTICLES, 80);
    for (let i = 0; i < n; i++) this.spawn(i, true);
    this.count = n;
  }

  spawn(i, full) {
    this.x[i] = Math.random() * this.cols * 2;
    this.y[i] = Math.random() * this.rows * 4;
    this.vx[i] = (Math.random() - 0.5) * 2;
    this.vy[i] = (Math.random() - 0.5) * 2;
    this.life[i] = full ? 0.5 + Math.random() * 1.5 : 0.1 + Math.random() * 0.5;
    this.maxLife[i] = 0.5 + Math.random() * 1.5;
    this.dimIdx[i] = Math.floor(Math.random() * DIM_CONFIG.length);
  }

  update(dt, state) {
    const load = state?.cognitive_load || 0.5;
    const fatigue = state?.fatigue || 0.3;
    const flow = state?.flow || 0.5;
    const stress = state?.stress || 0.2;
    const creativity = state?.creativity || 0.4;
    const cx = this.cols;
    const cy = this.rows * 2;
    const baseSpeed = 0.2 + load * 0.8;
    const damping = 1 - fatigue * 0.4;
    const now = Date.now() / 1000;

    for (let i = 0; i < this.count; i++) {
      this.life[i] -= dt * (0.2 + fatigue * 0.3);
      if (this.life[i] <= 0) {
        this.spawn(i, false);
        this.life[i] = 0.2 + Math.random() * 0.8;
        this.maxLife[i] = this.life[i];
        continue;
      }

      const jitter = stress * 40;
      this.vx[i] += (Math.random() - 0.5) * jitter * dt;
      this.vy[i] += (Math.random() - 0.5) * jitter * dt;

      if (flow > 0.1) {
        const dx = cx - this.x[i];
        const dy = cy - this.y[i];
        this.vx[i] += dx * flow * 2.5 * dt;
        this.vy[i] += dy * flow * 2.5 * dt;
      }

      this.vx[i] *= damping;
      this.vy[i] *= damping;

      if (creativity > 0.1) {
        const phase = now * 0.5 + i * 0.7;
        const w = creativity * 4;
        this.vx[i] += Math.sin(phase) * w * dt;
        this.vy[i] += Math.cos(phase * 0.7 + 1.2) * w * dt;
      }

      const maxV = baseSpeed * 3;
      const spd = Math.sqrt(this.vx[i] * this.vx[i] + this.vy[i] * this.vy[i]);
      if (spd > maxV) {
        this.vx[i] = (this.vx[i] / spd) * maxV;
        this.vy[i] = (this.vy[i] / spd) * maxV;
      }

      this.x[i] += this.vx[i] * dt;
      this.y[i] += this.vy[i] * dt;

      const m = 2;
      if (this.x[i] < -m) this.x[i] = this.cols * 2 + m;
      if (this.x[i] > this.cols * 2 + m) this.x[i] = -m;
      if (this.y[i] < -m) this.y[i] = this.rows * 4 + m;
      if (this.y[i] > this.rows * 4 + m) this.y[i] = -m;
    }
  }

  render(state, opts = {}) {
    const cellCols = this.cols;
    const cellRows = this.rows;
    const total = cellCols * cellRows;
    const mask = new Uint8Array(total);
    const accR = new Float32Array(total);
    const accG = new Float32Array(total);
    const accB = new Float32Array(total);
    const cnt = new Uint16Array(total);

    for (let i = 0; i < this.count; i++) {
      const cx = Math.floor(this.x[i] / 2);
      const cy = Math.floor(this.y[i] / 4);
      const idx = cy * cellCols + cx;
      if (idx < 0 || idx >= total) continue;
      const bit = dotBit(Math.floor(this.x[i]) % 2, Math.floor(this.y[i]) % 4);
      mask[idx] |= (1 << bit);
      const dim = DIM_CONFIG[this.dimIdx[i]];
      const val = state?.[dim.key] ?? 0.5;
      const hsl = dimHSL(dim, val, state);
      const { r, g, b } = hslToRgb(hsl.h, hsl.s, hsl.l);
      accR[idx] += r; accG[idx] += g; accB[idx] += b;
      cnt[idx] += 1;
    }

    const reset = '\x1B[0m';
    const bg = globalHSL(state);
    const bgStr = bgAnsi(bg.h, bg.s, bg.l);
    let frame = '\x1B[1;1H' + bgStr;

    for (let row = 0; row < cellRows; row++) {
      for (let col = 0; col < cellCols; col++) {
        const idx = row * cellCols + col;
        const m = mask[idx];
        if (m) {
          const c = cnt[idx] || 1;
          frame += `\x1B[38;5;${rgbToAnsi256(Math.round(accR[idx] / c), Math.round(accG[idx] / c), Math.round(accB[idx] / c))}m`;
          frame += String.fromCharCode(0x2800 + m);
        } else {
          frame += ' ';
        }
      }
      if (row < cellRows - 1) frame += '\n';
    }
    frame += reset;

    if (opts.tideWaveform) {
      const wf = opts.tideWaveform;
      const step = Math.max(1, Math.floor(wf.length / 12));
      const binned = [];
      for (let i = 0; i < wf.length; i += step) {
        const slice = wf.slice(i, i + step);
        binned.push(slice.reduce((s, v) => s + v, 0) / slice.length);
      }
      const waveStr = binned.map(v => WAVE_CHARS[Math.min(7, Math.floor(v * 8))]).join('');
      frame += `\n  Tide: ${reset}${waveStr}`;
      if (opts.tidePeak !== undefined) frame += `  peak:${opts.tidePeak}:00  flow:${opts.tideFlow}:00`;
    }

    if (opts.verbose) {
      frame += '\n' + DIM_CONFIG.map(d => {
        const v = state?.[d.key] ?? 0.5;
        const hsl = dimHSL(d, v, state);
        const bar = '\u2588'.repeat(Math.round(v * 8)) + '\u2591'.repeat(8 - Math.round(v * 8));
        return `${fgAnsi(hsl.h, hsl.s, hsl.l)}${d.label} ${bar}${reset}`;
      }).join('  ');
      const spoon = state?.spoon ?? '--';
      frame += `\n  Spoons: ${spoon}/5 ${state?.spoon_label ?? ''}`;
      if (state?.session_hours) frame += ` | Session: ${state.session_hours.toFixed(1)}h`;
    }

    return frame;
  }
}

const BRAILLE = ['\u2800', '\u2801', '\u2803', '\u2807', '\u280F', '\u281F', '\u283F', '\u287F', '\u28FF'];

function renderCompact(state, opts = {}) {
  if (!state) return 'No cognitive state data available.';
  const breath = opts.breath || 0;
  const verbose = opts.verbose || false;
  const reset = '\x1B[0m';

  const line = DIM_CONFIG.map(d => {
    const v = typeof state[d.key] === 'number' ? state[d.key] : 0.5;
    const hsl = dimHSL(d, v, state);
    const l = Math.max(20, Math.min(60, hsl.l + breath * 10));
    return `${fgAnsi(hsl.h, hsl.s, l)}${BRAILLE[Math.min(8, Math.max(0, Math.round(v * 8)))]}${reset}`;
  }).join(' ');

  if (!verbose) return line;

  const labels = DIM_CONFIG.map(d => ` ${d.label} `).join(' ');
  const bars = DIM_CONFIG.map(d => {
    const v = typeof state[d.key] === 'number' ? state[d.key] : 0.5;
    const hsl = dimHSL(d, v, state);
    const bar = '\u2588'.repeat(Math.round(v * 8)) + '\u2591'.repeat(8 - Math.round(v * 8));
    return `${fgAnsi(hsl.h, hsl.s, hsl.l)}${bar}${reset}`;
  }).join(' ');

  const spoon = state.spoon || 4;
  const sl = state.spoon_label || 'UNKNOWN';
  const session = state.session_hours ? ` | Session: ${state.session_hours.toFixed(1)}h` : '';

  return `${line}\n${labels}\n${bars}\n  Spoons: ${spoon}/5 ${sl}${session}`;
}

export function renderAura(state, opts = {}) {
  if (opts.compact) return renderCompact(state, opts);
  const cols = opts.cols || 80;
  const rows = opts.rows || 24;
  const ps = new ParticleSystem(cols, rows);
  ps.update(0.01, state);
  return ps.render(state, opts);
}

export function animateAura(opts = {}) {
  if (opts.compact) {
    let state = readState();
    process.stdout.write('\x1B[?1049h\x1B[?25l');
    const cleanup = () => {
      process.stdout.write('\x1B[?25h\x1B[?1049l\x1B[0m\n');
      process.exit(0);
    };
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    let lastRead = 0;
    const tick = () => {
      const now = Date.now();
      if (now - lastRead > 2000) {
        state = readState();
        lastRead = now;
      }
      const breath = Math.sin(now / 1000 * Math.PI / 3) * 0.15;
      const frame = renderCompact(state, { verbose: opts.verbose, breath });
      process.stdout.write('\x1B[H' + frame + '\x1B[J');
      setTimeout(tick, 100);
    };
    tick();
    return;
  }

  const currentState = readState();
  const cols = process.stdout.columns || 80;
  const rows = process.stdout.rows || 24;
  const ps = new ParticleSystem(cols, rows);
  let lastFrame = performance.now();

  process.stdout.write('\x1B[?1049h\x1B[?25l');
  const cleanup = () => {
    process.stdout.write('\x1B[?25h\x1B[?1049l\x1B[0m\n');
    process.exit(0);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  let state = currentState;
  let lastRead = Date.now();
  let tideData = null;
  let lastTideRead = 0;

  const tick = () => {
    const now = performance.now();
    const dt = Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;

    if (Date.now() - lastRead > 2000) {
      state = readState() || state;
      lastRead = Date.now();
    }

    if (Date.now() - lastTideRead > 5000) {
      try {
        if (existsSync(TIDE_PATH)) {
          const tide = JSON.parse(readFileSync(TIDE_PATH, 'utf-8'));
          if (tide.temporal_model?.hourly) {
            const counts = tide.temporal_model.hourly.map(h => h.events);
            const max = Math.max(...counts, 1);
            tideData = {
              waveform: counts.map(c => c / max),
              peak: tide.patterns?.peak_activity_hour,
              flow: tide.patterns?.peak_flow_hour,
            };
          }
        }
      } catch {}
      lastTideRead = Date.now();
    }

    ps.update(dt, state);
    const renderOpts = { ...opts };
    if (tideData) {
      renderOpts.tideWaveform = tideData.waveform;
      renderOpts.tidePeak = tideData.peak;
      renderOpts.tideFlow = tideData.flow;
    }
    const frame = ps.render(state, renderOpts);
    process.stdout.write('\x1B[H' + frame);
    setTimeout(tick, Math.max(10, FRAME_MS - (performance.now() - now)));
  };
  setTimeout(tick, 50);
}

export function captureAura(opts = {}) {
  const state = readState();
  let tideRenderOpts = {};
  try {
    if (existsSync(TIDE_PATH)) {
      const tide = JSON.parse(readFileSync(TIDE_PATH, 'utf-8'));
      if (tide.temporal_model?.hourly) {
        const counts = tide.temporal_model.hourly.map(h => h.events);
        const max = Math.max(...counts, 1);
        tideRenderOpts.tideWaveform = counts.map(c => c / max);
        tideRenderOpts.tidePeak = tide.patterns?.peak_activity_hour;
        tideRenderOpts.tideFlow = tide.patterns?.peak_flow_hour;
      }
    }
  } catch {}
  const frame = renderAura(state, { verbose: true, compact: opts.compact, ...tideRenderOpts });
  const cleaned = frame.replace(/\x1B\[[0-9;?]*[A-Za-z]/g, '');
  const outPath = opts.output || '/tmp/phos-aura-frame.txt';
  writeFileSync(outPath, cleaned + '\n', 'utf-8');
  return outPath;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opts = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    compact: args.includes('--compact') || args.includes('-c'),
  };

  if (args.includes('--once') || args.includes('-1')) {
    const state = readState();
    console.log(renderAura(state, opts));
  } else if (args.includes('--share') || args.includes('-s')) {
    const si = args.findIndex(a => a === '--share' || a === '-s');
    const outPath = (si + 1 < args.length && !args[si + 1].startsWith('-')) ? args[si + 1] : undefined;
    const path = captureAura({ output: outPath, ...opts });
    console.log(`Aura frame saved to ${path}`);
  } else {
    animateAura(opts);
  }
}
