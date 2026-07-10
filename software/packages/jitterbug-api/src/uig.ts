import type { Env } from './index';
import { generateInterface } from '@p31/interface-generator/generator';

const ROLES = ['coordinator', 'researcher', 'participant', 'grant-reviewer'] as const;

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

function clampSpoons(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.max(0, Math.min(5, Math.round(n)));
}

function sanitizeRole(value: unknown): (typeof ROLES)[number] {
  return (ROLES as readonly string[]).includes(value as string)
    ? (value as (typeof ROLES)[number])
    : 'participant';
}

/**
 * Server-side Universal Interface Generator endpoint.
 * Stateless: given a role + spoon state (+ optional passport/viewData) it returns
 * a declarative InterfaceDescription. No PII is read; the worker has no PHOS view
 * data, so callers may POST their own `viewData` for a richer layout.
 */
export function registerUigRoutes(publicRouter: any) {
  const handle = (role: unknown, spoons: unknown, passport: any, viewData: any) => {
    const safeRole = sanitizeRole(role);
    const safeSpoons = clampSpoons(spoons);
    const description = generateInterface({
      passport: passport ?? null,
      viewData: viewData ?? {},
      role: safeRole,
      spoons: safeSpoons,
    });
    return json({
      description,
      meta: { role: safeRole, spoons: safeSpoons, generatedAt: new Date().toISOString() },
    });
  };

  publicRouter.get('/uig/generate', async (request: any) => {
    const url = new URL(request.url);
    const role = url.searchParams.get('role') || 'participant';
    const spoons = url.searchParams.get('spoons');
    let passport: any = null;
    const raw = url.searchParams.get('passport');
    if (raw) {
      try { passport = JSON.parse(raw); } catch { passport = null; }
    }
    return handle(role, spoons, passport, null);
  });

  publicRouter.post('/uig/generate', async (request: any) => {
    let body: any = {};
    try { body = await request.json(); } catch { body = {}; }
    return handle(body.role, body.spoons, body.passport, body.viewData);
  });
}

export type { Env };
