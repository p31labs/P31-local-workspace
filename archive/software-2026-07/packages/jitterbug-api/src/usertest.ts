import type { Env } from './index';
import { DBClient } from './db';
import { z } from 'zod';

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr + 'T00:00:00Z');
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

/**
 * Mount user-testing dashboard routes.
 * - publicRouter: GET reads + SSE stream (no PII in aggregates) — registered on the outer router before the auth catch-all.
 * - protectedRouter: POST/PATCH writes + seed — registered on pskRouter (Bearer-PSK enforced by withCORS).
 */
export function registerUserTestRoutes(publicRouter: any, protectedRouter: any) {
  // ---------- PUBLIC READS ----------
  publicRouter.get('/usertest/participants', async (request: any, env: Env) => {
    const url = new URL(request.url);
    const db = new DBClient(env.DB);
    return json(await db.ut_listParticipants({
      pseudonym: url.searchParams.get('pseudonym') || undefined,
      cohort: url.searchParams.get('cohort') || undefined,
    }));
  });

  publicRouter.get('/api/usertest/participants', async (request: any, env: Env) => {
    const url = new URL(request.url);
    const db = new DBClient(env.DB);
    return json(await db.ut_listParticipants({
      pseudonym: url.searchParams.get('pseudonym') || undefined,
      cohort: url.searchParams.get('cohort') || undefined,
    }));
  });

  publicRouter.get('/usertest/sessions', async (request: any, env: Env) => {
    const url = new URL(request.url);
    const participant_id = url.searchParams.get('participant_id') ? Number(url.searchParams.get('participant_id')) : undefined;
    const phase = url.searchParams.get('phase') ? Number(url.searchParams.get('phase')) : undefined;
    const db = new DBClient(env.DB);
    return json(await db.ut_listSessions({ participant_id, phase }));
  });

  publicRouter.get('/usertest/findings', async (request: any, env: Env) => {
    const url = new URL(request.url);
    const session_id = url.searchParams.get('session_id') ? Number(url.searchParams.get('session_id')) : undefined;
    const db = new DBClient(env.DB);
    return json(await db.ut_listFindings(session_id));
  });

  publicRouter.get('/usertest/deadlines', async (request: any, env: Env) => {
    const db = new DBClient(env.DB);
    return json(await db.ut_listDeadlines());
  });

  publicRouter.get('/usertest/views/:viewer', async (request: any, env: Env) => {
    const url = new URL(request.url);
    const viewer = request.params?.viewer || 'convergence';
    const pseudonym = url.searchParams.get('pseudonym') || undefined;
    const db = new DBClient(env.DB);
    try {
      return json(await getViewData(db, viewer, pseudonym));
    } catch (e: any) {
      return json({ error: e.message }, 400);
    }
  });

  // Public SSE stream — aggregate signals only, no PII
  publicRouter.get('/usertest/stream', async (request: any, env: Env) => {
    const db = new DBClient(env.DB);
    const encoder = new TextEncoder();
    let interval: ReturnType<typeof setInterval> | undefined;
    const stream = new ReadableStream({
      start(controller) {
        const send = async () => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(await getSignals(db))}\n\n`));
          } catch (e) {
            controller.error(e);
          }
        };
        send();
        interval = setInterval(send, 3000);
      },
      cancel() {
        if (interval) clearInterval(interval);
      },
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  });

  // ---------- PROTECTED WRITES (Bearer-PSK via withCORS on pskRouter) ----------
  protectedRouter.post('/usertest/participants', async (request: any, env: Env) => {
    const body = await request.json().catch(() => ({}));
    const parsed = z.object({
      pseudonym: z.string().min(1),
      neurotype: z.string().optional(),
      cohort: z.enum(['A', 'B', 'C']),
      age_band: z.string().optional(),
      access_needs_json: z.string().optional(),
      payment_method: z.string().optional(),
      consent_given: z.boolean().optional(),
      caregiver_assent: z.boolean().optional(),
    }).parse(body);
    const db = new DBClient(env.DB);
    return json({ id: await db.ut_createParticipant(parsed) }, 201);
  });

  protectedRouter.get('/usertest/participants/:id', async (request: any, env: Env) => {
    const db = new DBClient(env.DB);
    const p = await db.ut_getParticipant(Number(request.params?.id));
    if (!p) return json({ error: 'Not found' }, 404);
    return json(p);
  });

  protectedRouter.patch('/usertest/participants/:id', async (request: any, env: Env) => {
    const body = await request.json().catch(() => ({}));
    const db = new DBClient(env.DB);
    await db.ut_updateParticipant(Number(request.params?.id), body);
    return json({ success: true });
  });

  protectedRouter.post('/usertest/sessions', async (request: any, env: Env) => {
    const body = await request.json().catch(() => ({}));
    const parsed = z.object({
      participant_id: z.number(),
      phase: z.number().min(1).max(5),
      session_date: z.string().optional(),
      format: z.enum(['remote', 'in-person', 'async']),
      spoons_start: z.number().min(1).max(5),
      spoons_end: z.number().min(1).max(5),
      wcag_json: z.string().optional(),
      payment_amount: z.number().optional(),
      paid: z.boolean().optional(),
      notes: z.string().optional(),
    }).parse(body);
    const db = new DBClient(env.DB);
    return json({ id: await db.ut_createSession(parsed) }, 201);
  });

  protectedRouter.patch('/usertest/sessions/:id', async (request: any, env: Env) => {
    const body = await request.json().catch(() => ({}));
    const db = new DBClient(env.DB);
    await db.ut_updateSession(Number(request.params?.id), body);
    return json({ success: true });
  });

  protectedRouter.post('/usertest/findings', async (request: any, env: Env) => {
    const body = await request.json().catch(() => ({}));
    const parsed = z.object({
      session_id: z.number(),
      severity: z.number().min(1).max(5),
      category: z.string().optional(),
      description: z.string().optional(),
      suggested_fix: z.string().optional(),
    }).parse(body);
    const db = new DBClient(env.DB);
    return json({ id: await db.ut_createFinding(parsed) }, 201);
  });

  protectedRouter.post('/usertest/deadlines', async (request: any, env: Env) => {
    const body = await request.json().catch(() => ({}));
    const parsed = z.object({
      label: z.string().min(1),
      due_date: z.string().optional(),
      owner: z.string().optional(),
      met: z.boolean().optional(),
    }).parse(body);
    const db = new DBClient(env.DB);
    await db.ut_upsertDeadline(parsed);
    return json({ success: true });
  });

  protectedRouter.post('/usertest/seed', async (request: any, env: Env) => {
    const db = new DBClient(env.DB);
    await seedData(db);
    return json({ success: true });
  });
}

// ---------- Aggregations ----------

async function getSignals(db: DBClient) {
  const participants = await db.ut_listParticipants();
  const sessions = await db.ut_listSessions();
  const findings = await db.ut_listFindings();
  return {
    activeNodes: participants.length,
    totalSessions: sessions.length,
    findingsCount: findings.length,
    pendingPayments: (sessions as any[]).filter((s) => !s.paid).length,
    daysLeft: daysUntil('2026-08-01'),
    timestamp: new Date().toISOString(),
  };
}

async function getViewData(db: DBClient, viewer: string, pseudonym?: string) {
  const participants = await db.ut_listParticipants();
  const sessions = await db.ut_listSessions();
  const findings = await db.ut_listFindings();
  const deadlines = await db.ut_listDeadlines();

  const base = {
    participants_count: participants.length,
    sessions_count: sessions.length,
    findings_count: findings.length,
    avg_spoons_start: avg(sessions as any[], 'spoons_start'),
    avg_spoons_end: avg(sessions as any[], 'spoons_end'),
    wcag_pass_rate: wcagPassRate(sessions as any[]),
    payments_pending: (sessions as any[]).filter((s) => !s.paid).length,
    days_until_aug1: daysUntil('2026-08-01'),
    deadlines,
  };

  if (viewer === 'coordinator') {
    return {
      ...base,
      participants_by_cohort: groupBy(participants as any[], 'cohort'),
      sessions_by_phase: groupBy(sessions as any[], 'phase'),
    };
  }
  if (viewer === 'researcher') {
    return {
      ...base,
      findings_by_severity: groupBy(findings as any[], 'severity'),
      wcag_breakdown: { total: sessions.length, passed: wcagPassRate(sessions as any[]) },
      spoon_fit: spoonFit(sessions as any[]),
    };
  }
  if (viewer === 'participant' && pseudonym) {
    const p: any = await db.ut_getParticipantByPseudonym(pseudonym);
    if (!p) throw new Error('Participant not found');
    const sp = (sessions as any[]).filter((s) => s.participant_id === p.id);
    return {
      pseudonym,
      sessions: sp.map((s) => ({
        id: s.id, phase: s.phase, format: s.format,
        spoons_start: s.spoons_start, spoons_end: s.spoons_end,
        paid: !!s.paid, payment_amount: s.payment_amount,
      })),
      payments: sp.map((s) => ({ date: s.session_date, amount: s.payment_amount, paid: !!s.paid })),
    };
  }
  if (viewer === 'grant-reviewer') {
    return {
      ...base,
      nlnet_deliverables: [
        { id: 'LOVE-Ledger', status: 'ready' },
        { id: 'PHOS-Sovereign', status: 'ready' },
      ],
      ada_compliance: {
        wcag_2_1_aa: wcagPassRate(sessions as any[]) >= 80,
        eidas_2_0: false,
      },
    };
  }
  return base;
}

async function seedData(db: DBClient) {
  const samples = [
    { pseudonym: 'Aria', neurotype: 'Autistic', cohort: 'A', age_band: '25-40' },
    { pseudonym: 'Eli', neurotype: 'ADHD', cohort: 'A', age_band: '25-40' },
    { pseudonym: 'Sam', neurotype: 'AuDHD', cohort: 'A', age_band: '18-24' },
  ];
  for (const p of samples) {
    await db.ut_createParticipant({ ...p, consent_given: true, caregiver_assent: false });
  }
  const deadlines = [
    { label: 'NLnet Submission', due_date: '2026-08-01', owner: 'William', met: false },
    { label: 'ADA Title II Compliance', due_date: '2027-04-26', owner: 'Research', met: false },
    { label: 'eIDAS 2.0 EUDI Wallet', due_date: '2026-12-24', owner: 'Legal', met: false },
  ];
  for (const d of deadlines) {
    await db.ut_upsertDeadline(d);
  }
}

// ---------- helpers ----------
function avg(arr: any[], key: string): number {
  const vals = arr.map((x) => x[key]).filter((v) => typeof v === 'number');
  if (!vals.length) return 0;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

function groupBy(arr: any[], key: string): Record<string, number> {
  return arr.reduce((acc: Record<string, number>, item) => {
    const val = String(item[key]);
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
}

function wcagPassRate(sessions: any[]): number {
  const withWcag = sessions.filter((s) => s.wcag_json);
  if (!withWcag.length) return 0;
  const pass = withWcag.filter((s) => {
    try { return JSON.parse(s.wcag_json).pass === true; } catch { return false; }
  }).length;
  return Math.round((pass / withWcag.length) * 100);
}

function spoonFit(sessions: any[]): string {
  if (!sessions.length) return 'neutral';
  const diffs = sessions.map((s) => s.spoons_end - s.spoons_start);
  const a = diffs.reduce((x, y) => x + y, 0) / diffs.length;
  return a < 0 ? 'energy-draining' : a > 0 ? 'energy-restoring' : 'neutral';
}
