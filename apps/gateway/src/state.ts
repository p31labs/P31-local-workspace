export interface SessionState {
  sessionId: string;
  spoonLevel: number;
  loveBalance: number;
  trustTier: string;
  did: string;
  updatedAt: number;
}

export const DEFAULT_STATE: Omit<SessionState, 'sessionId'> = {
  spoonLevel: 3,
  loveBalance: 0,
  trustTier: 'bronze',
  did: '',
  updatedAt: Date.now(),
};

export function getSessionId(c: any): string {
  const header = c.req.header('X-Session-ID');
  if (header && header.length > 0) return header;

  const cookie = c.req.header('Cookie') || '';
  const match = cookie.match(/p31_session=([^;]+)/);
  if (match && match[1]) return match[1];

  const qs = c.req.query('sessionId');
  if (qs && qs.length > 0) return qs;

  return crypto.randomUUID();
}

export async function getState(env: any, sessionId: string): Promise<SessionState> {
  const raw = await env.SESSION_STORE.get(`state:${sessionId}`);
  if (!raw) {
    const initial: SessionState = { sessionId, ...DEFAULT_STATE };
    await env.SESSION_STORE.put(`state:${sessionId}`, JSON.stringify(initial));
    return initial;
  }
  return { sessionId, ...JSON.parse(raw) };
}

export async function setState(env: any, sessionId: string, patch: Partial<Omit<SessionState, 'sessionId'>>): Promise<SessionState> {
  const current = await getState(env, sessionId);
  const next: SessionState = {
    ...current,
    ...patch,
    sessionId,
    updatedAt: Date.now(),
  };
  await env.SESSION_STORE.put(`state:${sessionId}`, JSON.stringify(next));
  return next;
}

export function corsHeaders(origin: string, env?: any): Record<string, string> {
  const allowed = (env?.ALLOWED_ORIGINS as string | undefined)?.split(',') ?? ['*'];
  const ok = allowed.includes('*') || allowed.includes(origin);
  const h: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-ID',
    'Vary': 'Origin',
  };
  if (ok && origin) h['Access-Control-Allow-Origin'] = origin;
  if (ok && origin) h['Access-Control-Allow-Credentials'] = 'true';
  return h;
}
