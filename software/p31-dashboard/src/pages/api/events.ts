import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_PATH = '/tmp/phos-forge/events.jsonl';
const MAX_EVENTS = 200;

function readEvents() {
  if (!existsSync(LOG_PATH)) return [];
  try {
    const content = readFileSync(LOG_PATH, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    return lines.slice(-MAX_EVENTS).map((line) => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean).reverse();
  } catch {
    return [];
  }
}

export const GET = async () => {
  const events = readEvents();
  return new Response(JSON.stringify(events), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, must-revalidate',
    },
  });
};

export const runtime = 'edge';
