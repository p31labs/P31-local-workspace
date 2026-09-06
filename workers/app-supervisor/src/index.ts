/**
 * App Supervisor — Manages Vibe Studio apps with DO-backed SQLite storage.
 *
 * Routes:
 *   POST /apps/create       — Create { name, html, css, js, creator }
 *   GET  /apps              — List all (id, name, creator, created_at)
 *   GET  /apps/:id          — Serve as rendered HTML
 *   POST /apps/:id/state    — Save state { data }
 *   GET  /apps/:id/state    — Load state
 *   GET  /health            — App count
 */

import { DurableObject } from "cloudflare:workers";

interface Env {
  APP_SUPERVISOR: DurableObjectNamespace<AppSupervisor>;
}

export class AppSupervisor extends DurableObject<Env> {
  private sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    // Idempotent migration
    this.sql.exec(`CREATE TABLE IF NOT EXISTS apps (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, html TEXT, css TEXT, js TEXT,
      creator TEXT DEFAULT 'anonymous', created_at TEXT DEFAULT (datetime('now')),
      deploy_count INTEGER DEFAULT 0, app_state TEXT DEFAULT '{}'
    )`);
    // Add family_id if missing (migration for existing DOs)
    try { this.sql.exec('ALTER TABLE apps ADD COLUMN family_id TEXT DEFAULT \'public\''); } catch {}
    this.sql.exec(`CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT, event TEXT NOT NULL,
      family_id TEXT DEFAULT 'public', app_id TEXT DEFAULT '',
      details TEXT DEFAULT '', love_cost INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`);
    // Rate limits per family
    this.sql.exec(`CREATE TABLE IF NOT EXISTS rate_limits (
      family_id TEXT PRIMARY KEY,
      creates_today INTEGER DEFAULT 0,
      last_create_date TEXT DEFAULT (date('now')),
      max_creates_per_day INTEGER DEFAULT 50,
      max_apps_total INTEGER DEFAULT 100
    )`);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
    const familyId = request.headers.get('X-Tenant-ID') || request.headers.get('X-Family-DID') || 'public';

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { ...cors, 'Access-Control-Allow-Methods': 'GET,POST' } });
    }

    // Generate trace ID for every request
    const traceId = request.headers.get('X-Trace-ID') || `trace-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const responseHeaders: Record<string, string> = {
      ...cors,
      'X-Trace-ID': traceId,
      'X-Service': 'app-supervisor',
      'X-Version': '2.0.0',
    };

    // Enhanced Health
    if (url.pathname === '/health') {
      const row = this.sql.exec('SELECT count(*) as c FROM apps').one() as any;
      const famCount = this.sql.exec('SELECT COUNT(DISTINCT family_id) as c FROM apps').one() as any;
      const eventCount = this.sql.exec('SELECT count(*) as c FROM audit_log').one() as any;
      const todayEvents = this.sql.exec("SELECT count(*) as c FROM audit_log WHERE created_at > datetime('now', '-1 day')").one() as any;
      const rlCount = this.sql.exec('SELECT count(*) as c FROM rate_limits').one() as any;
      return new Response(JSON.stringify({
        ok: true, service: 'app-supervisor', version: '2.0.0', trace_id: traceId,
        apps: row?.c || 0, families: famCount?.c || 0,
        audit_events: eventCount?.c || 0, events_24h: todayEvents?.c || 0,
        rate_limited_families: rlCount?.c || 0,
      }), { headers: responseHeaders });
    }

    // List apps — filter by family
    if (url.pathname === '/apps' && request.method === 'GET') {
      let rows: any[];
      try {
        rows = this.sql.exec('SELECT id, name, creator, family_id, created_at, deploy_count FROM apps WHERE family_id = ? ORDER BY created_at DESC LIMIT 50', familyId).toArray();
      } catch {
        rows = this.sql.exec('SELECT id, name, creator, created_at, deploy_count FROM apps ORDER BY created_at DESC LIMIT 50').toArray();
      }
      return new Response(JSON.stringify(rows), { headers: responseHeaders });
    }

    // Create app — with rate limiting + family attribution
    if (url.pathname === '/apps/create' && request.method === 'POST') {
      try {
        const { name, html, css, js, creator } = await request.json() as any;
        if (!name || !html) return new Response(JSON.stringify({ error: 'name and html required' }), { status: 400, headers: responseHeaders });

        // Rate limit check
        this.sql.exec(`INSERT OR IGNORE INTO rate_limits (family_id, creates_today, last_create_date, max_creates_per_day) VALUES (?, 0, date('now'), 50)`, familyId);
        const rl = this.sql.exec('SELECT creates_today, max_creates_per_day, max_apps_total, last_create_date FROM rate_limits WHERE family_id = ?', familyId).one() as any;
        const today = new Date().toISOString().slice(0, 10);
        const createsToday = rl?.last_create_date === today ? (rl?.creates_today || 0) : 0;
        const totalApps = this.sql.exec('SELECT count(*) as c FROM apps WHERE family_id = ?', familyId).one() as any;

        if (totalApps?.c >= (rl?.max_apps_total || 100)) {
          return new Response(JSON.stringify({ error: `Family app limit reached (${rl?.max_apps_total} max)` }), { status: 429, headers: responseHeaders });
        }
        if (createsToday >= (rl?.max_creates_per_day || 50)) {
          return new Response(JSON.stringify({ error: `Daily deploy limit reached (${rl?.max_creates_per_day} max)` }), { status: 429, headers: responseHeaders });
        }

        this.sql.exec('UPDATE rate_limits SET creates_today = ?, last_create_date = ? WHERE family_id = ?', createsToday + 1, today, familyId);

        const id = `app-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        try {
          this.sql.exec('INSERT INTO apps (id, name, html, css, js, creator, family_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            id, name.slice(0, 100), html, css || '', js || '', creator || familyId, familyId);
        } catch {
          // Fallback: family_id column may not exist yet
          this.sql.exec('INSERT INTO apps (id, name, html, css, js, creator) VALUES (?, ?, ?, ?, ?, ?)',
            id, name.slice(0, 100), html, css || '', js || '', creator || familyId);
        }
        // Audit log
        this.sql.exec('INSERT INTO audit_log (event, family_id, app_id, details, love_cost) VALUES (?, ?, ?, ?, ?)',
          'app_deployed', familyId, id, JSON.stringify({ name: name.slice(0,100) }), 5);
        return new Response(JSON.stringify({ ok: true, id, family_id: familyId, url: `https://dispatch-router.trimtab-signal.workers.dev/${familyId}/apps/${id}` }), { headers: responseHeaders });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: responseHeaders });
      }
    }

    // Serve app as HTML
    const appMatch = url.pathname.match(/^\/apps\/([a-zA-Z0-9_-]+)$/);
    if (appMatch && request.method === 'GET') {
      const row = this.sql.exec('SELECT * FROM apps WHERE id = ?', appMatch[1]).one() as any;
      if (!row) return new Response(JSON.stringify({ error: 'App not found' }), { status: 404, headers: responseHeaders });

      this.sql.exec('UPDATE apps SET deploy_count = deploy_count + 1 WHERE id = ?', appMatch[1]);

      return new Response(renderAppFull(row), {
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Save/load state
    const stateMatch = url.pathname.match(/^\/apps\/([a-zA-Z0-9_-]+)\/state$/);
    if (stateMatch) {
      if (request.method === 'POST') {
        try {
          const { data } = await request.json() as any;
          this.sql.exec('UPDATE apps SET app_state = ? WHERE id = ?', typeof data === 'string' ? data : JSON.stringify(data), stateMatch[1]);
          return new Response(JSON.stringify({ ok: true }), { headers: responseHeaders });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: responseHeaders });
        }
      }
      if (request.method === 'GET') {
        const row = this.sql.exec('SELECT app_state FROM apps WHERE id = ?', stateMatch[1]).one() as any;
        return new Response(row?.app_state || '{}', { headers: responseHeaders });
      }
    }

    // ── Audit log ──
    if (url.pathname === '/audit' && request.method === 'GET') {
      const rows = familyId === 'public'
        ? this.sql.exec('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100').toArray()
        : this.sql.exec('SELECT * FROM audit_log WHERE family_id = ? ORDER BY created_at DESC LIMIT 100', familyId).toArray();
      return new Response(JSON.stringify(rows), { headers: responseHeaders });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: responseHeaders });
  }
}

