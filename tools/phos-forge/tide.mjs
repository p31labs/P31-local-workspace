#!/usr/bin/env node

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVENTS_PATH = '/tmp/phos-forge/events.jsonl';
const STATE_PATH = '/tmp/phos-cognitive-state.json';
const TIDE_OUTPUT = '/tmp/phos-tide-state.json';
const NUM_BINS = 24;
const MAX_WINDOW = 10080;

let bins = new Array(NUM_BINS).fill(null).map(() => ({ events: 0, errors: 0, warnings: 0, cycles: 0 }));
let rollingWindow = [];
let lastFileSize = 0;
let totalEvents = 0;
let startTime = Date.now();

const CATS = {
  error: /error|fail|crash|panic/i,
  warning: /warn|slow|timeout|degraded/i,
  cycle: /cycle|tick|heartbeat|nexus\./i,
};

function cat(type) {
  for (const [k, re] of Object.entries(CATS)) { if (re.test(type)) return k; }
  return 'other';
}

function hourOf(ts) {
  try { const d = new Date(ts); return isNaN(d.getTime()) ? null : d.getHours(); } catch { return null; }
}

function readNewEvents() {
  try {
    if (!existsSync(EVENTS_PATH)) return [];
    const raw = readFileSync(EVENTS_PATH, 'utf-8');
    if (raw.length <= lastFileSize) return [];
    const slice = raw.slice(lastFileSize);
    lastFileSize = raw.length;
    return slice.trim().split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch { return []; }
}

function processEvents(events) {
  for (const ev of events) {
    totalEvents++;
    const h = hourOf(ev.timestamp);
    if (h === null || h < 0 || h > 23) continue;
    const b = bins[h];
    b.events++;
    const c = cat(ev.type || '');
    if (c === 'error') b.errors++;
    else if (c === 'warning') b.warnings++;
    else if (c === 'cycle') b.cycles++;
    rollingWindow.push({ hour: h, type: ev.type, cat: c, ts: ev.timestamp });
    if (rollingWindow.length > MAX_WINDOW) rollingWindow.shift();
  }
}

function detectPatterns() {
  const patterns = {};
  let maxEv = 0, peakH = 0;
  for (let h = 0; h < NUM_BINS; h++) {
    if (bins[h].events > maxEv) { maxEv = bins[h].events; peakH = h; }
  }
  patterns.peak_activity_hour = peakH;

  let minErr = Infinity, flowH = 0;
  for (let h = 0; h < NUM_BINS; h++) {
    if (bins[h].events > 5 && bins[h].errors < minErr) { minErr = bins[h].errors; flowH = h; }
  }
  patterns.peak_flow_hour = flowH;

  const avgErr = bins.reduce((s, b) => s + b.errors, 0) / NUM_BINS || 0;
  patterns.error_prone_hours = bins.map((b, h) => ({ b, h })).filter(x => x.b.events > 3 && x.b.errors > avgErr * 2 && x.b.errors >= 2).map(x => x.h);

  patterns.silence_windows = [];
  let si = null;
  for (let h = 0; h < NUM_BINS; h++) {
    if (bins[h].events < 3) { if (si === null) si = h; }
    else { if (si !== null) { if (h - si >= 2) patterns.silence_windows.push({ start: si, end: h - 1 }); si = null; } }
  }
  if (si !== null && NUM_BINS - si >= 2) patterns.silence_windows.push({ start: si, end: NUM_BINS - 1 });

  const prec = {};
  for (let i = 1; i < rollingWindow.length; i++) {
    if (rollingWindow[i].cat === 'error') {
      const look = Math.max(0, i - 5);
      for (let j = look; j < i; j++) { prec[rollingWindow[j].type] = (prec[rollingWindow[j].type] || 0) + 1; }
    }
  }
  patterns.cascade_precursors = Object.entries(prec).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([type, count]) => ({ type, count }));

  return patterns;
}

function getCurrent() {
  const now = new Date();
  const ch = now.getHours();
  const bin = bins[ch];
  const ph = (ch + 23) % NUM_BINS;
  const ed = bin.events - bins[ph].events;
  return {
    hour_bin: ch,
    events_this_hour: bin.events,
    errors_this_hour: bin.errors,
    error_rate: bin.events > 0 ? +(bin.errors / bin.events).toFixed(3) : 0,
    activity_trend: ed > 5 ? 'rising' : ed < -5 ? 'falling' : 'stable',
    uptime_hours: +((Date.now() - startTime) / 3600000).toFixed(1),
  };
}

