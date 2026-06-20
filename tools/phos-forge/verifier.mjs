#!/usr/bin/env node
// PHOS Verifier — system health & calibration checks
// DeepSeek: verify each check for correctness, edge cases, and race conditions

import { existsSync, readFileSync, statSync, readdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPOON_PATH = '/home/p31/P31-local-workspace/spoon-state.json';
const COG_PATH = '/tmp/phos-cognitive-state.json';
const EVENTS_PATH = '/tmp/phos-forge/events.jsonl';
const KAPPA_PATH = '/tmp/phos-kappa-weights.json';
const TIDE_PATH = '/tmp/phos-tide-state.json';
const CART_PATH = '/tmp/phos-cartographer-index.json';
const LOG_DIR = '/tmp/phos-logbook';
const BRAIN_DIR = '/tmp/phos-brain';
const BUS_SOCK = '/tmp/phos-forge/bus.sock';
const XBINDKEYS_CFG = '/home/p31/.xbindkeysrc';

function readJSON(path) {
  try {
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch { return null; }
}

function ageMinutes(path) {
  try {
    const st = statSync(path);
    return (Date.now() - st.mtimeMs) / 60000;
  } catch { return Infinity; }
}

// ── Checks ──────────────────────────────────────────

function checkSpoon() {
  const d = readJSON(SPOON_PATH);
  if (!d) return { pass: false, detail: 'spoon-state.json not found', level: null };
  if (typeof d.level !== 'number' || d.level < 0 || d.level > 5)
    return { pass: false, detail: `Invalid spoon level: ${d.level}`, level: d.level };
  return { pass: true, detail: `Level ${d.level}/5 — ${d.level >= 3 ? 'HEALTHY' : 'LOW'}`, level: d.level };
}

function checkCognitive() {
  const d = readJSON(COG_PATH);
  if (!d) return { pass: false, detail: 'cognitive state not found' };
  const dims = ['cognitive_load', 'fatigue', 'flow', 'creativity', 'stress'];
  const bounds = dims.filter(k => typeof d[k] !== 'number' || d[k] < 0 || d[k] > 1);
  if (bounds.length > 0)
    return { pass: false, detail: `Out-of-bounds dimensions: ${bounds.join(', ')}` };
  const age = ageMinutes(COG_PATH);
  if (age > 30) return { pass: false, detail: `Stale: ${age.toFixed(0)} min since update` };
  return { pass: true, detail: `Load ${(d.cognitive_load * 100).toFixed(0)}%, flow ${(d.flow * 100).toFixed(0)}%, stress ${(d.stress * 100).toFixed(0)}%, updated ${age.toFixed(0)}m ago`, age };
}

function checkEventBus() {
  if (!existsSync(EVENTS_PATH))
    return { pass: false, detail: 'events.jsonl not found' };
  const raw = readFileSync(EVENTS_PATH, 'utf-8').trim();
  if (!raw) return { pass: false, detail: 'event bus is empty' };
  const lines = raw.split('\n').filter(Boolean);
  const last = lines[lines.length - 1];
  let lastTime = 0;
  try {
    const parsed = JSON.parse(last);
    lastTime = new Date(parsed.timestamp).getTime();
  } catch { return { pass: false, detail: 'cannot parse last event' }; }
  const age = (Date.now() - lastTime) / 1000;
  if (age > 120) return { pass: false, detail: `Bus silent for ${age.toFixed(0)}s` };
  const errors = lines.filter(l => {
    try { return JSON.parse(l).type?.includes('error'); }
    catch { return false; }
  }).length;
  return { pass: true, detail: `${lines.length} events, last ${age.toFixed(0)}s ago, ${errors} errors`, count: lines.length, errors };
}

async function checkKappa() {
  const d = readJSON(KAPPA_PATH);
  if (d && d.weights) {
    const w = d.weights;
    const keys = Object.keys(w);
    const outOfRange = keys.filter(k => typeof w[k] !== 'number' || w[k] < 0 || w[k] > 1);
    if (outOfRange.length > 0)
      return { pass: false, detail: `Weights out of range: ${outOfRange.join(', ')}` };
    return { pass: true, detail: `${keys.length} rules, avg ${(Object.values(w).reduce((a, b) => a + b, 0) / keys.length).toFixed(3)}`, rules: keys.length };
  }
  // Fallback: import kappa module directly
  try {
    const { getWeights } = await import('./kappa.mjs');
    const w = getWeights();
    const weights = w.weights || {};
    const keys = Object.keys(weights);
    if (keys.length === 0) return { pass: false, detail: 'no weight entries' };
    return { pass: true, detail: `${keys.length} rules, trials: ${w.total_trials || 0}`, rules: keys.length };
  } catch (e) {
    return { pass: false, detail: `kappa check failed: ${e.message}` };
  }
}

function checkCartographer() {
  const d = readJSON(CART_PATH);
  if (!d) return { pass: false, detail: 'cartographer index not found' };
  const age = ageMinutes(CART_PATH);
  if (age > 120) return { pass: false, detail: `Index stale: ${age.toFixed(0)} min old` };
  const total = d.totalDocs || 0;
  const idfEntries = d.idf ? Object.keys(d.idf).length : 0;
  if (total === 0) return { pass: false, detail: 'index has 0 files' };
  return { pass: true, detail: `${total} files, ${idfEntries} terms, ${age.toFixed(0)}m old`, files: total };
}

function checkTide() {
  const d = readJSON(TIDE_PATH);
  if (!d) return { pass: false, detail: 'tide state not found' };
  const events = d.temporal_model?.total_events || 0;
  if (events === 0) return { pass: false, detail: 'no events tracked' };
  const peak = d.patterns?.peak_activity_hour;
  return { pass: true, detail: `${events} events, peak at ${peak}:00`, events };
}

function checkLogbook() {
  const today = new Date().toISOString().slice(0, 10);
  const path = join(LOG_DIR, `${today}.md`);
  if (!existsSync(path)) return { pass: false, detail: 'no logbook entry for today' };
  const size = statSync(path).size;
  if (size < 50) return { pass: false, detail: `logbook entry too small: ${size}B` };
  return { pass: true, detail: `${(size / 1024).toFixed(1)}KB today` };
}

async function checkXbindkeys() {
  try {
    const { execSync } = await import('child_process');
    const out = execSync('pgrep -a xbindkeys', { encoding: 'utf-8', timeout: 3000 });
    if (!out.trim()) return { pass: false, detail: 'xbindkeys not running' };
    return { pass: true, detail: `Running: ${out.trim()}` };
  } catch {
    return { pass: false, detail: 'xbindkeys not running (pgrep failed)' };
  }
}

async function checkGitDrift(repoRoot) {
  try {
    const { execSync } = await import('child_process');
    const out = execSync('git diff --stat', { cwd: repoRoot, encoding: 'utf-8', timeout: 5000 });
    const lines = out.trim().split('\n').filter(Boolean);
    if (lines.length === 0) return { pass: true, detail: 'clean working tree' };
    return { pass: false, detail: `${lines.length} files modified`, files: lines.map(l => l.split('|')[0].trim()) };
  } catch {
    return { pass: false, detail: 'git check failed (not a repo?)' };
  }
}

// ── Runner ──────────────────────────────────────────

export async function verifyAll(repoRoot) {
  const checks = {
    spoon: checkSpoon(),
    cognitive: checkCognitive(),
    event_bus: checkEventBus(),
    kappa: await checkKappa(),
    cartographer: checkCartographer(),
    tide: checkTide(),
    logbook: checkLogbook(),
    xbindkeys: await checkXbindkeys(),
    git: await checkGitDrift(repoRoot),
  };

  const passed = Object.entries(checks).filter(([, v]) => v.pass).length;
  const total = Object.keys(checks).length;

  return {
    timestamp: new Date().toISOString(),
    summary: `${passed}/${total} checks passed`,
    allPassed: passed === total,
    checks,
  };
}

// ── CLI ─────────────────────────────────────────────

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const repoRoot = resolve(join(__dirname, '../..'));
  const result = await verifyAll(repoRoot);
  console.log(`PHOS Verifier — ${result.summary}`);
  console.log('');
  for (const [name, c] of Object.entries(result.checks)) {
    const icon = c.pass ? '✅' : '❌';
    console.log(`  ${icon} ${name.padEnd(14)} ${c.detail}`);
  }
  console.log('');
  process.exit(result.allPassed ? 0 : 1);
}