function renderAppFull(app: any): string {
  const js = app.js || '';
  return `<!DOCTYPE html>
<html lang="en" data-spoons="3">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; font-src 'none'; connect-src 'self'; frame-src 'none';">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex, nofollow">
<title>${esc(app.name)} — P31 App</title>
<style>
:root{--p31-void:#0A0A0F;--p31-surface:#12121A;--p31-text-primary:#F5F5F7;--p31-accent:#00F0FF;--p31-accent-violet:#A78BFA;--p31-accent-gold:#FBBF24;--p31-accent-green:#34D399;--p31-accent-red:#FB7185;--p31-glass-surface:rgba(255,255,255,.04);--p31-glass-border:rgba(255,255,255,.08);--p31-font-sans:Inter,ui-sans-serif,system-ui,sans-serif}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:var(--p31-font-sans);background:var(--p31-void);color:var(--p31-text-primary);min-height:100vh;-webkit-font-smoothing:antialiased}
@media(prefers-reduced-motion:reduce){*{animation-duration:0s!important;transition-duration:0s!important}}
[data-spoons="0"] *,[data-spoons="1"] *{animation-duration:0s!important;transition-duration:0s!important}
${app.css || ''}
</style>
</head>
<body>
${app.html || ''}
<script>
const AID='${app.id}';const API='https://app-supervisor.trimtab-signal.workers.dev';
window.saveState=async function(d){try{await fetch(API+'/apps/'+AID+'/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:JSON.stringify(d)})})}catch(e){localStorage.setItem('p31-'+AID,JSON.stringify(d))}};
window.loadState=async function(){try{const r=await fetch(API+'/apps/'+AID+'/state');return JSON.parse(await r.text())}catch(e){try{return JSON.parse(localStorage.getItem('p31-'+AID)||'{}')}catch{return{}}}};
${js}
</script>
</body>
</html>`;
}

function esc(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const doId = env.APP_SUPERVISOR.idFromName("singleton");
    const stub = env.APP_SUPERVISOR.get(doId);
    return stub.fetch(request);
  },
};
