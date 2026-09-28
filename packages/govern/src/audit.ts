/**
 * govern:audit — emit the structured audit event. Every domain constitution
 * returns the same shape: a pass emits a structured audit event, a fail emits
 * a violation + a required remedy. This is the "governance never drifts across
 * domains" contract — consumers of the audit stream get a uniform shape.
 */
import { Constitution } from './constitution.js';

export interface AuditEvent {
  domain: string;
  schemaVersion: string;
  timestamp: string;
  valid: boolean;
  violations: string[];
  selfTest: {
    gates: number;
    canFail: number;
    furniture: string[];
  };
  ratchets: Array<{
    id: string;
    baseline: number;
    ok: boolean;
    detail: string;
  }>;
}

export function buildAuditEvent(
  con: Constitution,
  validation: { valid: boolean; violations: string[] },
  selfTest: { gates: number; canFail: number; furniture: string[] },
  ratchetResults: Array<{ id: string; baseline: number; ok: boolean; detail: string }>,
): AuditEvent {
  return {
    domain: con.domain,
    schemaVersion: con.version,
    timestamp: new Date().toISOString(),
    valid: validation.valid,
    violations: validation.violations,
    selfTest,
    ratchets: ratchetResults,
  };
}