import { VERSION } from './version.js';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const hits = new Map();

export async function sha256Hex(message) {
  const bytes = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function checkRateLimit(key) {
  const now = Date.now();
  const entry = hits.get(key) || { count: 0, ts: now };
  if (now - entry.ts > RATE_LIMIT_WINDOW_MS) {
    entry.count = 1;
    entry.ts = now;
  } else {
    entry.count += 1;
  }
  hits.set(key, entry);
  if (entry.count > RATE_LIMIT_MAX) {
    return { limited: true, remaining: 0 };
  }
  return { limited: false, remaining: RATE_LIMIT_MAX - entry.count };
}

export { VERSION };
