#!/usr/bin/env node

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HEALER_LOG = '/tmp/phos-forge/healer-log.jsonl';
const STATE_PATH = '/tmp/phos-cognitive-state.json';
const KAPPA_WEIGHTS = '/tmp/phos-kappa-weights.json';
const STATE_HISTORY_PATH = '/tmp/phos-kappa-history.json';

const DEFAULTS = {
  high_cognitive_load: 0.5, sustained_high_load: 0.5, low_spoon: 0.5,
  error_rate: 0.5, bus_silence: 0.5, excessive_fatigue: 0.5,
  low_flow: 0.5, high_stress: 0.5, error_cascade: 0.5,
};

const STATE_KEYS = ['cognitive_load', 'fatigue', 'flow', 'creativity', 'stress'];

function readJSON(path) {
  try { if (!existsSync(path)) return null; return JSON.parse(readFileSync(path, 'utf-8')); } catch { return null; }
}

function readWeights() {
  const data = readJSON(KAPPA_WEIGHTS);
  if (data && data.weights) return data;
  return { weights: { ...DEFAULTS }, total_trials: 0, last_update: null };
}

function saveWeights(w) {
  try { mkdirSync(dirname(KAPPA_WEIGHTS), { recursive: true }); writeFileSync(KAPPA_WEIGHTS, JSON.stringify(w, null, 2)); } catch {}
}

function readStateHistory() {
  return readJSON(STATE_HISTORY_PATH) || [];
}

function saveStateHistory(h) {
  try { writeFileSync(STATE_HISTORY_PATH, JSON.stringify(h)); } catch {}
}

function getCurrentState() {
  const s = readJSON(STATE_PATH);
  if (!s) return null;
  const v = {};
  for (const k of STATE_KEYS) v[k] = typeof s[k] === 'number' ? s[k] : null;
  return v;
}

function trailingAvg(history) {
  if (history.length === 0) return null;
  const avg = {};
  for (const k of STATE_KEYS) {
    const vals = history.map(h => h[k]).filter(v => v !== null);
    avg[k] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }
  return avg;
}

function computeDelta(current, baseline) {
  if (!current || !baseline) return 0;
  let score = 0;
  if (current.cognitive_load !== null && baseline.cognitive_load !== null)
    score -= (current.cognitive_load - baseline.cognitive_load); // lower load = good
  if (current.fatigue !== null && baseline.fatigue !== null)
    score -= (current.fatigue - baseline.fatigue); // lower fatigue = good
  if (current.flow !== null && baseline.flow !== null)
    score += (current.flow - baseline.flow); // higher flow = good
  if (current.creativity !== null && baseline.creativity !== null)
    score += (current.creativity - baseline.creativity); // higher creativity = good
  if (current.stress !== null && baseline.stress !== null)
    score -= (current.stress - baseline.stress); // lower stress = good
  return score / STATE_KEYS.length;
}

let lastLogIndex = 0;

