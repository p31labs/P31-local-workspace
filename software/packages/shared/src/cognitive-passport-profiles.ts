/**
 * Audience projections for Cognitive Passport exports.
 *
 * **Source:** repo root `docs/COGNITIVE-PASSPORT-AUDIENCE-MATRIX.md` **v1.0.0 (LOCKED)**.
 * Cells are `A | D | R | S`; **S** ⇒ `pull_from_kv` ∪ `fallback: static` per matrix norm.
 *
 * @see docs/COGNITIVE-PASSPORT-AUDIENCE-MATRIX.md
 */

import { COGNITIVE_PASSPORT_SCHEMA } from './cognitive-passport-schema';

export const COGNITIVE_PASSPORT_AUDIENCE_MATRIX_VERSION = '1.0.0' as const;

export type MatrixCell = 'A' | 'D' | 'R' | 'S';

/** v5 field groups + Genesis (18 columns). Lowercase keys = JSON path segments. */
export const FIELD_GROUPS = [
  'pii',
  'med',
  'cog',
  'comm',
  'prof',
  'fam',
  'org',
  'leg',
  'ben',
  'fin',
  'work',
  'vault',
  'comms',
  'sched',
  'lex',
  'agt',
  'sent',
  'gen',
] as const;

export type FieldGroup = (typeof FIELD_GROUPS)[number];

export const PROFILE_IDS = [
  'cursor-agent',
  'claude-session',
  'clinician',
  'ssa',
  'court',
  'ada-support',
  'beta',
  'child',
  'grant-reviewer',
  'public',
  'sentinel',
  'family',
] as const;

export type PassportProfileId = (typeof PROFILE_IDS)[number];

/** Logical export instruction for one field group on a profile. */
export type ExportRule =
  | { kind: 'include' }
  | { kind: 'exclude' }
  | { kind: 'redact_or_gate' }
  | { kind: 'pull_from_kv'; fallback: 'static' };

export interface SerializationProfile {
  modality_order: Array<'written' | 'typed' | 'verbal'>;
  /** 0–12 scale; null if unknown (UI should collect static fallback). */
  bandwidth_spoons: number | null;
  fidelity: 'full' | 'lossy' | 'minimal';
  stale_since?: string;
}

export interface PassportExportProvenance {
  hash_sha256: string;
  iso_timestamp: string;
  schema_id: typeof COGNITIVE_PASSPORT_SCHEMA;
}

/** Bundle wire shape (future generator / DO projection). */
export interface CognitivePassportExportBundle {
  schema_version: typeof COGNITIVE_PASSPORT_SCHEMA;
  audience_matrix_version: typeof COGNITIVE_PASSPORT_AUDIENCE_MATRIX_VERSION;
  profile: PassportProfileId;
  serialization_profile: SerializationProfile;
  fields: Partial<Record<FieldGroup, ExportRule>>;
  provenance?: PassportExportProvenance;
  exported_at: string;
}

/**
 * Locked matrix — rows 1–8 of https://docs/COGNITIVE-PASSPORT-AUDIENCE-MATRIX.md
 * (Genesis column: cells are still `MatrixCell`; `gen` column uses A/D/R.)
 */
export const COGNITIVE_PASSPORT_AUDIENCE_MATRIX: Record<
  PassportProfileId,
  Record<FieldGroup, MatrixCell>
