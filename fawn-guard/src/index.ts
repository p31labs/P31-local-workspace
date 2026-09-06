/**
 * FawnGuard Worker — Trauma/trigger pattern detection.
 * Deployed: fawn-guard.trimtab-signal.workers.dev
 * Rebuilt from API spec 2026-07-18.
 */

export interface Env {
  GUARD_DB: D1Database;
}

const PATTERNS: { keywords: string[]; severity: 'high' | 'medium' | 'low' }[] = [
  { keywords: ['overwhelmed', 'too much', 'can\'t', 'break', 'crisis', 'emergency'], severity: 'high' },
  { keywords: ['stressed', 'anxious', 'worried', 'scared', 'afraid'], severity: 'medium' },
  { keywords: ['tired', 'need rest', 'exhausted', 'sleep'], severity: 'low' },
  { keywords: ['sad', 'crying', 'alone', 'miss', 'lost'], severity: 'medium' },
  { keywords: ['angry', 'mad', 'frustrated', 'unfair', 'hate'], severity: 'medium' },
];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ ok: true, service: 'fawn-guard' }), { headers });
    }

    if (url.pathname !== '/analyze' || request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'POST /analyze' }), { status: 404, headers });
    }

    try {
      const { text, spoons } = await request.json() as { text: string; spoons?: number };

      // Pattern matching
      const matched = PATTERNS.filter(p =>
        p.keywords.some(k => text.toLowerCase().includes(k))
      );
      const trigger = matched.length > 0;
      const severity = matched.length > 0 ? matched[0].severity : 'none';
      const patterns = matched.flatMap(p => p.keywords.filter(k => text.toLowerCase().includes(k)));

      // Persist event
      await env.GUARD_DB.prepare('CREATE TABLE IF NOT EXISTS fawn_events (id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT, spoons INTEGER, trigger INTEGER, severity TEXT, patterns TEXT, created_at TEXT)').run();
      await env.GUARD_DB.prepare(
        'INSERT INTO fawn_events (text, spoons, trigger, severity, patterns) VALUES (?, ?, ?, ?, ?)'
      ).bind(text.slice(0, 500), spoons || 3, trigger ? 1 : 0, severity, JSON.stringify(patterns)).run();

      return new Response(JSON.stringify({ trigger, patterns, severity }), { headers });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
  },
};