function readNewHealerEntries() {
  try {
    if (!existsSync(HEALER_LOG)) return [];
    const raw = readFileSync(HEALER_LOG, 'utf-8');
    const lines = raw.trim().split('\n').filter(Boolean);
    if (lines.length <= lastLogIndex) return [];
    const newLines = lines.slice(lastLogIndex);
    lastLogIndex = lines.length;
    return newLines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch { return []; }
}

function updateWeight(weight, delta) {
  if (delta > 0.02) {
    return Math.min(1, weight + 0.05 * (1 - weight));
  } else if (delta < -0.02) {
    return Math.max(0.1, weight - 0.05 * weight);
  }
  return weight;
}

export function learn() {
  const history = readStateHistory();
  const current = getCurrentState();
  if (!current) return { new_learnings: 0, delta: null, weights: readWeights() };

  history.push({ ...current, timestamp: Date.now() });
  if (history.length > 10) history.shift();
  saveStateHistory(history);

  const baseline = trailingAvg(history.slice(0, -1));
  const delta = computeDelta(current, baseline);

  const entries = readNewHealerEntries();
  const actionable = entries.filter(e => e.permitted && e.actions_taken?.length > 0 && e.diagnostic);
  if (actionable.length === 0) return { new_learnings: 0, delta, weights: readWeights() };

  const w = readWeights();

  for (const entry of actionable) {
    const diag = entry.diagnostic;
    if (!w.weights[diag]) continue;
    const oldW = w.weights[diag];
    w.weights[diag] = updateWeight(oldW, delta);
    w.total_trials = (w.total_trials || 0) + 1;
    w.last_update = new Date().toISOString();
  }

  if (actionable.length > 0) saveWeights(w);

  return {
    new_learnings: actionable.length,
    delta: Math.round(delta * 1000) / 1000,
    adjusted: actionable.map(e => ({ diagnostic: e.diagnostic, actions: e.actions_taken })),
    weights: w,
  };
}

export function getWeights() { return readWeights(); }

export function resetWeights() {
  lastLogIndex = 0;
  const w = { weights: { ...DEFAULTS }, total_trials: 0, last_update: null };
  saveWeights(w);
  saveStateHistory([]);
  return w;
}

export function getAdjustedDiagnostics(baseDiagnostics) {
  const { weights } = readWeights();
  return baseDiagnostics.map(d => {
    const w = weights[d.id];
    if (!w) return { ...d, kappa_weight: 0.5, kappa_mult: 1 };
    // weight 1.0 → threshold multiplier 0.7 (fires ~30% earlier)
    // weight 0.1 → threshold multiplier 1.24 (fires ~24% later)
    const mult = 1 + (0.5 - w) * 0.6;
    return { ...d, kappa_weight: w, kappa_mult: +mult.toFixed(3) };
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cmd = process.argv[2] || 'status';

  if (cmd === 'learn') {
    const result = learn();
    console.log(`Kappa — learn cycle`);
    console.log(`  New learnings: ${result.new_learnings}`);
    console.log(`  State delta:   ${result.delta !== null ? result.delta.toFixed(3) : 'N/A'}`);
    console.log(`  Total trials:  ${result.weights.total_trials || 0}`);
    if (result.adjusted?.length > 0) {
      console.log(`  Adjusted rules:`);
      for (const a of result.adjusted) console.log(`    ${a.diagnostic} → ${a.actions.join(', ')}`);
    }
    if (result.weights.last_update) console.log(`  Last update:   ${result.weights.last_update}`);
  } else if (cmd === 'weights') {
    const w = readWeights();
    console.log(`Kappa — Outcome Weights`);
    console.log(`  Total trials: ${w.total_trials || 0}`);
    console.log(`  Last update:  ${w.last_update || 'never'}`);
    console.log('');
    const sorted = Object.entries(w.weights).sort((a, b) => b[1] - a[1]);
    for (const [id, weight] of sorted) {
      const bar = '\u2588'.repeat(Math.round(weight * 10)) + '\u2591'.repeat(10 - Math.round(weight * 10));
      console.log(`  ${id.padEnd(24)} ${bar} ${weight.toFixed(3)}`);
    }
  } else if (cmd === 'reset') {
    resetWeights();
    console.log('Kappa: weights reset');
  } else if (cmd === 'diagnostics') {
    const sampleDiags = Object.keys(DEFAULTS).map(id => ({ id, threshold: 0.8 }));
    const adjusted = getAdjustedDiagnostics(sampleDiags);
    console.log(`Kappa — Adjusted Diagnostics`);
    console.log(`  Rule                  │ Base  │ Weight │ Mult  │ Effective`);
    console.log(`  ──────────────────────┼───────┼────────┼───────┼──────────`);
    for (const d of adjusted) {
      const eff = (0.8 * d.kappa_mult).toFixed(2);
      console.log(`  ${d.id.padEnd(22)} │ 0.80  │ ${d.kappa_weight.toFixed(3)} │ ${d.kappa_mult} │ ${eff}`);
    }
  } else {
    console.log(`PHOS Kappa — Outcome-Aware Healer Learning

Tracks healer actions, correlates with state changes, adjusts rule weights.

Usage:
  phos kappa learn        Run a learning cycle (read healer log, update weights)
  phos kappa weights      Show current outcome weights per diagnostic rule
  phos kappa diagnostics  Show effective thresholds with Kappa adjustment
  phos kappa reset        Reset all weights to 0.5 (neutral)
`);
  }
}
