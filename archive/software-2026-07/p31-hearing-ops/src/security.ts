const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 100;
const hits = new Map();

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
  return entry.count > RATE_LIMIT_MAX;
}

export function sanitizeInput(value, maxLength = 512) {
  if (typeof value !== 'string') return '';
  return value.slice(0, maxLength).replace(/[\x00-\x1f\x7f]/g, '');
}

export function validateHealthRequest(req) {
  const url = new URL(req.url);
  const allowed = new Set(['/health', '/api/health']);
  return allowed.has(url.pathname);
}

export function validateEnv() {
  const required = ['NODE_ENV'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
  return true;
}
