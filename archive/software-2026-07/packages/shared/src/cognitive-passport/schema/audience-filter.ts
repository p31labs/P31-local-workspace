import {
  FIELD_GROUPS,
  PROFILE_IDS,
  type FieldGroup,
  type PassportProfileId,
  AUDIENCE_MATRIX_VERSION,
} from './field-groups';

export type MatrixCell = 'A' | 'D' | 'R' | 'S';

export type ExportRule =
  | { kind: 'include' }
  | { kind: 'exclude' }
  | { kind: 'redact_or_gate' }
  | { kind: 'pull_from_kv'; fallback: 'static' };

export interface PassportDocument {
  schema_version: string;
  audience_matrix_version: string;
  profile: PassportProfileId;
  fields: Partial<Record<FieldGroup, unknown>>;
  provenance?: {
    hash_sha256: string;
    iso_timestamp: string;
    schema_id: string;
    signed_by?: {
      ed25519?: string;
      ml_dsa?: string | null;
    };
  };
}

export interface AudienceFilterResult {
  document: PassportDocument;
  redacted_fields: FieldGroup[];
  excluded_fields: FieldGroup[];
  kv_fallback_fields: FieldGroup[];
}

export const AUDIENCE_MATRIX: Record<PassportProfileId, Record<FieldGroup, MatrixCell>> = {
  'cursor-agent': {
    pii: 'R', med: 'R', cog: 'A', comm: 'A', prof: 'A',
    fam: 'R', org: 'A', leg: 'D', ben: 'D', fin: 'D',
    work: 'R', vault: 'D', comms: 'R', sched: 'R', lex: 'A',
    agt: 'A', sent: 'S', gen: 'A',
  },
  'claude-session': {
    pii: 'R', med: 'R', cog: 'A', comm: 'A', prof: 'A',
    fam: 'R', org: 'A', leg: 'D', ben: 'D', fin: 'D',
    work: 'R', vault: 'D', comms: 'R', sched: 'R', lex: 'A',
    agt: 'A', sent: 'S', gen: 'A',
  },
  clinician: {
    pii: 'A', med: 'A', cog: 'A', comm: 'A', prof: 'A',
    fam: 'R', org: 'R', leg: 'R', ben: 'R', fin: 'D',
    work: 'R', vault: 'D', comms: 'A', sched: 'A', lex: 'R',
    agt: 'R', sent: 'S', gen: 'A',
  },
  ssa: {
    pii: 'A', med: 'A', cog: 'A', comm: 'A', prof: 'A',
    fam: 'R', org: 'R', leg: 'R', ben: 'A', fin: 'D',
    work: 'A', vault: 'D', comms: 'A', sched: 'A', lex: 'D',
    agt: 'D', sent: 'R', gen: 'A',
  },
  court: {
    pii: 'A', med: 'R', cog: 'R', comm: 'R', prof: 'A',
    fam: 'A', org: 'R', leg: 'A', ben: 'R', fin: 'R',
    work: 'R', vault: 'D', comms: 'R', sched: 'R', lex: 'D',
    agt: 'D', sent: 'D', gen: 'A',
  },
  'ada-support': {
    pii: 'A', med: 'A', cog: 'A', comm: 'A', prof: 'R',
    fam: 'A', org: 'R', leg: 'R', ben: 'R', fin: 'R',
    work: 'R', vault: 'D', comms: 'A', sched: 'A', lex: 'R',
    agt: 'R', sent: 'S', gen: 'A',
  },
  beta: {
    pii: 'D', med: 'D', cog: 'R', comm: 'A', prof: 'R',
    fam: 'D', org: 'A', leg: 'D', ben: 'D', fin: 'D',
    work: 'R', vault: 'D', comms: 'D', sched: 'D', lex: 'R',
    agt: 'R', sent: 'D', gen: 'A',
  },
  child: {
    pii: 'R', med: 'R', cog: 'R', comm: 'R', prof: 'R',
    fam: 'R', org: 'R', leg: 'D', ben: 'D', fin: 'D',
    work: 'D', vault: 'D', comms: 'R', sched: 'R', lex: 'D',
    agt: 'D', sent: 'D', gen: 'R',
  },
  'grant-reviewer': {
    pii: 'D', med: 'D', cog: 'D', comm: 'A', prof: 'A',
    fam: 'D', org: 'A', leg: 'D', ben: 'D', fin: 'A',
    work: 'D', vault: 'D', comms: 'D', sched: 'D', lex: 'D',
    agt: 'D', sent: 'D', gen: 'A',
  },
  public: {
    pii: 'D', med: 'D', cog: 'D', comm: 'D', prof: 'A',
    fam: 'D', org: 'A', leg: 'D', ben: 'D', fin: 'D',
    work: 'D', vault: 'D', comms: 'D', sched: 'D', lex: 'D',
    agt: 'D', sent: 'D', gen: 'A',
  },
  sentinel: {
    pii: 'R', med: 'A', cog: 'A', comm: 'A', prof: 'A',
    fam: 'R', org: 'A', leg: 'D', ben: 'R', fin: 'A',
    work: 'D', vault: 'D', comms: 'A', sched: 'A', lex: 'A',
    agt: 'A', sent: 'S', gen: 'A',
  },
  family: {
    pii: 'R', med: 'R', cog: 'R', comm: 'A', prof: 'R',
    fam: 'A', org: 'D', leg: 'D', ben: 'D', fin: 'D',
    work: 'D', vault: 'D', comms: 'A', sched: 'R', lex: 'D',
    agt: 'D', sent: 'D', gen: 'A',
  },
};