> = {
  'cursor-agent': {
    pii: 'R',
    med: 'R',
    cog: 'A',
    comm: 'A',
    prof: 'A',
    fam: 'R',
    org: 'A',
    leg: 'D',
    ben: 'D',
    fin: 'D',
    work: 'R',
    vault: 'D',
    comms: 'R',
    sched: 'R',
    lex: 'A',
    agt: 'A',
    sent: 'S',
    gen: 'A',
  },
  'claude-session': {
    pii: 'R',
    med: 'R',
    cog: 'A',
    comm: 'A',
    prof: 'A',
    fam: 'R',
    org: 'A',
    leg: 'D',
    ben: 'D',
    fin: 'D',
    work: 'R',
    vault: 'D',
    comms: 'R',
    sched: 'R',
    lex: 'A',
    agt: 'A',
    sent: 'S',
    gen: 'A',
  },
  clinician: {
    pii: 'A',
    med: 'A',
    cog: 'A',
    comm: 'A',
    prof: 'A',
    fam: 'R',
    org: 'R',
    leg: 'R',
    ben: 'R',
    fin: 'D',
    work: 'R',
    vault: 'D',
    comms: 'A',
    sched: 'A',
    lex: 'R',
    agt: 'R',
    sent: 'S',
    gen: 'A',
  },
  ssa: {
    pii: 'A',
    med: 'A',
    cog: 'A',
    comm: 'A',
    prof: 'A',
    fam: 'R',
    org: 'R',
    leg: 'R',
    ben: 'A',
    fin: 'D',
    work: 'A',
    vault: 'D',
    comms: 'A',
    sched: 'A',
    lex: 'D',
    agt: 'D',
    sent: 'R',
    gen: 'A',
  },
  court: {
    pii: 'A',
    med: 'R',
    cog: 'R',
    comm: 'R',
    prof: 'A',
    fam: 'A',
    org: 'R',
    leg: 'A',
    ben: 'R',
    fin: 'R',
    work: 'R',
    vault: 'D',
    comms: 'R',
    sched: 'R',
    lex: 'D',
    agt: 'D',
    sent: 'D',
    gen: 'A',
  },
  'ada-support': {
    pii: 'A',
    med: 'A',
    cog: 'A',
    comm: 'A',
    prof: 'R',
    fam: 'A',
    org: 'R',
    leg: 'R',
    ben: 'R',
    fin: 'R',
    work: 'R',
    vault: 'D',
    comms: 'A',
    sched: 'A',
    lex: 'R',
    agt: 'R',
    sent: 'S',
    gen: 'A',
  },
  beta: {
    pii: 'D',
    med: 'D',
    cog: 'R',
    comm: 'A',
    prof: 'R',
    fam: 'D',
    org: 'A',
    leg: 'D',
    ben: 'D',
    fin: 'D',
    work: 'R',
    vault: 'D',
    comms: 'D',
    sched: 'D',
    lex: 'R',
    agt: 'R',
    sent: 'D',
    gen: 'A',
  },
  child: {
    pii: 'R',
    med: 'R',
    cog: 'R',
    comm: 'R',
    prof: 'R',
    fam: 'R',
    org: 'R',
    leg: 'D',
    ben: 'D',
    fin: 'D',
    work: 'D',
    vault: 'D',
    comms: 'R',
    sched: 'R',
    lex: 'D',
    agt: 'D',
    sent: 'D',
    gen: 'R',
  },
  'grant-reviewer': {
    pii: 'D',
    med: 'D',
    cog: 'D',
    comm: 'A',
    prof: 'A',
    fam: 'D',
    org: 'A',
    leg: 'D',
    ben: 'D',
    fin: 'A',
    work: 'D',
    vault: 'D',
    comms: 'D',
    sched: 'D',
    lex: 'D',
    agt: 'D',
    sent: 'D',
    gen: 'A',
  },
  public: {
    pii: 'D',
    med: 'D',
    cog: 'D',
    comm: 'D',
    prof: 'A',
    fam: 'D',
    org: 'A',
    leg: 'D',
    ben: 'D',
    fin: 'D',
    work: 'D',
    vault: 'D',
    comms: 'D',
    sched: 'D',
    lex: 'D',
    agt: 'D',
    sent: 'D',
    gen: 'A',
  },
  sentinel: {
    pii: 'R',
    med: 'A',
    cog: 'A',
    comm: 'A',
    prof: 'A',
    fam: 'R',
    org: 'A',
    leg: 'D',
    ben: 'R',
    fin: 'A',
    work: 'D',
    vault: 'D',
    comms: 'A',
    sched: 'A',
    lex: 'A',
    agt: 'A',
    sent: 'S',
    gen: 'A',
  },
  family: {
    pii: 'R',
    med: 'R',
    cog: 'R',
    comm: 'A',
    prof: 'R',
    fam: 'A',
    org: 'D',
    leg: 'D',
    ben: 'D',
    fin: 'D',
    work: 'D',
    vault: 'D',
    comms: 'A',
    sched: 'R',
    lex: 'D',
    agt: 'D',
    sent: 'D',
    gen: 'A',
  },
};

/** Profile gated until mesh device activation (matrix row 8 notes). */
export const PASSPORT_PROFILE_MESH_GATED: PassportProfileId[] = ['child'];

export function matrixCellToExportRule(cell: MatrixCell): ExportRule {
  switch (cell) {
    case 'A':
      return { kind: 'include' };
    case 'D':
      return { kind: 'exclude' };
    case 'R':
      return { kind: 'redact_or_gate' };
    case 'S':
      return { kind: 'pull_from_kv', fallback: 'static' };
  }
}

/** Derive per-field export rules for a profile (no Context resolution). */
export function exportRulesForProfile(profile: PassportProfileId): Record<FieldGroup, ExportRule> {
  const row = COGNITIVE_PASSPORT_AUDIENCE_MATRIX[profile];
  const out = {} as Record<FieldGroup, ExportRule>;
  for (const fg of FIELD_GROUPS) {
    out[fg] = matrixCellToExportRule(row[fg]);
  }
  return out;
}

/** True when matrix norm requires `serialization_profile` on the wire (Cog = A). */
export function requiresSerializationProfile(profile: PassportProfileId): boolean {
  const row = COGNITIVE_PASSPORT_AUDIENCE_MATRIX[profile];
  return row.cog === 'A';
}
