// ═══════════════════════════════════════════════════════
// p31-state — P31 Labs
// Shared user state via Cloudflare KV.
// CWP-2026-014 R12
//
// State schema:
//   {
//     spoons: number,        // 0-12
//     tier: string,          // "FULL" | "LOW" | "MINIMAL"
//     settings: object,      // per-user app preferences
//     lastActive: string,    // ISO timestamp
//     activeApp: string,     // which app the user is currently in
//   }
//
// Routes:
//   GET  /state/:userId          → read current state (with fallback defaults)
//   PUT  /state/:userId          → merge-patch update
//   DELETE /state/:userId        → reset to defaults
//   GET  /health                 → service health
//
// Auth: anonymous session tokens in Authorization header
//   (future: sign with SESSION_SECRET; for now, any token accepted)
//
// Privacy:
//   - userId is an anonymous UUID, never tied to PII
//   - No cross-user reads
//   - TTL: 90 days idle expiry
// ═══════════════════════════════════════════════════════

export interface Env {
  USER_STATE_KV: KVNamespace;
  ALLOWED_ORIGINS: string;
  STATE_TTL_DAYS: string;
  SESSION_SECRET?: string;
}

// ── State schema ──────────────────────────────────────────────────────────

interface UserState {
  spoons: number;            // 0–12
  tier: 'FULL' | 'LOW' | 'MINIMAL';
  settings: Record<string, unknown>;
  lastActive: string;        // ISO timestamp
  activeApp: string;         // e.g. "ede", "bonding", "larmor", "hub"
}

const DEFAULT_STATE: UserState = {
  spoons: 12,
  tier: 'FULL',
  settings: {},
  lastActive: new Date().toISOString(),
  activeApp: 'hub',
};

function tierFromSpoons(spoons: number): UserState['tier'] {
  if (spoons <= 2) return 'MINIMAL';
  if (spoons <= 6) return 'LOW';
  return 'FULL';
}

// ── CORS ──────────────────────────────────────────────────────────────────

function corsHeaders(origin: string, allowedOrigins: string): Record<string, string> {
  const allowed = allowedOrigins.split(',').map(s => s.trim());
  const isAllowed = allowed.includes(origin)
    || origin.startsWith('http://localhost:')
    || origin.startsWith('http://127.0.0.1:');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : (allowed[0] ?? '*'),
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(body: unknown, status = 200, cors: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

// ── KV helpers ─────────────────────────────────────────────────────────────

function stateKey(userId: string): string {
  return `state:${userId}`;
}

async function readState(userId: string, env: Env): Promise<UserState> {
  const raw = await env.USER_STATE_KV.get(stateKey(userId));
  if (!raw) return { ...DEFAULT_STATE, lastActive: new Date().toISOString() };
  try {
    return JSON.parse(raw) as UserState;
  } catch {
    return { ...DEFAULT_STATE, lastActive: new Date().toISOString() };
  }
}

async function writeState(userId: string, state: UserState, env: Env): Promise<void> {
  const ttl = parseInt(env.STATE_TTL_DAYS || '90', 10) * 24 * 60 * 60;
  await env.USER_STATE_KV.put(stateKey(userId), JSON.stringify(state), { expirationTtl: ttl });
}

// ── userId validation ──────────────────────────────────────────────────────

function isValidUserId(id: string): boolean {
  // Anonymous UUID or short alphanumeric session token — no PII
  return /^[a-zA-Z0-9_-]{4,128}$/.test(id);
}

// ── Main fetch handler ─────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const cors = corsHeaders(origin, env.ALLOWED_ORIGINS ?? '*');
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const path = url.pathname;

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // ── GET /health ────────────────────────────────────────────────────────
    if (path === '/health' && method === 'GET') {
      return json({
        service: 'p31-state',
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        bindings: ['USER_STATE_KV'],
        routes: [
          'GET    /state/:userId',
          'PUT    /state/:userId',
          'DELETE /state/:userId',
          'GET    /health',
        ],
        schema: {
          spoons: 'number (0-12)',
          tier: '"FULL" | "LOW" | "MINIMAL"',
          settings: 'object',
          lastActive: 'ISO timestamp',
          activeApp: 'string',
        },
      }, 200, cors);
    }

    // ── /state/:userId routes ──────────────────────────────────────────────
    const stateMatch = path.match(/^\/state\/([^/]+)$/);
    if (!stateMatch) {
      return json({ error: 'Not found' }, 404, cors);
    }
    const userId = decodeURIComponent(stateMatch[1]);

    if (!isValidUserId(userId)) {
      return json({ error: 'Invalid userId' }, 400, cors);
    }

    // GET /state/:userId — read
    if (method === 'GET') {
      const state = await readState(userId, env);
      return json({ userId, state }, 200, cors);
    }

    // PUT /state/:userId — merge-patch update
    if (method === 'PUT') {
      let patch: Partial<UserState>;
      try {
        patch = await request.json() as Partial<UserState>;
      } catch {
        return json({ error: 'Invalid JSON' }, 400, cors);
      }

      const current = await readState(userId, env);

      // Merge patch — clamp spoons and derive tier
      const next: UserState = {
        ...current,
        ...patch,
        settings: { ...current.settings, ...(patch.settings ?? {}) },
        lastActive: new Date().toISOString(),
      };

      // Clamp spoons 0–12 and auto-derive tier if not explicitly set
      if (typeof next.spoons === 'number') {
        next.spoons = Math.max(0, Math.min(12, next.spoons));
        if (!patch.tier) {
          next.tier = tierFromSpoons(next.spoons);
        }
      }

      await writeState(userId, next, env);

      return json({ userId, state: next }, 200, cors);
    }

    // DELETE /state/:userId — reset
    if (method === 'DELETE') {
      await env.USER_STATE_KV.delete(stateKey(userId));
      return json({ userId, state: DEFAULT_STATE, reset: true }, 200, cors);
    }

    return json({ error: 'Method not allowed' }, 405, cors);
  },
};
