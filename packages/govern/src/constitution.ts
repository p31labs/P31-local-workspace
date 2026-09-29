/**
 * constitution — load and validate a domain's governance declaration.
 *
 * Two layers:
 *   1. Structural validation (this file) — the checks expressible as logic.
 *   2. Schema validation (constitution.schema.json) — the full contract.
 *
 * The structural layer is what the runtime depends on. The schema is the
 * interchange format for external consumers.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { Oqe, validateOqe } from './oqe.js';

export interface Credential {
  type: 'did:key' | 'sbt' | 'role' | 'system';
  id: string;
  issuer?: string;
  scope?: string;
}

export interface FourPartyReview {
  user: Credential;
  issuer: Credential;
  ledger: Credential;
  court: Credential;
}

export interface Gate {
  id: string;
  command: string;
  state: 'OBSERVATIONAL' | 'WARNING' | 'BLOCKING';
  owner: string | Credential[];
  scope: string;
  remediation: string;
  negativeControl: { type: 'fixture' | 'mutation' | 'capability'; command: string; expected: 'proof-marker' };
  enforcementMoment?: 'pre-commit' | 'ci' | 'weekly' | 'event';
  oqe: Oqe;
}

export interface Constitution {
  schema: string;
  domain: string;
  version: string;
  genesisTimestamp: string;
  resolutionRoot?: string;
  canonicalSource: { path: string; description: string; oqe: Oqe };
  mirrors: Array<{ path: string; generatedFrom: string; parityGate: string }>;
  gates: Gate[];
  ratchets: Array<{ id: string; baseline: number; countSource: string; lockThreshold: number }>;
  runbooks: Array<{ id: string; path: string; owner: string | Credential[]; lastVerified: string }>;
  lessons: Array<{ id: string; rootCause: string | { unproven: true; ruledOut: string[] }; prevention: string; oqe: Oqe }>;
  fleet: Array<{ rule: string; moment: 'pre-commit' | 'ci' | 'weekly' | 'event' }>;
  review: {
    who: FourPartyReview | Credential | Credential[] | string;
    cadence: string;
    onFailure: string;
    abdication: { afterCleanCycles: number; requiresHumanSignoff: true };
  };
  auditLog: { chainName: string; sink: 'jsonl-hash-chain' | 'stdout' };
  aspirational: string[];
}

export const SCHEMA_URI = 'https://p31ca.org/schemas/govern/constitution/0.3.0.json';

export function loadConstitution(path: string): Constitution {
  return JSON.parse(readFileSync(resolve(path), 'utf8')) as Constitution;
}

/** The directory the constitution lives in is the resolution root for its
 *  relative paths. This replaces the hardcoded /home/p31/... paths that made
 *  the runtime unportable (the Wye-to-Delta fix: distributed reference, not
 *  a single hardcoded point). */
export function constitutionRoot(constitutionPath: string): string {
  return dirname(resolve(constitutionPath));
}

/** Resolve a constitution-relative path against resolutionRoot (if declared) or the constitution's own dir. */
export function resolveFromConstitution(conPath: string, relative: string): string {
  const con = loadConstitution(conPath);
  const root = con.resolutionRoot
    ? resolve(dirname(resolve(conPath)), con.resolutionRoot)
    : dirname(resolve(conPath));
  return resolve(root, relative);
}

/**
 * Path-aware validation: runs validateConstitution plus the file-existence
 * checks that require knowing where the constitution lives — every runbook
 * path and every gate remediation must resolve to a file that exists. This
 * is the structural close on the green-by-syntax class: a remediation to a
 * missing runbook fails validation, not convention.
 */
export function validateConstitutionAt(conPath: string): { valid: boolean; violations: string[] } {
  const con = loadConstitution(conPath);
  const v = validateConstitution(con);
  if (!v.valid) return v;
  const problems: string[] = [];
  for (const r of con.runbooks ?? []) {
    const p = resolveFromConstitution(conPath, r.path);
    if (!existsSync(p)) problems.push(`runbook ${r.id}: file not found at ${p} (resolved from ${con.resolutionRoot ?? 'constitutionRoot'})`);
  }
  for (const g of con.gates ?? []) {
    const rel = g.remediation;
    if (!rel.startsWith('runbooks/') && !rel.startsWith('docs/')) continue;
    const p = resolveFromConstitution(conPath, rel);
    if (!existsSync(p)) problems.push(`gate ${g.id}: remediation file not found at ${p}`);
  }
  return { valid: v.valid && problems.length === 0, violations: [...v.violations, ...problems] };
}

