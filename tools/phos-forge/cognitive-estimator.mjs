import { readFileSync, existsSync, writeFileSync, appendFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPOON_PATH = '/home/p31/P31-local-workspace/spoon-state.json';
const EVENTS_PATH = '/tmp/phos-forge/events.jsonl';
const STATE_OUTPUT = '/tmp/phos-cognitive-state.json';
const BUS_PATH = new URL('bus.mjs', import.meta.url).pathname;
const LOG_DIR = dirname(EVENTS_PATH);

const DIMS = ['cognitive_load', 'fatigue', 'flow', 'creativity', 'stress'];
const PID_K = { Kp: 0.4, Ki: 0.1, Kd: 0.05 };

let integral = { cognitive_load: 0, fatigue: 0, flow: 0, creativity: 0, stress: 0 };
let prevError = { cognitive_load: 0, fatigue: 0, flow: 0, creativity: 0, stress: 0 };
let lastEstimate = null;
let sessionStart = Date.now();

function getSpoonLevel() {
  try {
    const data = JSON.parse(readFileSync(SPOON_PATH, 'utf-8'));
    return typeof data.level === 'number' ? data.level : 4;
  } catch {
    return 4;
  }
}

function getRecentEvents(limit = 200) {
  if (!existsSync(EVENTS_PATH)) return [];
  const content = readFileSync(EVENTS_PATH, 'utf-8').trim();
  if (!content) return [];
  return content.split('\n').filter(Boolean).slice(-limit).map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

function extractFeatures(events) {
  const now = Date.now();
  const window5 = events.filter(e => now - new Date(e.timestamp).getTime() < 5 * 60 * 1000);
  const window30 = events.filter(e => now - new Date(e.timestamp).getTime() < 30 * 60 * 1000);

  const freq5 = window5.length / 5;
  const freq30 = window30.length / 30;

  const errorEvents = events.filter(e => e.type?.includes('fail') || e.type?.includes('error'));
  const errorRate = errorEvents.length / Math.max(events.length, 1);

  const deployEvents = events.filter(e => e.type?.includes('deploy'));
  const yardEvents = events.filter(e => e.type?.includes('yardmaster'));

  const typeSet = new Set(events.map(e => e.type));
  const typeDiversity = typeSet.size / Math.max(events.length, 1);

  const errorRateValues = errorEvents.map(e => {
    const detail = e.payload?.detail || '';
    const m = detail.match(/([\d.]+)/);
    return m ? parseFloat(m[1]) : 0;
  });
  const avgErrorRate = errorRateValues.length > 0
    ? errorRateValues.reduce((a, b) => a + b, 0) / errorRateValues.length
    : 0;

  const lastEvent = events[events.length - 1];
  const lastEventDelta = lastEvent ? (now - new Date(lastEvent.timestamp).getTime()) / 1000 : 300;

  const hour = new Date().getHours();
  const circadianFatigue = hour < 6 ? 0.8 : hour < 9 ? 0.3 : hour < 12 ? 0.1 : hour < 14 ? 0.3 : hour < 17 ? 0.2 : hour < 20 ? 0.4 : hour < 23 ? 0.6 : 0.9;

  const sessionHours = (now - sessionStart) / (1000 * 60 * 60);
  const sessionFatigue = Math.min(sessionHours / 8, 1) * 0.5;

  return {
    freq5, freq30, errorRate, avgErrorRate,
    typeDiversity, lastEventDelta,
    circadianFatigue, sessionFatigue,
    deployCount: deployEvents.length,
    yardCount: yardEvents.length,
  };
}

function computeTargets(spoon, features) {
  const spoonNorm = 1 - (spoon / 5);

  const cognitive_load = Math.min(1, Math.max(0,
    0.3 * spoonNorm +
    0.3 * Math.min(features.freq5 / 10, 1) +
    0.2 * Math.min(features.lastEventDelta / 60, 1) +
    0.2 * features.sessionFatigue
  ));

  const fatigue = Math.min(1, Math.max(0,
    0.25 * spoonNorm +
    0.25 * features.circadianFatigue +
    0.25 * features.sessionFatigue +
    0.25 * Math.min(features.freq30 / 5, 1)
  ));

  const stress = Math.min(1, Math.max(0,
    0.35 * features.errorRate +
    0.35 * Math.min(features.avgErrorRate / 5, 1) +
    0.15 * spoonNorm +
    0.15 * features.sessionFatigue
  ));

  const flow = Math.min(1, Math.max(0,
    0.4 * Math.min(features.freq5 / 8, 1) +
    0.3 * (1 - features.errorRate) +
    0.2 * features.typeDiversity +
    0.1 * (1 - features.circadianFatigue)
  ));

  const creativity = Math.min(1, Math.max(0,
    0.35 * features.typeDiversity +
    0.25 * (1 - features.circadianFatigue) +
    0.2 * Math.min(features.deployCount / 5, 1) +
    0.2 * (1 - spoonNorm)
  ));

  return { cognitive_load, fatigue, flow, creativity, stress };
}

function pidUpdate(target, dim) {
  const error = target - (lastEstimate?.[dim] ?? target);
  integral[dim] = Math.max(-1, Math.min(1, integral[dim] + error));
  const derivative = error - prevError[dim];
  prevError[dim] = error;

  const correction = PID_K.Kp * error + PID_K.Ki * integral[dim] + PID_K.Kd * derivative;
  const raw = (lastEstimate?.[dim] ?? target) + correction;
  return Math.min(1, Math.max(0, raw));
}

export function estimate() {
  const spoon = getSpoonLevel();
  const events = getRecentEvents(200);
  const features = extractFeatures(events);
  const targets = computeTargets(spoon, features);

  const state = {};
  for (const dim of DIMS) {
    state[dim] = pidUpdate(targets[dim], dim);
  }

  state.spoon = spoon;
  state.timestamp = new Date().toISOString();
  state.session_hours = (Date.now() - sessionStart) / (1000 * 60 * 60);
  state.spoon_label = spoonLabel(spoon);

  const changed = lastEstimate && DIMS.some(d => Math.abs(state[d] - lastEstimate[d]) > 0.1);

  lastEstimate = state;

  mkdirSync(dirname(STATE_OUTPUT), { recursive: true });
  writeFileSync(STATE_OUTPUT, JSON.stringify(state, null, 2));

  if (changed) {
    busEmit('cognitive.state_changed', {
      state: DIMS.reduce((acc, d) => { acc[d] = Math.round(state[d] * 100) / 100; return acc; }, {}),
      spoon,
    });
  }

  return state;
}

function spoonLabel(level) {
  if (level >= 5) return 'FLOURISHING';
  if (level === 4) return 'HEALTHY';
  if (level === 3) return 'STABLE';
  if (level === 2) return 'UNSTABLE';
  if (level === 1) return 'CRITICAL';
  return 'EMPTY';
}

function busEmit(type, payload) {
  const event = {
    type,
    payload,
    timestamp: new Date().toISOString(),
    id: crypto.randomUUID(),
  };
  try {
    appendFileSync(EVENTS_PATH, JSON.stringify(event) + '\n');
  } catch {}
}

export function getState() {
  if (lastEstimate) return lastEstimate;
  try {
    if (existsSync(STATE_OUTPUT)) {
      return JSON.parse(readFileSync(STATE_OUTPUT, 'utf-8'));
    }
  } catch {}
  return {
    cognitive_load: 0.5, fatigue: 0.3, flow: 0.6,
    creativity: 0.5, stress: 0.2,
    spoon: 4, timestamp: new Date().toISOString(),
    session_hours: 0, spoon_label: 'HEALTHY',
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cmd = process.argv[2];
  if (cmd === 'estimate') {
    const state = estimate();
    console.log(JSON.stringify(state, null, 2));
  } else if (cmd === 'status' || cmd === 'state') {
    const state = getState();
    console.log(`Cognitive State (as of ${state.timestamp}):`);
    for (const dim of DIMS) {
      const val = state[dim];
      const bar = '█'.repeat(Math.round(val * 10)) + '░'.repeat(10 - Math.round(val * 10));
      console.log(`  ${dim.padEnd(16)} ${bar} ${(val * 100).toFixed(0)}%`);
    }
    console.log(`  ${'spoon'.padEnd(16)} Level ${state.spoon}/5 — ${state.spoon_label}`);
    console.log(`  ${'session'.padEnd(16)} ${state.session_hours.toFixed(1)} hours`);
  } else if (cmd === 'watch') {
    console.log('Cognitive estimator watching (every 30s)...');
    estimate();
    setInterval(() => {
      const s = estimate();
      const dims = DIMS.map(d => `${d.slice(0, 3)}:${(s[d] * 100).toFixed(0)}%`).join(' ');
      console.log(`[${s.timestamp.slice(11, 19)}] ${dims} | spoon:${s.spoon}`);
    }, 30000);
  } else {
    console.log(`PHOS Cognitive Estimator

Usage:
  phos-cog estimate     Run one estimate cycle and print state
  phos-cog state        Show current estimated cognitive state
  phos-cog watch        Watch state in real-time (every 30s)
`);
  }
}
