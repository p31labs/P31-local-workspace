import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { dispatchLLM } from './router.mjs';

const COG_PATH = '/tmp/phos-cognitive-state.json';
const EVENTS_PATH = '/tmp/phos-forge/events.jsonl';
const TIDE_PATH = '/tmp/phos-tide-state.json';
const HEALER_PATH = '/tmp/phos-forge/healer-log.jsonl';
const BRAIN_DIR = '/tmp/phos-brain';
const SPOON_PATH = '/home/p31/P31-local-workspace/spoon-state.json';
const OUTPUT_DIR = '/tmp/phos-aura';
const TODAY = new Date().toISOString().slice(0, 10);

function readJSON(path) {
  try { return JSON.parse(readFileSync(path, 'utf-8')); } catch { return null; }
}

function readLines(path, limit = 200) {
  if (!existsSync(path)) return [];
  try {
    const content = readFileSync(path, 'utf-8');
    return content.trim().split('\n').filter(Boolean).slice(-limit).map(l => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
  } catch { return []; }
}

function getLatestBrainDump() {
  if (!existsSync(BRAIN_DIR)) return null;
  const dates = readdirSync(BRAIN_DIR).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().reverse();
  for (const date of dates) {
    const files = readdirSync(join(BRAIN_DIR, date)).filter(f => f.endsWith('.md')).sort().reverse();
    if (files.length) {
      const latest = join(BRAIN_DIR, date, files[0]);
      const content = readFileSync(latest, 'utf-8');
      return { date, file: files[0], content: content.slice(0, 800) };
    }
  }
  return null;
}

function getSpoonLevel() {
  const s = readJSON(SPOON_PATH) || {};
  return s.level ?? 4;
}

function summarizeEvents(events) {
  const counts = { deploy: 0, error: 0, game: 0, healer: 0, other: 0 };
  for (const ev of events) {
    const t = ev.type || '';
    if (t.includes('deploy')) counts.deploy++;
    else if (t.includes('error')) counts.error++;
    else if (t.includes('game')) counts.game++;
    else if (t.includes('healer')) counts.healer++;
    else counts.other++;
  }
  return counts;
}

function summarizeHealer(entries) {
  const actions = [];
  const reflex = [];
  for (const e of entries) {
    if (e.diagnosis) actions.push(e.diagnosis);
    if (e.permitted === false) reflex.push(e.diagnosis || 'denied');
  }
  return { actions, reflex, total: entries.length };
}

function pickHour(value) {
  return value ?? '?';
}

export async function generateDailyReport() {
  const cog = readJSON(COG_PATH) || {};
  const tide = readJSON(TIDE_PATH) || {};
  const events = readLines(EVENTS_PATH, 500);
  const healerEntries = readLines(HEALER_PATH, 100);
  const brain = getLatestBrainDump();
  const spoon = getSpoonLevel();

  const eventSummary = summarizeEvents(events);
  const healerSummary = summarizeHealer(healerEntries);
  const peakHour = pickHour(tide.patterns?.peak_activity_hour);
  const flowHour = pickHour(tide.patterns?.peak_flow_hour);

  const prompt = [
    'You are a concise synthesis assistant. Create a warm daily health report for a neurodivergent developer.',
    'Cognitive state:',
    `- Spoons: ${cog.spoons ?? spoon}/5`,
    `- Cognitive load: ${Math.round((cog.cognitive_load ?? 0.5) * 100)}%`,
    `- Flow: ${Math.round((cog.flow ?? 0.5) * 100)}%`,
    `- Stress: ${Math.round((cog.stress ?? 0.2) * 100)}%`,
    '',
    'Recent activity:',
    `- Deploys: ${eventSummary.deploy}`,
    `- Errors: ${eventSummary.error}`,
    `- Game sessions: ${eventSummary.game}`,
    `- Healer actions: ${eventSummary.healer}`,
    '',
    `Tide: peak activity at ${peakHour}:00; flow window at ${flowHour}:00.`,
    '',
    `Healer: ${healerSummary.actions.length} actions, ${healerSummary.reflex.length} reflex firings.`,
    '',
    brain ? `Latest brain dump (${brain.date}): "${brain.content.slice(0, 220)}"` : 'No brain dump yet.',
    '',
    'Write 2 tight paragraphs: how is the system and operator doing? Patterns to watch? One concrete adjustment for today.',
  ].join('\n');

  let synthesis = '';
  try {
    synthesis = await dispatchLLM(
      'You are a warm, supportive synthesis architect.',
      prompt,
      { task: 'synthesis', privacy: 'standard' },
      { maxTokens: 600, temperature: 0.5 }
    );
  } catch (e) {
    synthesis = `*Synthesis unavailable: ${e.message}*`;
  }

  const report = [
    `# Quantum Aura — Daily Report (${TODAY})`,
    '',
    '## Cognitive State',
    `- Spoons: ${cog.spoons ?? spoon}/5`,
    `- Load: ${Math.round((cog.cognitive_load ?? 0.5) * 100)}%`,
    `- Flow: ${Math.round((cog.flow ?? 0.5) * 100)}%`,
    `- Stress: ${Math.round((cog.stress ?? 0.2) * 100)}%`,
    '',
    '## Yesterday',
    `- Deploys: ${eventSummary.deploy}`,
    `- Errors: ${eventSummary.error}`,
    `- Game sessions: ${eventSummary.game}`,
    `- Healer actions: ${eventSummary.healer}`,
    '',
    '## Tide',
    `- Peak: ${peakHour}:00`,
    `- Flow: ${flowHour}:00`,
    '',
    '## Healer',
    `- Actions: ${healerSummary.actions.length}`,
    `- Reflex firings: ${healerSummary.reflex.length}`,
    '',
    brain ? `## Brain Dump (${brain.date})\n> ${brain.content.slice(0, 260)}...` : '',
    '',
    '## Synthesis',
    synthesis,
    '',
    '---',
    `*Report generated at ${new Date().toISOString()}*`,
  ].filter(Boolean).join('\n') + '\n';

  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
  const outFile = join(OUTPUT_DIR, `daily-${TODAY}.md`);
  writeFileSync(outFile, report, 'utf-8');

  return { report, path: outFile };
}
