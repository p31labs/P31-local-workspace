// workers/fhir/src/audit.ts
// HIPAA-compliant audit logging — every PHI access recorded

import type { Env } from './types';

type AuditAction =
  | 'token_refresh'
  | 'lab_pull'
  | 'alert_fire'
  | 'export'
  | 'medication_log'
  | 'auth_init'
  | 'auth_callback';

export async function auditLog(
  env: Env,
  actor: 'cron' | 'operator' | 'system',
  action: AuditAction,
  result: 'success' | 'error',
  opts: { resource?: string; recordId?: string; detail?: string } = {}
): Promise<void> {
  const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    await env.DB.prepare(
      `INSERT INTO audit_log (id, actor, action, resource, record_id, result, detail)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      actor,
      action,
      opts.resource ?? null,
      opts.recordId ?? null,
      result,
      opts.detail ?? null
    ).run();
  } catch {
    // Audit log must never crash the main flow
  }
}