function buildModel() {
  let cs = null;
  try { if (existsSync(STATE_PATH)) cs = JSON.parse(readFileSync(STATE_PATH, 'utf-8')); } catch {}

  const patterns = detectPatterns();
  const current = getCurrent();
  const now = new Date();

  const hourly = bins.map((b, i) => ({
    hour: i, events: b.events, errors: b.errors,
    warnings: b.warnings, cycles: b.cycles,
    error_rate: b.events > 0 ? +(b.errors / b.events).toFixed(3) : 0,
  }));

  const ch = now.getHours();
  const shifted = [...hourly.slice(ch + 1), ...hourly.slice(0, ch + 1)];

  return {
    temporal_model: {
      generated: now.toISOString(),
      hourly: shifted,
      total_events: totalEvents,
      window_events: rollingWindow.length,
    },
    patterns,
    current,
    cognitive_state: cs ? {
      cognitive_load: cs.cognitive_load, fatigue: cs.fatigue, flow: cs.flow,
      creativity: cs.creativity, stress: cs.stress,
    } : null,
  };
}

export function tide() {
  const evs = readNewEvents();
  if (evs.length > 0) processEvents(evs);
  const model = buildModel();
  try { mkdirSync(dirname(TIDE_OUTPUT), { recursive: true }); writeFileSync(TIDE_OUTPUT, JSON.stringify(model, null, 2)); } catch {}
  return model;
}

export function getTideState() {
  try { if (!existsSync(TIDE_OUTPUT)) return null; return JSON.parse(readFileSync(TIDE_OUTPUT, 'utf-8')); } catch { return null; }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cmd = process.argv[2] || 'status';

  if (cmd === 'status') {
    tide();
    const s = getTideState();
    if (!s) { console.log('Tide: no data yet'); process.exit(0); }
    console.log(`Tide — Temporal Pattern Learning`);
    console.log(`  Total events: ${s.temporal_model.total_events}`);
    console.log(`  Window:       ${s.temporal_model.window_events} events`);
    console.log(`  Uptime:       ${s.current.uptime_hours}h`);
    console.log(`  Current hour: ${s.current.hour_bin}:00 (${s.current.events_this_hour} ev, ${s.current.errors_this_hour} err, trend: ${s.current.activity_trend})`);
    console.log(`  Peak hour:    ${s.patterns.peak_activity_hour}:00`);
    console.log(`  Flow hour:    ${s.patterns.peak_flow_hour}:00`);
    if (s.patterns.error_prone_hours.length > 0) console.log(`  Error hours:  ${s.patterns.error_prone_hours.map(h => h + ':00').join(', ')}`);
    if (s.patterns.silence_windows.length > 0) console.log(`  Silence:      ${s.patterns.silence_windows.map(w => w.start + ':00-' + w.end + ':00').join(', ')}`);
    if (s.patterns.cascade_precursors.length > 0) console.log(`  Precursors:   ${s.patterns.cascade_precursors.map(p => `${p.type} (${p.count}x)`).join(', ')}`);
  } else if (cmd === 'watch') {
    console.log(`Tide — watching event bus (Ctrl+C to stop)`);
    const loop = () => {
      const m = tide();
      const c = m.current;
      process.stdout.write(`\r[${new Date().toISOString().slice(11, 19)}] ev:${m.temporal_model.total_events} hr:${c.hour_bin}:00 (${c.events_this_hour}) err:${c.errors_this_hour} ${c.activity_trend}  `);
      setTimeout(loop, 5000);
    };
    loop();
  } else if (cmd === 'reset') {
    bins = new Array(NUM_BINS).fill(null).map(() => ({ events: 0, errors: 0, warnings: 0, cycles: 0 }));
    rollingWindow = []; totalEvents = 0; lastFileSize = 0; startTime = Date.now();
    tide();
    console.log('Tide: reset complete');
  } else if (cmd === 'hourly') {
    tide();
    const s = getTideState();
    if (!s) { console.log('Tide: no data'); process.exit(0); }
    console.log('Hour│Events Err Wrn Cyc│Rate  ');
    console.log('────┼──────────────────┼──────');
    for (const h of s.temporal_model.hourly) {
      const bar = '█'.repeat(Math.min(Math.round(h.events / 5), 20));
      console.log(`${String(h.hour).padStart(2)}:00 │${String(h.events).padStart(4)} ${String(h.errors).padStart(3)} ${String(h.warnings).padStart(3)} ${String(h.cycles).padStart(3)}│${h.error_rate.toFixed(2)} ${bar}`);
    }
  } else {
    console.log(`PHOS Tide — Temporal Pattern Learning

Detects circadian rhythms, error tides, flow windows, and cascade precursors.

Usage:
  phos tide status     Show temporal model and detected patterns
  phos tide watch      Live-updating display (5s interval)
  phos tide reset      Clear all temporal data and restart
  phos tide hourly     Per-hour breakdown with bar chart
`);
  }
}
