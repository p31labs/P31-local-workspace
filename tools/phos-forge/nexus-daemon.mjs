import { estimate, getState } from './cognitive-estimator.mjs';
import { remediate } from './self-healer.mjs';
import { emitEvent } from './bus.mjs';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { tick as reflexTick } from './reflex-arc.mjs';
import { learn as kappaLearn } from './kappa.mjs';
import { page as logbookPage } from './logbook.mjs';

const SPOON_PATH = '/home/p31/P31-local-workspace/spoon-state.json';
const CYCLE_INTERVAL_MS = 30000;
const HEALER_INTERVAL_MS = 60000;

let cycleCount = 0;
let lastHealerRun = 0;

function getSpoonLevel() {
  try {
    const data = JSON.parse(readFileSync(SPOON_PATH, 'utf-8'));
    return typeof data.level === 'number' ? data.level : 4;
  } catch {
    return 4;
  }
}

export function cycle() {
  cycleCount++;

  const cogState = estimate();
  const spoon = getSpoonLevel();

  emitEvent('nexus.cycle', {
    cycle: cycleCount,
    spoon,
    cognitive_load: Math.round(cogState.cognitive_load * 100) / 100,
    fatigue: Math.round(cogState.fatigue * 100) / 100,
    flow: Math.round(cogState.flow * 100) / 100,
    creativity: Math.round(cogState.creativity * 100) / 100,
    stress: Math.round(cogState.stress * 100) / 100,
  });

  const now = Date.now();
  if (now - lastHealerRun >= HEALER_INTERVAL_MS) {
    lastHealerRun = now;
    const healerResults = remediate();

    const kappaResult = kappaLearn();
    if (kappaResult.new_learnings > 0) {
      emitEvent('nexus.kappa_learn', {
        learnings: kappaResult.new_learnings,
        delta: kappaResult.delta,
      });
    }

    const healerActions = healerResults.filter(r => r.actions_taken.length > 0 && !r.actions_taken[0].includes('blocked'));
    if (healerActions.length > 0) {
      emitEvent('nexus.healer_actions', {
        count: healerActions.length,
        actions: healerActions.map(r => ({ diagnosis: r.diagnosis, actions: r.actions_taken })),
      });
    }
  }

  return { cogState, spoon, cycle: cycleCount };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cmd = process.argv[2] || 'start';

  if (cmd === 'start') {
    console.log('Nexus Daemon — Cognitive-Cybernetic Loop');
    console.log(`  Estimator cycle: every ${CYCLE_INTERVAL_MS / 1000}s`);
    console.log(`  Healer cycle:    every ${HEALER_INTERVAL_MS / 1000}s`);
    console.log('');

    cycle();
    console.log(`[${new Date().toISOString()}] Nexus cycle 1 complete`);

    setInterval(() => {
      const result = cycle();
      const s = result.cogState;
      const dims = `CL:${(s.cognitive_load * 100).toFixed(0)}% FA:${(s.fatigue * 100).toFixed(0)}% FL:${(s.flow * 100).toFixed(0)}% CR:${(s.creativity * 100).toFixed(0)}% ST:${(s.stress * 100).toFixed(0)}%`;
      console.log(`[${new Date().toISOString()}] cycle ${result.cycle} | spoon:${result.spoon} | ${dims}`);
    }, CYCLE_INTERVAL_MS);

    setInterval(() => {
      const results = reflexTick();
      if (results.length > 0) {
        for (const r of results) {
          console.log(`[${new Date().toISOString()}] reflex ${r.pattern} sev:${r.severity.toFixed(2)} ${r.permitted ? r.action : '(blocked)'}`);
        }
      }
    }, 500);

    setInterval(() => {
      const lb = logbookPage();
      console.log(`[${new Date().toISOString()}] logbook session ${lb.session} (${lb.events} events, ${lb.duration})`);
    }, 60000);
  }

  if (cmd === 'cycle') {
    const result = cycle();
    const s = result.cogState;
    console.log(`Nexus cycle ${result.cycle}: spoon=${result.spoon} | CL=${(s.cognitive_load * 100).toFixed(0)}% FA=${(s.fatigue * 100).toFixed(0)}% FL=${(s.flow * 100).toFixed(0)}% CR=${(s.creativity * 100).toFixed(0)}% ST=${(s.stress * 100).toFixed(0)}%`);
  }

  if (cmd === 'status') {
    const state = getState();
    const spoon = getSpoonLevel();
    console.log(`Nexus Daemon Status`);
    console.log(`  Spoon:        ${spoon}/5`);
    console.log(`  Cog Load:     ${(state.cognitive_load * 100).toFixed(0)}%`);
    console.log(`  Fatigue:      ${(state.fatigue * 100).toFixed(0)}%`);
    console.log(`  Flow:         ${(state.flow * 100).toFixed(0)}%`);
    console.log(`  Creativity:   ${(state.creativity * 100).toFixed(0)}%`);
    console.log(`  Stress:       ${(state.stress * 100).toFixed(0)}%`);
    console.log(`  Session:      ${state.session_hours?.toFixed(1) || 0}h`);
    console.log(`  Last Updated: ${state.timestamp || 'never'}`);
  }
}
