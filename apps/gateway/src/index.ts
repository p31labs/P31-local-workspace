import { Hono } from 'hono';

try {
  const Sentry = require('@sentry/cloudflare');
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 0.1,
  });
} catch {
  // Sentry optional
}

export interface Env {
  phos_ai_proxy: Fetcher;
  jitterbug_api: Fetcher;
  k4_cage: Fetcher;
  genesis_spark: Fetcher;
  command_center?: Fetcher;
  auth_service?: Fetcher;
}

const allowedOrigins = [
  'https://phos.p31ca.org',
  'https://p31ca.org',
  'https://willow.p31ca.org',
  'https://bonding.p31ca.org',
  'https://phosphorus31.org',
];

// In-memory rate limiting (per-isolate, best-effort)
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 100; // requests per window
const RATE_WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  // Evict stale entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap) {
      if (now > val.reset) rateLimitMap.delete(key);
    }
  }
  return true;
}

function corsHeaders(origin?: string) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  return headers;
}

const app = new Hono<{ Bindings: Env }>();

// Global rate limiting
app.use('*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  if (!checkRateLimit(ip)) {
    return c.json({ error: 'Too many requests' }, 429);
  }
  await next();
});

app.use('/*', async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    const origin = c.req.header('Origin') || '';
    return new Response(null, { headers: corsHeaders(origin) });
  }
  await next();
});

async function requireAuth(c: any, next: any) {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    const origin = c.req.header('Origin') || '';
    return c.json({ error: 'Missing Authorization header' }, 401, { ...corsHeaders(origin) });
  }

  if (c.env.auth_service) {
    try {
      const verifyReq = new Request('https://auth.service/auth/session/verify', {
        method: 'POST',
        headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
      });
      const res = await c.env.auth_service.fetch(verifyReq);
      if (!res.ok) {
        const origin = c.req.header('Origin') || '';
        return c.json({ error: 'Invalid or expired session' }, 401, { ...corsHeaders(origin) });
      }
    } catch {
      const origin = c.req.header('Origin') || '';
      return c.json({ error: 'Auth service unavailable' }, 503, { ...corsHeaders(origin) });
    }
  }

  await next();
}

app.use('/api/*', async (c, next) => {
  const method = c.req.method;
  const isWrite = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

  if (!isWrite) {
    return next();
  }

  if (c.req.path === '/api/adaptive-ui') {
    return next();
  }

  return requireAuth(c, next);
});

app.use('/ai/chat', requireAuth);
app.use('/v1/chat/completions', requireAuth);
app.use('/transcribe', requireAuth);

app.get('/api/health', async (c) => {
  const origin = c.req.header('Origin') || '';
  const checks: Record<string, { ok: boolean; latency_ms?: number }> = {};
  let allOk = true;

  const bindings: Record<string, string> = {
    phos_ai_proxy: 'PHOS AI Proxy',
    jitterbug_api: 'Jitterbug API',
    k4_cage: 'K4 Cage',
    genesis_spark: 'Genesis Spark',
    auth_service: 'Auth Service',
    command_center: 'Command Center',
  };

  for (const [key, label] of Object.entries(bindings)) {
    const binding = c.env[key as keyof Env];
    if (binding && typeof (binding as any).fetch === 'function') {
      const start = Date.now();
      try {
        const res = await (binding as any).fetch(new Request('https://placeholder/health'));
        checks[label] = { ok: res.ok, latency_ms: Date.now() - start };
        if (!res.ok) allOk = false;
      } catch {
        checks[label] = { ok: false };
        allOk = false;
      }
    }
  }

  return c.json({
    ok: allOk,
    surface: 'gateway',
    version: '0.0.1',
    timestamp: new Date().toISOString(),
    status: allOk ? 'operational' : 'degraded',
    checks: { bindings: checks },
  }, 200, { ...corsHeaders(origin) });
});

