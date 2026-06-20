#!/usr/bin/env node

import { readFileSync, existsSync, appendFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVENTS_PATH = '/tmp/phos-forge/events.jsonl';
const STATE_PATH = '/tmp/phos-cognitive-state.json';
const SPOON_PATH = '/home/p31/P31-local-workspace/spoon-state.json';
const HEALER_LOG = '/tmp/phos-forge/healer-log.jsonl';

const PATTERNS = {
  error_cascade: {
    label: 'Error cascade',
    cooldown: 30000,
    check: (events) => {
      const errs = events.filter(e => e.type && (e.type.includes('fail') || e.type.includes('error')));
      return errs.length >= 3 ? { severity: Math.min(errs.length / 10, 1), count: errs.length } : null;
    },
    action: 'emit_cascade_alert',
  },
  high_cognitive_load: {
    label: 'High cognitive load',
    cooldown: 30000,
    check: (events, state) => {
      if (!state) return null;
      const cl = state.cognitive_load || 0;
      return cl > 0.8 ? { severity: (cl - 0.7) * 3 } : null;
    },
    action: 'suggest_regulation',
  },
  bus_silence: {
    label: 'Bus silence anomaly',
    cooldown: 60000,
    check: (events, state, meta) => {
      const uptime = Date.now() - meta.startTime;
      if (uptime < 65000) return null;
      const silence = Date.now() - meta.lastEvent;
      return silence > 60000 ? { severity: Math.min(silence / 300000, 1) } : null;
    },
    action: 'ping_services',
  },
};

let window = [];
let lastEventTime = Date.now();
let lastFileSize = 0;
let cooldowns = {};
let muted = new Set();
let startTime = Date.now();
let tickCount = 0;

function readFileSafely(path) {
  try {
    if (!existsSync(path)) return null;
    return readFileSync(path, 'utf-8');
  } catch { return null; }
}

function readJSON(path) {
  try {
    const content = readFileSafely(path);
    return content ? JSON.parse(content) : null;
  } catch { return null; }
}

function getSpoonLevel() {
  const spoon = readJSON(SPOON_PATH);
  if (spoon && typeof spoon.level === 'number') return spoon.level;
  const state = readJSON(STATE_PATH);
  if (state && typeof state.spoon === 'number') return state.spoon;
  return 4;
}

function appendHealerLog(entry) {
  const e = { ...entry, timestamp: new Date().toISOString(), id: crypto.randomUUID(), reflex: true };
  try {
    mkdirSync(dirname(HEALER_LOG), { recursive: true });
    appendFileSync(HEALER_LOG, JSON.stringify(e) + '\n');
  } catch {}
}

function pollEvents() {
  const content = readFileSafely(EVENTS_PATH);
  if (content) {
    if (content.length > lastFileSize) {
      const newLines = content.slice(lastFileSize).trim().split('\n').filter(Boolean);
      for (const line of newLines) {
        try {
          const ev = JSON.parse(line);
          if (ev && ev.type) {
            window.push(ev);
            lastEventTime = Date.now();
          }
        } catch {}
      }
      lastFileSize = content.length;
    }
  }

  const cutoff = Date.now() - 5000;
  window = window.filter(e => {
    const t = new Date(e.timestamp).getTime();
    return !isNaN(t) && t > cutoff;
  });
  if (window.length > 200) window = window.slice(-200);
}

export function tick() {
  tickCount++;
  pollEvents();

  const state = readJSON(STATE_PATH);
  const meta = { startTime, lastEvent: lastEventTime };
  const results = [];

  for (const [id, pattern] of Object.entries(PATTERNS)) {
    if (muted.has(id)) continue;

    const lastFire = cooldowns[id] || 0;
    if (Date.now() - lastFire < pattern.cooldown) continue;

    try {
      const match = pattern.check(window, state, meta);
      if (match) {
        cooldowns[id] = Date.now();
        const spoon = getSpoonLevel();
        const gateOk = spoon > 2;

        appendHealerLog({
          diagnostic: id,
          label: pattern.label,
          severity: match.severity,
          spoon_level: spoon,
          permitted: gateOk,
          actions_taken: gateOk ? [pattern.action] : ['log_only_blocked_spoon'],
          cooldown_ms: pattern.cooldown,
        });

        results.push({ pattern: id, label: pattern.label, severity: match.severity, permitted: gateOk, action: gateOk ? pattern.action : null });
      }
    } catch {}
  }

  return results;
}

export function getStatus() {
  const now = Date.now();
  const patterns = {};
  for (const [id, pattern] of Object.entries(PATTERNS)) {
    const lastFire = cooldowns[id] || 0;
    patterns[id] = {
      label: pattern.label,
      muted: muted.has(id),
      cooldown_remaining_ms: Math.max(0, pattern.cooldown - (now - lastFire)),
      last_fired: lastFire > 0 ? new Date(lastFire).toISOString() : null,
    };
  }
  return {
    running: true,
    uptime_ms: now - startTime,
    uptime_s: Math.round((now - startTime) / 1000),
    ticks: tickCount,
    window_size: window.length,
    last_event_ago_ms: now - lastEventTime,
    spoon: getSpoonLevel(),
    patterns,
  };
}

export function mutePattern(id) {
  if (!PATTERNS[id]) return false;
  muted.add(id);
  return true;
}

export function unmutePattern(id) {
  if (!PATTERNS[id]) return false;
  muted.delete(id);
  return true;
}

export function getHistory(limit = 20) {
  const content = readFileSafely(HEALER_LOG);
  if (!content) return [];
  return content.trim().split('\n').filter(Boolean).reverse().slice(0, limit).map(l => {
    try { const e = JSON.parse(l); return e.reflex ? e : null; } catch { return null; }
  }).filter(Boolean);
}

export function startArc(opts = {}) {
  const interval = opts.interval || 500;

  const loop = () => {
    tick();
    setTimeout(loop, interval);
  };
  loop();

  return { stop: () => {} };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cmd = process.argv[2];

  if (cmd === 'start') {
    console.log('Reflex Arc — Sub-cycle fast loop');
    console.log('  Patterns:', Object.keys(PATTERNS).join(', '));
    console.log('  Poll interval: 500ms');
    console.log('  Cooldowns: error_cascade=30s, high_cognitive_load=30s, bus_silence=60s');
    console.log('');
    startArc();
    setInterval(() => {
      const s = getStatus();
      const active = Object.entries(s.patterns).filter(([_, p]) => p.cooldown_remaining_ms > 0);
      const line = active.map(([id, p]) => `${id}:${p.cooldown_remaining_ms}ms`).join(' ');
      console.log(`[${new Date().toISOString().slice(11, 19)}] ticks:${s.ticks} window:${s.window_size} silence:${s.last_event_ago_ms}ms spoon:${s.spoon} ${line ? '| ' + line : ''}`);
    }, 5000);
  } else if (cmd === 'status') {
    const s = getStatus();
    console.log(`Reflex Arc Status`);
    console.log(`  Uptime:    ${s.uptime_s}s`);
    console.log(`  Ticks:     ${s.ticks}`);
    console.log(`  Window:    ${s.window_size} events`);
    console.log(`  Silence:   ${s.last_event_ago_ms}ms since last event`);
    console.log(`  Spoon:     ${s.spoon}/5`);
    console.log('');
    for (const [id, p] of Object.entries(s.patterns)) {
      const mute = p.muted ? ' [MUTED]' : '';
      const cooldown = p.cooldown_remaining_ms > 0 ? ` (cooldown: ${p.cooldown_remaining_ms}ms)` : '';
      console.log(`  ${id}: ${p.label}${mute}${cooldown}`);
      if (p.last_fired) console.log(`       last fired: ${p.last_fired}`);
    }
  } else if (cmd === 'mute') {
    const id = process.argv[3];
    if (!id) { console.error('Usage: phos reflex mute <pattern-id>'); process.exit(1); }
    if (mutePattern(id)) console.log(`Muted: ${id}`); else console.error(`Unknown pattern: ${id}`);
  } else if (cmd === 'unmute') {
    const id = process.argv[3];
    if (!id) { console.error('Usage: phos reflex unmute <pattern-id>'); process.exit(1); }
    if (unmutePattern(id)) console.log(`Unmuted: ${id}`); else console.error(`Unknown pattern: ${id}`);
  } else if (cmd === 'history') {
    const limit = parseInt(process.argv[3], 10) || 10;
    const history = getHistory(limit);
    if (!history.length) { console.log('No reflex firings recorded.'); process.exit(0); }
    for (const h of history) {
      const time = (h.timestamp || '').slice(11, 19) || '??:??:??';
      const status = h.permitted ? '⚡' : '⛔';
      console.log(`  ${time} ${status} ${h.label} (${h.diagnostic}) sev:${h.severity?.toFixed(2)} actions:${h.actions_taken?.join(', ') || 'none'}`);
    }
  } else {
    console.log(`PHOS Reflex Arc — Sub-cycle Fast Loop

Patterns:
  error_cascade       ≥3 errors in 5s window (cooldown: 30s)
  high_cognitive_load cognitive_load > 0.8 (cooldown: 30s)
  bus_silence         no events for 60s (cooldown: 60s)

Spoon gating: ≤2 → log only, no execution

Usage:
  phos reflex start         Start the reflex arc daemon
  phos reflex status        Show arc state and pattern cooldowns
  phos reflex mute <id>     Disable a pattern for this session
  phos reflex unmute <id>   Re-enable a pattern
  phos reflex history [n]   Show last N reflex firings
`);
  }
}