export function matrixCellToExportRule(cell: MatrixCell): ExportRule {
  switch (cell) {
    case 'A': return { kind: 'include' };
    case 'D': return { kind: 'exclude' };
    case 'R': return { kind: 'redact_or_gate' };
    case 'S': return { kind: 'pull_from_kv', fallback: 'static' };
  }
}

export function exportRulesForProfile(profile: PassportProfileId): Record<FieldGroup, ExportRule> {
  const row = AUDIENCE_MATRIX[profile];
  if (!row) throw new Error(`Unknown profile: ${profile}`);
  const out = {} as Record<FieldGroup, ExportRule>;
  for (const fg of FIELD_GROUPS) {
    out[fg] = matrixCellToExportRule(row[fg]);
  }
  return out;
}

export function filterForAudience(
  passport: PassportDocument,
  profile: PassportProfileId,
): AudienceFilterResult {
  const rules = exportRulesForProfile(profile);
  const filtered: Record<string, unknown> = {};
  const redacted_fields: FieldGroup[] = [];
  const excluded_fields: FieldGroup[] = [];
  const kv_fallback_fields: FieldGroup[] = [];

  for (const fg of FIELD_GROUPS) {
    if (fg === 'gen') {
      filtered[fg] = passport.provenance;
      continue;
    }
    const rule = rules[fg];
    const value = passport.fields[fg];

    switch (rule.kind) {
      case 'include':
        filtered[fg] = value;
        break;
      case 'exclude':
        excluded_fields.push(fg);
        break;
      case 'redact_or_gate':
        filtered[fg] = typeof value === 'object' && value !== null
          ? { redacted: true, type: typeof value, profile }
          : null;
        redacted_fields.push(fg);
        break;
      case 'pull_from_kv':
        filtered[fg] = value ?? { fallback: 'static', source: 'kv' };
        kv_fallback_fields.push(fg);
        break;
    }
  }

  return {
    document: {
      ...passport,
      profile,
      fields: filtered as Partial<Record<FieldGroup, unknown>>,
    },
    redacted_fields,
    excluded_fields,
    kv_fallback_fields,
  };
}

export function requiresSerializationProfile(profile: PassportProfileId): boolean {
  const row = AUDIENCE_MATRIX[profile];
  return row.cog === 'A';
}

export const PASSPORT_PROFILE_MESH_GATED: PassportProfileId[] = ['child'];
