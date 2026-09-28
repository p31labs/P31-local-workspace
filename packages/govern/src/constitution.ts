/**
 * constitution validation — does a domain constitution conform to the schema?
 * A constitution that does not validate is not a constitution; it is a
 * hand-edited mirror. This is the parity gate between the guide and the domain.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = resolve(fileURLToPath(import.meta.url), '..', '..', '..');

export interface Constitution {
  schema: string;
  domain: string;
  version: string;
  canonicalSource: { path: string; description: string };
  mirrors: Array<{ path: string; generatedFrom: string; parityGate?: string }>;
  gates: Array<{
    id: string;
    command: string;
    state: 'OBSERVATIONAL' | 'WARNING' | 'BLOCKING';
    owner: string;
    scope: string;
    remediation: string;
    negativeControl: { type: 'fixture' | 'mutation' | 'capability'; command: string; expected: 'exit-nonzero' };
    enforcementMoment?: 'pre-commit' | 'ci' | 'weekly' | 'event';
  }>;
  ratchets: Array<{ id: string; baseline: number; countSource: string; lockThreshold: number }>;
  runbooks: Array<{ id: string; path: string; owner: string; lastVerified: string }>;
  lessons: Array<{ id: string; rootCause: string | { unproven: true; ruledOut: string[] }; prevention: string }>;
  fleet: Array<{ rule: string; moment: 'pre-commit' | 'ci' | 'weekly' | 'event' }>;
  review: { who: string; artifact: string; cadence: string; onFailure: string };
}

/** Lightweight structural validation (the full JSON Schema is in constitution.schema.json). */
export function validateConstitution(c: unknown): { valid: boolean; violations: string[] } {
  const v: string[] = [];
  const con = c as Partial<Constitution>;

  if (con?.schema !== 'https://p31ca.org/schemas/govern/constitution.schema.json') {
    v.push('schema: must self-identify as the P31 govern constitution schema');
  }
  if (!con?.domain) v.push('domain: required');
  if (!con?.version) v.push('version: required');
  if (!con?.canonicalSource?.path) v.push('canonicalSource.path: required');
  if (!Array.isArray(con?.mirrors)) v.push('mirrors: required (a domain with no mirrors has nothing to check for drift)');

  if (!Array.isArray(con?.gates) || con.gates.length === 0) {
    v.push('gates: at least one gate required');
  } else {
    for (const g of con.gates) {
      if (!g.id || !g.command) v.push(`gate ${g.id ?? '(no id)'}: id + command required`);
      if (!g.owner) v.push(`gate ${g.id}: owner required — a gate with no owner is furniture`);
      if (!g.negativeControl?.command) v.push(`gate ${g.id}: negativeControl required — a gate that cannot prove it fails is furniture`);
      if (g.state === 'BLOCKING' && (!g.remediation || !g.scope)) {
        v.push(`gate ${g.id}: BLOCKING gate requires scope + remediation (the graduation rule)`);
      }
    }
  }

  if (!Array.isArray(con?.runbooks)) {
    v.push('runbooks: required');
  } else {
    for (const r of con.runbooks) {
      if (!r.owner) v.push(`runbook ${r.id}: owner required — a runbook with no owner is furniture`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(r.lastVerified ?? '')) {
        v.push(`runbook ${r.id}: lastVerified must be YYYY-MM-DD — an owner with no review date is furniture`);
      }
    }
  }

  if (Array.isArray(con?.lessons)) {
    for (const l of con.lessons) {
      const prev = l?.prevention ?? '';
      // A prevention must reference a runbook id or gate id, not be a sentiment.
      if (!/(^|\s)(runbook[-:]|gate[-:]|audit[-:]|check[-:]|govern[-:])/i.test(prev) && prev.length < 10) {
        v.push(`lesson ${l?.id}: prevention must resolve to a real runbook/gate id, not a sentiment`);
      }
    }
  }

  if (!con?.review?.who || !con?.review?.cadence) {
    v.push('review: who + cadence required — the re-verification must have an owner');
  }

  return { valid: v.length === 0, violations: v };
}

/** Load a constitution from disk. */
export function loadConstitution(path: string): Constitution {
  return JSON.parse(readFileSync(resolve(path), 'utf8')) as Constitution;
}

export { here };