function isFourParty(who: unknown): boolean {
  return !!who && typeof who === 'object' && !Array.isArray(who) &&
    'user' in (who as object) && 'issuer' in (who as object) &&
    'ledger' in (who as object) && 'court' in (who as object);
}

export function isFourPartyReview(who: unknown): boolean {
  return isFourParty(who);
}

export function validateConstitution(c: unknown): { valid: boolean; violations: string[] } {
  const v: string[] = [];
  const con = c as Partial<Constitution>;

  if (con?.schema !== SCHEMA_URI) {
    v.push(`schema: must be "${SCHEMA_URI}" (version-in-URI; a mismatched URI means the constitution predates the current schema)`);
  }
  if (!con?.domain) v.push('domain: required');
  if (!con?.version) v.push('version: required');
  if (!con?.genesisTimestamp) v.push('genesisTimestamp: required (the domain\'s Genesis Gate)');

  if (!con?.canonicalSource?.path) {
    v.push('canonicalSource.path: required');
  } else {
    v.push(...validateOqe(con.canonicalSource.oqe, 'canonicalSource'));
  }

  if (!Array.isArray(con?.mirrors) || con.mirrors.length === 0) {
    v.push('mirrors: at least one mirror required (a domain with no mirrors has nothing to check for drift)');
  } else {
    for (const m of con.mirrors) {
      if (!m.parityGate) v.push(`mirror ${m.path}: parityGate required (an unchecked mirror is a claim)`);
    }
  }

  if (!Array.isArray(con?.gates) || con.gates.length === 0) {
    v.push('gates: at least one gate required');
  } else {
    for (const g of con.gates) {
      if (!g.id || !g.command) v.push(`gate ${g.id ?? '(no id)'}: id + command required`);
      if (!g.owner) v.push(`gate ${g.id}: owner required — a gate with no owner is furniture`);
      if (!g.negativeControl?.command) {
        v.push(`gate ${g.id}: negativeControl required — a gate that cannot prove it fails is furniture`);
      }
      v.push(...validateOqe(g.oqe, `gate ${g.id}`));
      if (g.state === 'BLOCKING' && (!g.remediation || !g.scope)) {
        v.push(`gate ${g.id}: BLOCKING gate requires scope + remediation (the graduation rule)`);
      }
      if (!g.remediation?.startsWith('runbooks/RUNBOOK-') && !g.remediation?.startsWith('docs/')) {
        v.push(`gate ${g.id}: remediation must point at a runbook (runbooks/RUNBOOK-* or docs/*)`);
      }
    }
  }

  const blockingGates = (con.gates ?? []).filter((g) => g.state === 'BLOCKING');
  if (blockingGates.length > 0 && !isFourParty(con.review?.who)) {
    // The Scutum Fidei rule: a BLOCKING domain requires the four-party K4 topology.
    v.push(
      'review.who: a BLOCKING domain requires the four-party K4 topology (user, issuer, ledger, court). ' +
        'Three parties collapse to K3 — planar, no enclosed volume. Two is a line. One is a point.',
    );
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
    const runbookIds = new Set((con.runbooks ?? []).map((r) => r.id));
    const gateIds = new Set((con.gates ?? []).map((g) => g.id));
    for (const l of con.lessons) {
      const prev = l?.prevention ?? '';
      const refs = prev.split(/[+\s,]+/).map((s) => s.trim()).filter(Boolean);
      const resolvesToExisting = refs.some((r) => {
        const bare = r.replace(/^(runbook[-:]+|gate[-:]+)/i, '');
        return runbookIds.has(bare) || gateIds.has(bare) || runbookIds.has(r) || gateIds.has(r);
      });
      if (!resolvesToExisting) {
        v.push(`lesson ${l?.id}: prevention must resolve to an EXISTING runbook or gate id, not a sentiment`);
      }
      v.push(...validateOqe(l.oqe, `lesson ${l?.id}`));
    }
  }

  if (!con?.review?.cadence || !con?.review?.abdication?.afterCleanCycles) {
    v.push('review: cadence + abdication required — the re-verification must have an owner and an end state');
  }
  if (!con?.auditLog?.chainName) {
    v.push('auditLog.chainName: required — the audit trail must be named');
  }
  if (!Array.isArray(con?.aspirational)) {
    v.push('aspirational: required (an empty array is valid; the field makes the boundary explicit)');
  }

  return { valid: v.length === 0, violations: v };
}