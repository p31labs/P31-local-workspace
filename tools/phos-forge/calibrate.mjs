import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';
import { getState } from './cognitive-estimator.mjs';

const CALIBRATION_LOG = '/tmp/phos-forge/calibration-log.jsonl';
const SPOON_PATH = '/home/p31/P31-local-workspace/spoon-state.json';
const EVENTS_PATH = '/tmp/phos-forge/events.jsonl';

function busEmit(type, payload) {
  const event = {
    type, payload,
    timestamp: new Date().toISOString(),
    id: crypto.randomUUID(),
  };
  try { appendFileSync(EVENTS_PATH, JSON.stringify(event) + '\n'); } catch {}
}

function setSpoon(level) {
  const n = Math.min(5, Math.max(0, parseInt(level, 10)));
  const data = existsSync(SPOON_PATH) ? JSON.parse(readFileSync(SPOON_PATH, 'utf-8')) : {};
  data.level = n;
  data.updated = new Date().toISOString();
  writeFileSync(SPOON_PATH, JSON.stringify(data, null, 2) + '\n');
  return n;
}

export function calibrate(opts) {
  const current = getState();
  const reported = {
    spoon: opts.spoon !== undefined ? parseInt(opts.spoon, 10) : current.spoon,
    cognitive_load: opts.load !== undefined ? parseFloat(opts.load) : current.cognitive_load,
    fatigue: opts.fatigue !== undefined ? parseFloat(opts.fatigue) : current.fatigue,
    flow: opts.flow !== undefined ? parseFloat(opts.flow) : current.flow,
    creativity: opts.creativity !== undefined ? parseFloat(opts.creativity) : current.creativity,
    stress: opts.stress !== undefined ? parseFloat(opts.stress) : current.stress,
  };
  reported.spoon = setSpoon(reported.spoon);
  busEmit('cognitive.calibration', {
    reported,
    estimated: {
      spoon: current.spoon,
      cognitive_load: current.cognitive_load,
      fatigue: current.fatigue,
      flow: current.flow,
      creativity: current.creativity,
      stress: current.stress,
    },
  });
  const entry = {
    timestamp: new Date().toISOString(),
    estimated: { spoon: current.spoon, cognitive_load: current.cognitive_load, fatigue: current.fatigue, flow: current.flow, creativity: current.creativity, stress: current.stress },
    reported,
    deltas: Object.fromEntries(Object.entries(reported).map(([k, v]) => [k, v - (current[k] || 0)])),
  };
  try { appendFileSync(CALIBRATION_LOG, JSON.stringify(entry) + '\n'); } catch {}
  return { reported, estimated: current };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === '--help') {
    console.log(`PHOS Calibration

Usage:
  phos calibrate --spoon <0-5>          Set spoon level
  phos calibrate --load <0-1>           Override cognitive load
  phos calibrate --fatigue <0-1>        Override fatigue
  phos calibrate --flow <0-1>           Override flow
  phos calibrate --stress <0-1>         Override stress
  phos calibrate --interactive          Interactive mode
`);
    process.exit(0);
  }
  async function mainInteractive() {
    const rl = await import('readline').then(m => m.createInterface({ input: process.stdin, output: process.stdout }));
    const q = (q) => new Promise(r => rl.question(q, r));
    const s = getState();
    console.log(`Current: spoon=${s.spoon} load=${(s.cognitive_load*100).toFixed(0)}% fatigue=${(s.fatigue*100).toFixed(0)}% flow=${(s.flow*100).toFixed(0)}% stress=${(s.stress*100).toFixed(0)}%\n`);
    const spoon = await q('Spoon level (0-5): ') || s.spoon;
    const load = await q('Cognitive load (0-1): ') || s.cognitive_load;
    const fatigue = await q('Fatigue (0-1): ') || s.fatigue;
    const flow = await q('Flow (0-1): ') || s.flow;
    const stress = await q('Stress (0-1): ') || s.stress;
    rl.close();
    const result = calibrate({ spoon, load: parseFloat(load), fatigue: parseFloat(fatigue), flow: parseFloat(flow), stress: parseFloat(stress) });
    console.log('\nCalibration saved.');
    console.log(`  Spoon: ${result.estimated.spoon} → ${result.reported.spoon}`);
  }
  if (args[0] === '--interactive') {
    await mainInteractive();
    process.exit(0);
  }
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      if (['spoon', 'load', 'fatigue', 'flow', 'stress', 'creativity'].includes(key)) {
        opts[key] = val;
        if (val !== true) i++;
      }
    }
  }
  const result = calibrate(opts);
  console.log(`Calibration logged.`);
  console.log(`  Spoon: ${result.estimated.spoon} → ${result.reported.spoon}`);
  console.log(`  Load:  ${(result.estimated.cognitive_load*100).toFixed(0)}% → ${(result.reported.cognitive_load*100).toFixed(0)}%`);
  console.log(`  Fatigue: ${(result.estimated.fatigue*100).toFixed(0)}% → ${(result.reported.fatigue*100).toFixed(0)}%`);
  console.log(`  Flow:   ${(result.estimated.flow*100).toFixed(0)}% → ${(result.reported.flow*100).toFixed(0)}%`);
  console.log(`  Stress: ${(result.estimated.stress*100).toFixed(0)}% → ${(result.reported.stress*100).toFixed(0)}%`);
}
