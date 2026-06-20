import { readFileSync, existsSync } from 'fs';

const EVENTS_PATH = '/tmp/phos-forge/events.jsonl';
const STATE_PATH = '/tmp/phos-cognitive-state.json';
const HEALER_PATH = '/tmp/phos-forge/healer-log.jsonl';
const MAX_EVENTS = 100;
const MAX_HEALER = 10;

function readJSON(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch { return null; }
}

function readLines(path, max) {
  if (!existsSync(path)) return [];
  try {
    const content = readFileSync(path, 'utf-8').trim();
    if (!content) return [];
    return content.split('\n').filter(Boolean).slice(-max).map(l => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean).reverse();
  } catch { return []; }
}

export const GET = async () => {
  const state = readJSON(STATE_PATH) || {
    cognitive_load: 0.5, fatigue: 0.3, flow: 0.6,
    creativity: 0.5, stress: 0.2,
    spoon: 4, timestamp: new Date().toISOString(),
    session_hours: 0, spoon_label: 'HEALTHY',
  };
  const events = readLines(EVENTS_PATH, MAX_EVENTS);
  const healer = readLines(HEALER_PATH, MAX_HEALER);

  return new Response(JSON.stringify({ state, events, healer }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, must-revalidate',
    },
  });
};

export const runtime = 'edge';