app.post('/api/chat', async (c) => {
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace('/api/chat', '/v1/chat/completions');
  const req = new Request(url, c.req.raw);
  const res = await c.env.phos_ai_proxy.fetch(req);
  const origin = c.req.header('Origin') || '';
  const headers = new Headers(res.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
});

app.post('/v1/chat/completions', async (c) => {
  const res = await c.env.phos_ai_proxy.fetch(c.req.raw);
  const origin = c.req.header('Origin') || '';
  const headers = new Headers(res.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
});

app.post('/ai/chat', async (c) => {
  const url = new URL(c.req.url);
  url.pathname = '/v1/chat/completions';
  const req = new Request(url, c.req.raw);
  const res = await c.env.phos_ai_proxy.fetch(req);
  const origin = c.req.header('Origin') || '';
  const headers = new Headers(res.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
});

app.post('/transcribe', async (c) => {
  const res = await c.env.phos_ai_proxy.fetch(c.req.raw);
  const origin = c.req.header('Origin') || '';
  const headers = new Headers(res.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
});

app.post('/jitterbug/brain-dump', async (c) => {
  const res = await c.env.jitterbug_api.fetch(c.req.raw);
  const origin = c.req.header('Origin') || '';
  const headers = new Headers(res.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
});

app.get('/jitterbug/brain-dump/:id/stream', async (c) => {
  const res = await c.env.jitterbug_api.fetch(c.req.raw);
  const origin = c.req.header('Origin') || '';
  const headers = new Headers(res.headers);
  headers.set('Content-Type', 'text/event-stream');
  headers.set('Cache-Control', 'no-store');
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
});

app.get('/jitterbug/brain-dump/:id', async (c) => {
  const res = await c.env.jitterbug_api.fetch(c.req.raw);
  const origin = c.req.header('Origin') || '';
  const headers = new Headers(res.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
});

app.get('/api/brain', async (c) => {
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace('/api/brain', '/');
  const req = new Request(url, c.req.raw);
  const res = await c.env.jitterbug_api.fetch(req);
  const origin = c.req.header('Origin') || '';
  const headers = new Headers(res.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
});

app.get('/api/mesh/*', async (c) => {
  const url = new URL(c.req.url);
  const suffix = c.req.param('*') || '';
  const path = suffix ? '/' + suffix : '/';
  if (path !== '/') {
    url.pathname = path;
  }
  const req = new Request(url, c.req.raw);
  const res = await c.env.k4_cage.fetch(req);
  const origin = c.req.header('Origin') || '';
  const headers = new Headers(res.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
});

app.get('/api/genesis', async (c) => {
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace('/api/genesis', '/');
  const req = new Request(url, c.req.raw);
  const res = await c.env.genesis_spark.fetch(req);
  const origin = c.req.header('Origin') || '';
  const headers = new Headers(res.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
});

// ─── PHOS Surfaces (public, read-only) ──────────────────────────────────────

const PHOS_SURFACES = [
  { id: 'CHAT', label: 'Gateway', icon: '✨', group: 'primary' },
  { id: 'DASHBOARD', label: 'Dashboard', icon: '⊞', group: 'primary' },
  { id: 'QUANTUM_BRAIN_DUMP', label: 'Brain Dump', icon: '🧠', group: 'primary' },
  { id: 'THE_BUFFER', label: 'Buffer', icon: '✎', group: 'primary' },
  { id: 'ARCHIVE', label: 'Archive', icon: '⚯', group: 'primary' },
  { id: 'HEARTH', label: 'Hearth', icon: '◈', group: 'primary' },
  { id: 'VAULT', label: 'Vault', icon: '◉', group: 'primary' },
  { id: 'LEDGER', label: 'Ledger', icon: '⊜', group: 'primary' },
  { id: 'OPEN_LEDGER', label: 'Open Ledger', icon: '◬', group: 'primary' },
  { id: 'BARTER', label: 'Barter', icon: '🔄', group: 'primary' },
  { id: 'GOVERNANCE', label: 'Governance', icon: '⚖️', group: 'primary' },
  { id: 'PASSPORT', label: 'Passport', icon: '🪪', group: 'primary' },
  { id: 'FEEDBACK', label: 'Feedback', icon: '⚑', group: 'primary' },
  { id: 'SANCTUARY', label: 'Sanctuary', icon: '◈', group: 'primary' },
  { id: 'ATTEST', label: 'Attest', icon: '⚮', group: 'primary' },
  { id: 'SETTINGS', label: 'Settings', icon: '⚙', group: 'secondary' },
  { id: 'ARCADE', label: 'Arcade', icon: '◇', group: 'secondary' },
  { id: 'BONDING', label: 'Bonding', icon: '⚛', group: 'secondary' },
  { id: 'GRID', label: 'Grid', icon: '⌗', group: 'secondary' },
  { id: 'COMPASS', label: 'Compass', icon: '⌖', group: 'secondary' },
  { id: 'NODE_ZERO', label: 'Node Zero', icon: '⊙', group: 'secondary' },
  { id: 'WAREHOUSE', label: 'Warehouse', icon: '▣', group: 'secondary' },
  { id: 'ONBOARDING', label: 'Docs & Onboarding', icon: '📘', group: 'primary' },
];

app.get('/api/phos/surfaces', (c) => {
  const origin = c.req.header('Origin') || '';
  return c.json({ surfaces: PHOS_SURFACES }, 200, corsHeaders(origin));
});

// ── Adaptive UI (intent → InterfaceDescription) ──────────────────────────
// Lightweight port of @p31/interface-generator intent-generator for Workers runtime.

type WidgetType = 'stat-card' | 'metric-grid' | 'table' | 'alert-list' | 'node-grid' | 'transaction-feed' | 'deadline-list' | 'queue-panel' | 'entanglement-graph' | 'action-button' | 'text-block' | 'spacer';

interface Widget { type: WidgetType; id: string; title?: string; dataBinding: string | null; size?: string; }
interface InterfaceDescription {
  layout: string; density: string; navigation: string; interactions: string; feedback: string;
  widgets: Widget[]; crisisMode: boolean;
}

const INTENT_PATTERNS: Array<{ keywords: string[]; widgets: Widget[]; layout?: string; density?: string }> = [
  { keywords: ['love', 'ledger', 'balance', 'care'], widgets: [
    { type: 'stat-card', id: 'love-balance', title: 'LOVE Balance', dataBinding: 'love_balance', size: 'large' },
    { type: 'metric-grid', id: 'care-score', title: 'Care Score', dataBinding: 'care_metrics' },
    { type: 'transaction-feed', id: 'love-feed', title: 'Recent Activity', dataBinding: 'love_transactions' },
  ]},
  { keywords: ['deadline', 'deliverable', 'milestone', 'due'], widgets: [
    { type: 'deadline-list', id: 'deadlines', title: 'Upcoming Deadlines', dataBinding: 'deadlines' },
    { type: 'stat-card', id: 'days-remaining', title: 'Days Remaining', dataBinding: 'days_remaining' },
  ], layout: 'single-column' },
  { keywords: ['participant', 'user', 'session', 'usage'], widgets: [
    { type: 'stat-card', id: 'active-users', title: 'Active Participants', dataBinding: 'participants_count' },
    { type: 'transaction-feed', id: 'sessions', title: 'Recent Sessions', dataBinding: 'sessions' },
    { type: 'metric-grid', id: 'usage', title: 'Usage Metrics', dataBinding: 'usage_metrics' },
  ], layout: 'grid', density: 'detailed' },
  { keywords: ['compliance', 'wcag', 'accessibility', 'audit'], widgets: [
    { type: 'stat-card', id: 'wcag', title: 'WCAG Pass Rate', dataBinding: 'wcag_pass_rate' },
    { type: 'alert-list', id: 'violations', title: 'Violations', dataBinding: 'violations' },
  ], layout: 'two-column' },
  { keywords: ['brain', 'dump', 'thought', 'note', 'capture'], widgets: [
    { type: 'text-block', id: 'capture', title: 'Quick Capture', dataBinding: null },
    { type: 'action-button', id: 'save-thought', title: 'Save Thought', dataBinding: 'brain_dump_action' },
  ], layout: 'focus-mode', density: 'minimal' },
  { keywords: ['graph', 'network', 'connection', 'entangle'], widgets: [
    { type: 'entanglement-graph', id: 'graph', title: 'Connection Map', dataBinding: 'entanglements' },
    { type: 'node-grid', id: 'nodes', title: 'Connected Nodes', dataBinding: 'nodes' },
  ], layout: 'grid', density: 'exhaustive' },
  { keywords: ['crisis', 'emergency', 'help', 'safe'], widgets: [
    { type: 'action-button', id: 'crisis-exit', title: "I Need Help", dataBinding: 'crisis_action' },
    { type: 'text-block', id: 'safe-msg', title: 'You are safe. Take a breath.', dataBinding: null },
  ], layout: 'focus-mode', density: 'minimal' },
];

function spoonRules(spoons: number) {
  if (spoons <= 1) return { layout: 'focus-mode', density: 'minimal', navigation: 'hidden', interactions: 'guided', feedback: 'subtle' };
  if (spoons <= 3) return { layout: 'two-column', density: 'moderate', navigation: 'contextual', interactions: 'guided', feedback: 'explicit' };
  return { layout: 'grid', density: 'detailed', navigation: 'sidebar', interactions: 'exploratory', feedback: 'adaptive' };
}

function generateFromIntent(prompt: string, spoons: number, role?: string): InterfaceDescription {
  if (spoons === 0) {
    return { layout: 'focus-mode', density: 'minimal', navigation: 'hidden', interactions: 'guided', feedback: 'subtle',
      widgets: [{ type: 'action-button', id: 'crisis-exit', title: "I'm Ready", dataBinding: null }], crisisMode: true };
  }
  const lower = prompt.toLowerCase();
  const matched = INTENT_PATTERNS.filter(p => p.keywords.some(kw => lower.includes(kw)));
  let widgets: Widget[] = [];
  for (const m of matched) widgets.push(...m.widgets);
  if (widgets.length === 0) {
    widgets = [
      { type: 'stat-card', id: 'primary', title: 'Overview', dataBinding: 'primary_metric' },
      { type: 'text-block', id: 'context', title: 'Context', dataBinding: 'context_text' },
    ];
  }
  if (spoons <= 2) widgets = widgets.slice(0, 3);
  if (!widgets.some(w => w.type === 'stat-card')) {
    widgets.unshift({ type: 'stat-card', id: 'fallback', title: 'Primary Metric', dataBinding: 'primary_metric' });
  }
  const rules = spoonRules(spoons);
  return {
    layout: matched.find(m => m.layout)?.layout ?? rules.layout,
    density: matched.find(m => m.density)?.density ?? rules.density,
    navigation: rules.navigation, interactions: rules.interactions, feedback: rules.feedback,
    widgets, crisisMode: false,
  };
}

function starfieldConfig(spoons: number) {
  const s = Math.max(0, Math.min(5, spoons));
  if (s <= 1) return { count: 12, speed: 0.005, connR: 30, hearthA: 0.01, tealGlowA: 0.008, coralRatio: 0.1, baseAlpha: 0.06, breathRate: 0.0004, dimFactor: 0.15 };
  if (s <= 3) return { count: 50, speed: 0.08, connR: 60, hearthA: 0.035, tealGlowA: 0.016, coralRatio: 0.3, baseAlpha: 0.18, breathRate: 0.00075, dimFactor: 0.7 };
  return { count: 80, speed: 0.15, connR: 80, hearthA: 0.04, tealGlowA: 0.02, coralRatio: 0.15, baseAlpha: 0.25, breathRate: 0.0008, dimFactor: 1 };
}

app.post('/api/adaptive-ui', async (c) => {
  const origin = c.req.header('Origin') || '';
  const headers = corsHeaders(origin);
  try {
    const body = await c.req.json<{ prompt?: string; spoons?: number; role?: string }>();
    const prompt = body.prompt || 'overview';
    const spoons = Math.max(0, Math.min(5, body.spoons ?? 3));
    const role = body.role;
    const surface = generateFromIntent(prompt, spoons, role);
    const starfield = starfieldConfig(spoons);
    return c.json({ surface, starfield }, 200, headers);
  } catch (e: any) {
    return c.json({ error: e.message || 'Invalid request' }, 400, headers);
  }
});

app.get('/api/adaptive-ui/config/:spoons', (c) => {
  const origin = c.req.header('Origin') || '';
  const spoons = Math.max(0, Math.min(5, parseInt(c.req.param('spoons')) || 3));
  return c.json({ spoons, starfield: starfieldConfig(spoons), rules: spoonRules(spoons) }, 200, corsHeaders(origin));
});

// ── Dashboard ──────────────────────────────────────────────────────────────

app.get('/dashboard', (c) => {
  return c.html(GATEWAY_DASHBOARD_HTML);
});

const GATEWAY_DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>P31 Gateway — AI Proxy Dashboard</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
<style>
  :root {
    --p31-void: #0A0A0F;
    --p31-surface: #12121A;
    --p31-surface2: #1C1C2A;
    --p31-cloud: #A1A1AA;
    --p31-text-primary: #F5F5F7;
    --p31-text-secondary: rgba(245,245,247,0.6);
    --p31-text-tertiary: rgba(245,245,247,0.3);
    --p31-accent: #00F0FF;
    --p31-accent-violet: #A78BFA;
    --p31-accent-gold: #FBBF24;
    --p31-accent-green: #34D399;
    --p31-accent-red: #FB7185;
    --p31-accent-iris: #818CF8;
    --p31-glass-surface: rgba(255,255,255,0.04);
    --p31-glass-border: rgba(255,255,255,0.08);
    --p31-glass-border-hover: rgba(255,255,255,0.15);
    --p31-glass-surface-hover: rgba(255,255,255,0.06);
    --p31-glass-blur: 12px;
    --p31-glass-radius: 24px;
    --p31-glass-shadow: 0 8px 32px rgba(0,0,0,0.15);
    --p31-font-sans: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
    --p31-font-mono: JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    --p31-spacing-xs: 4px;
    --p31-spacing-sm: 8px;
    --p31-spacing-md: 16px;
    --p31-spacing-lg: 24px;
    --p31-spacing-xl: 32px;
    --p31-spacing-xxl: 64px;
    --p31-radius-none: 0;
    --p31-radius-sm: 8px;
    --p31-radius-md: 12px;
    --p31-radius-lg: 24px;
    --p31-radius-full: 9999px;
    --p31-h1: 51px;
    --p31-h2: 38px;
    --p31-h3: 28px;
    --p31-h4: 21px;
    --p31-body: 16px;
    --p31-body-sm: 14px;
    --p31-label: 12px;
    --p31-caption: 7px;
    --p31-duration-instant: 62.5ms;
    --p31-duration-fast: 125ms;
    --p31-duration-standard: 250ms;
    --p31-duration-slow: 500ms;
    --p31-duration-slower: 1000ms;
    --p31-easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
    --p31-easing-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
    --p31-easing-accelerate: cubic-bezier(0.4, 0.0, 1.0, 1);
  }
  *, *::before, *::after { box-sizing: border-box; }
  html {
    font-family: var(--p31-font-sans);
    font-size: var(--p31-body);
    line-height: 1.6;
    color: var(--p31-text-primary);
    background: var(--p31-void);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  body {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    background: var(--p31-void);
    color: var(--p31-text-primary);
  }
  h1 { font-size: var(--p31-h1); font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; }
  h2 { font-size: var(--p31-h2); font-weight: 600; line-height: 1.2; }
  h3 { font-size: var(--p31-h3); font-weight: 600; line-height: 1.3; }
  h4 { font-size: var(--p31-h4); font-weight: 600; line-height: 1.3; }
  a { color: var(--p31-accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  code, pre {
    font-family: var(--p31-font-mono);
    font-size: 13px;
  }
  .glass-panel {
    background: var(--p31-glass-surface);
    backdrop-filter: blur(var(--p31-glass-blur));
    -webkit-backdrop-filter: blur(var(--p31-glass-blur));
    border: 1px solid var(--p31-glass-border);
    border-radius: var(--p31-glass-radius);
    box-shadow: var(--p31-glass-shadow);
    transition: all var(--p31-duration-standard) var(--p31-easing-standard);
  }
  .glass-panel:hover {
    border-color: var(--p31-glass-border-hover);
    background: var(--p31-glass-surface-hover);
    transform: translateY(-2px);
    box-shadow: 0 12px 48px rgba(0,0,0,0.25);
  }
  .glass-card {
    background: var(--p31-glass-surface);
    backdrop-filter: blur(var(--p31-glass-blur));
    -webkit-backdrop-filter: blur(var(--p31-glass-blur));
    border: 1px solid var(--p31-glass-border);
    border-radius: var(--p31-glass-radius);
    padding: var(--p31-spacing-lg);
    box-shadow: var(--p31-glass-shadow);
    transition: all var(--p31-duration-standard) var(--p31-easing-standard);
  }
  .glass-navbar {
    background: var(--p31-glass-surface);
    backdrop-filter: blur(var(--p31-glass-blur));
    -webkit-backdrop-filter: blur(var(--p31-glass-blur));
    border: 1px solid var(--p31-glass-border);
    border-radius: var(--p31-glass-radius);
    position: fixed;
    top: var(--p31-spacing-md);
    left: 50%;
    transform: translateX(-50%);
    z-index: 50;
    padding: var(--p31-spacing-sm) var(--p31-spacing-md);
    width: 95%;
    max-width: 64rem;
  }
  .btn-primary {
    background: var(--p31-accent);
    color: var(--p31-void);
    font-weight: 700;
    padding: var(--p31-spacing-sm) var(--p31-spacing-lg);
    border-radius: var(--p31-radius-md);
    border: none;
    cursor: pointer;
    transition: all var(--p31-duration-fast) ease;
    box-shadow: 0 4px 16px rgba(0,240,255,0.2);
  }
  .btn-primary:hover {
    opacity: 0.8;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,240,255,0.3);
  }
  .btn-secondary {
    background: rgba(167,139,250,0.1);
    color: var(--p31-accent-violet);
    font-weight: 700;
    padding: var(--p31-spacing-sm) var(--p31-spacing-lg);
    border-radius: var(--p31-radius-md);
    border: 1px solid rgba(167,139,250,0.3);
    cursor: pointer;
    transition: all var(--p31-duration-fast) ease;
  }
  .btn-secondary:hover {
    background: rgba(167,139,250,0.2);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(167,139,250,0.15);
  }
  .btn-ghost {
    background: rgba(255,255,255,0.05);
    color: var(--p31-text-secondary);
    font-weight: 700;
    padding: var(--p31-spacing-sm) var(--p31-spacing-lg);
    border-radius: var(--p31-radius-md);
    border: 1px solid rgba(255,255,255,0.1);
    cursor: pointer;
    transition: all var(--p31-duration-fast) ease;
  }
  .btn-ghost:hover {
    background: rgba(255,255,255,0.1);
    color: var(--p31-text-primary);
  }
  .code-block {
    background: var(--p31-void);
    font-family: var(--p31-font-mono);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: var(--p31-radius-md);
    padding: var(--p31-spacing-md);
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }
  }
  [data-spoons="0"] *, [data-spoons="0"] *::before, [data-spoons="0"] *::after,
  [data-spoons="1"] *, [data-spoons="1"] *::before, [data-spoons="1"] *::after {
    animation-duration: 0s !important;
    transition-duration: 0s !important;
  }
  [data-spoons="2"] *, [data-spoons="2"] *::before, [data-spoons="2"] *::after {
    animation-duration: var(--p31-duration-slower) !important;
    transition-duration: var(--p31-duration-slow) !important;
  }
  [data-spoons="4"] *, [data-spoons="4"] *::before, [data-spoons="4"] *::after {
    animation-duration: var(--p31-duration-fast) !important;
    transition-duration: var(--p31-duration-instant) !important;
  }
  [data-spoons="5"] *, [data-spoons="5"] *::before, [data-spoons="5"] *::after {
    animation-duration: var(--p31-duration-instant) !important;
    transition-duration: var(--p31-duration-instant) !important;
  }
  .glass-panel { transition: all var(--p31-duration-standard) var(--p31-easing-standard); }
  .glass-card { transition: all var(--p31-duration-standard) var(--p31-easing-standard); }
  .btn-primary, .btn-secondary, .btn-ghost { transition: all var(--p31-duration-fast) ease; }
  .text-h1 { font-size: var(--p31-h1); font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; }
  .text-h2 { font-size: var(--p31-h2); font-weight: 600; line-height: 1.2; }
  .text-h3 { font-size: var(--p31-h3); font-weight: 600; line-height: 1.3; }
  .text-h4 { font-size: var(--p31-h4); font-weight: 600; line-height: 1.3; }
  .text-body { font-size: var(--p31-body); font-weight: 400; line-height: 1.6; }
  .text-body-sm { font-size: 14px; font-weight: 400; line-height: 1.5; }
  .text-label { font-size: var(--p31-label); font-weight: 500; line-height: 1; letter-spacing: 0.05em; text-transform: uppercase; }
  .text-caption { font-size: var(--p31-caption); font-weight: 400; line-height: 1.4; }
  .text-code { font-family: var(--p31-font-mono); font-size: 13px; line-height: 1.6; }
  .text-muted { color: var(--p31-text-secondary); }
  .text-dim { color: var(--p31-text-tertiary); }
  .text-accent { color: var(--p31-accent); }
  .text-violet { color: var(--p31-accent-violet); }
  .text-gold { color: var(--p31-accent-gold); }
  .text-green { color: var(--p31-accent-green); }
  .text-red { color: var(--p31-accent-red); }
</style>
</head>
<body data-spoons="3">
<canvas id="p31-starfield" style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0"></canvas>
<script>
(function(){var c=document.getElementById('p31-starfield'),x=c.getContext('2d'),W,H,p=[],N=50,S=0.08,CR=60,BA=0.18,HA=0.035,TG=0.016,CR2=0.3,BR=0.00075,DM=0.7;var TEAL=[77,184,168],CORAL=[204,98,71];function resize(){var r=c.getBoundingClientRect();var d=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;c.width=W*d;c.height=H*d;x.setTransform(d,0,0,d,0,0)}function seed(){p=[];for(var i=0;i<N;i++){var ic=Math.random()<CR2;p.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.2+.35,vx:(Math.random()-.5)*S*2,vy:(Math.random()-.5)*S*2,a:Math.random()*BA+.05,c:ic?[...CORAL]:[...TEAL]})}}function draw(t){var br=Math.sin(t*BR)*.5+.5;var g=x.createRadialGradient(W/2,H*.92,0,W/2,H*.92,H*.75);g.addColorStop(0,'rgba(204,98,71,'+HA*(.8+br*.4)*DM+')');g.addColorStop(.5,'rgba(204,98,71,'+HA*(.8+br*.4)*DM*.35+')');g.addColorStop(1,'rgba(5,8,12,0)');x.fillStyle=g;x.fillRect(0,0,W,H);var g2=x.createRadialGradient(W*.42,H*.22,0,W*.42,H*.22,H*.48);g2.addColorStop(0,'rgba(37,137,125,'+TG*DM+')');g2.addColorStop(1,'rgba(5,8,12,0)');x.fillStyle=g2;x.fillRect(0,0,W,H);for(var i=0;i<p.length;i++){for(var j=i+1;j<p.length;j++){var a=p[i],b=p[j],dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy;if(d2>CR*CR)continue;var d=Math.sqrt(d2),la=.042*(1-d/CR)*DM;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.strokeStyle='rgba('+a.c[0]+','+a.c[1]+','+a.c[2]+','+Math.min(la,.14)+')';x.lineWidth=.5;x.stroke()}}for(var i=0;i<p.length;i++){var q=p[i];q.x+=q.vx;q.y+=q.vy;if(q.x<-10)q.x=W+10;if(q.x>W+10)q.x=-10;if(q.y<-10)q.y=H+10;if(q.y>H+10)q.y=-10;var pa=q.a*DM*(.72+br*.28);x.beginPath();x.arc(q.x,q.y,q.r,0,Math.PI*2);x.fillStyle='rgba('+q.c[0]+','+q.c[1]+','+q.c[2]+','+pa+')';x.fill()}}function loop(now){draw(now);requestAnimationFrame(loop)}window.matchMedia('(prefers-reduced-motion: reduce)').matches?(resize(),seed(),draw(0)):(resize(),seed(),requestAnimationFrame(loop));window.addEventListener('resize',function(){resize();seed()})})();
</script>
<div class="container">
<header class="header"><div style="width:80px;height:80px;background:radial-gradient(circle,rgba(167,139,250,.2) 0%,transparent 70%);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px">⚡</div><div><h1>P31 <span class="accent">Gateway</span></h1><div class="sub">AI Proxy · Rate Limiting · Service Mesh</div></div></header>
<div class="spoon-controls" role="group" aria-label="Spoon level"><label>Spoons</label><button class="spoon-btn" data-spoon="0">0</button><button class="spoon-btn" data-spoon="1">1</button><button class="spoon-btn active" data-spoon="3">3</button><button class="spoon-btn" data-spoon="5">5</button></div>
<div class="kpi-grid"><div class="glass-panel kpi-card"><div class="kpi-value">1,402</div><div class="kpi-label">Requests/min</div></div><div class="glass-panel kpi-card"><div class="kpi-value">42ms</div><div class="kpi-label">Avg Latency</div></div><div class="glass-panel kpi-card"><div class="kpi-value">0.02%</div><div class="kpi-label">Error Rate</div></div><div class="glass-panel kpi-card"><div class="kpi-value">87%</div><div class="kpi-label">Rate Limit Used</div></div></div>
<div class="main-grid">
<div class="glass-panel"><h3 style="font-size:14px;font-weight:600;margin-bottom:16px;color:var(--p31-text-primary)">Rate Limiting</h3><div class="rate-bar"><span class="label">API /chat</span><div style="flex:1;background:var(--p31-glass-border);border-radius:100px;height:6px"><div class="fill" style="width:72%"></div></div><span class="value">72%</span></div><div class="rate-bar"><span class="label">API /transcribe</span><div style="flex:1;background:var(--p31-glass-border);border-radius:100px;height:6px"><div class="fill" style="width:45%"></div></div><span class="value">45%</span></div><div class="rate-bar"><span class="label">API /completions</span><div style="flex:1;background:var(--p31-glass-border);border-radius:100px;height:6px"><div class="fill" style="width:93%"></div></div><span class="value">93%</span></div><div class="rate-bar"><span class="label">API /health</span><div style="flex:1;background:var(--p31-glass-border);border-radius:100px;height:6px"><div class="fill" style="width:18%"></div></div><span class="value">18%</span></div></div>
<div class="glass-panel"><h3 style="font-size:14px;font-weight:600;margin-bottom:16px;color:var(--p31-text-primary)">Service Health</h3><div class="service-status"><span class="name">PHOS AI Proxy</span><span class="status"><span class="status-dot up"></span>Operational</span></div><div class="service-status"><span class="name">Jitterbug API</span><span class="status"><span class="status-dot up"></span>Operational</span></div><div class="service-status"><span class="name">K4 Cage</span><span class="status"><span class="status-dot up"></span>Operational</span></div><div class="service-status"><span class="name">Genesis Spark</span><span class="status"><span class="status-dot degraded"></span>Degraded</span></div><div class="service-status"><span class="name">Auth Service</span><span class="status"><span class="status-dot up"></span>Operational</span></div></div>
</div>
<div class="glass-panel"><h3 style="font-size:14px;font-weight:600;margin-bottom:16px;color:var(--p31-text-primary)">Live Request Log</h3><div class="log-container" id="logContainer"><div class="log-entry"><span class="log-time">14:32:01</span><span class="log-level info">INFO</span><span class="log-msg">POST /ai/chat 200 42ms</span></div><div class="log-entry"><span class="log-time">14:32:04</span><span class="log-level info">INFO</span><span class="log-msg">GET /api/phos/surfaces 200 8ms</span></div><div class="log-entry"><span class="log-time">14:32:07</span><span class="log-level warn">WARN</span><span class="log-msg">Rate limit 87% consumed by IP 192.0.2.1</span></div><div class="log-entry"><span class="log-time">14:32:10</span><span class="log-level info">INFO</span><span class="log-msg">POST /transcribe 202 124ms</span></div><div class="log-entry"><span class="log-time">14:32:13</span><span class="log-level error">ERROR</span><span class="log-msg">POST /v1/chat/completions 500 "Gateway timeout"</span></div><div class="log-entry"><span class="log-time">14:32:16</span><span class="log-level info">INFO</span><span class="log-msg">GET /health 200 3ms</span></div></div></div>
<footer style="margin-top:32px;padding:20px 0;border-top:1px solid var(--p31-glass-border);text-align:center;font-size:12px;color:var(--p31-text-tertiary)">Gateway v4.0.1 · ML-DSA-65 signing · Updated live</footer>
</div>
<script>
document.querySelectorAll('.spoon-btn').forEach(b=>{b.addEventListener('click',()=>{document.querySelectorAll('.spoon-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.body.dataset.spoons=b.dataset.spoon})});
const msgs=['POST /ai/chat 200 42ms','GET /api/phos/surfaces 200 8ms','Rate limit 87% consumed by IP 192.0.2.1','POST /transcribe 202 124ms','POST /v1/chat/completions 500 "Gateway timeout"','GET /health 200 3ms','POST /ai/chat 200 39ms','GET /api/phos/surfaces 304 4ms'];
const lvls=['info','info','warn','info','error','info','info','info'];
const lc=document.getElementById('logContainer');let li=0;
setInterval(()=>{const t=new Date().toTimeString().slice(0,8),m=msgs[li%msgs.length],l=lvls[li%lvls.length];li++;const e=document.createElement('div');e.className='log-entry';e.innerHTML='<span class="log-time">'+t+'</span><span class="log-level '+l+'">'+l.toUpperCase()+'</span><span class="log-msg">'+m+'</span>';lc.prepend(e);while(lc.children.length>30)lc.removeChild(lc.lastChild)},2500);
</script>
</body></html>`;

app.onError((err, c) => {
  console.error('gateway error', err);
  const origin = c.req.header('Origin') || '';
  return c.json({ ok: false, error: 'Gateway error' }, 500, { ...corsHeaders(origin) });
});

export default app;
