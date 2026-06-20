import type { APIRoute } from 'astro';
import { readFileSync, existsSync } from 'fs';

const STATE_PATH = '/tmp/phos-cognitive-state.json';

export const GET: APIRoute = () => {
  if (!existsSync(STATE_PATH)) {
    return new Response(
      JSON.stringify({ spoons: 4, level: 4, source: 'default' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const data = JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
    const level = data.spoon ?? data.spoons ?? data.level ?? 4;
    const num = Number.parseInt(String(level), 10);
    return new Response(
      JSON.stringify({
        spoons: Number.isFinite(num) ? num : 4,
        level: Number.isFinite(num) ? num : 4,
        cognitive_load: data.cognitive_load ?? data.load ?? 0.5,
        fatigue: data.fatigue ?? 0.3,
        flow: data.flow ?? 0.5,
        creativity: data.creativity ?? 0.5,
        stress: data.stress ?? 0.2,
        source: 'phos-daemon',
        timestamp: data.timestamp,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ spoons: 4, level: 4, source: 'error' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
