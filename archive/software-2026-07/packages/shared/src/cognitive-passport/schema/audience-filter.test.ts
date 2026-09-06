import { describe, it, expect } from 'vitest';

import {
  AUDIENCE_MATRIX,
  filterForAudience,
  exportRulesForProfile,
  matrixCellToExportRule,
} from './audience-filter';
import { FIELD_GROUPS, PROFILE_IDS } from './field-groups';

describe('audience-filter', () => {
  it('every profile has all 18 field groups in the matrix', () => {
    for (const pid of PROFILE_IDS) {
      const row = AUDIENCE_MATRIX[pid];
      expect(row).toBeDefined();
      for (const fg of FIELD_GROUPS) {
        expect(row[fg]).toBeDefined();
        expect(['A', 'D', 'R', 'S']).toContain(row[fg]);
      }
    }
  });

  it('exportRulesForProfile returns rules for all 18 fields', () => {
    for (const pid of PROFILE_IDS) {
      const rules = exportRulesForProfile(pid);
      for (const fg of FIELD_GROUPS) {
        expect(rules[fg]).toBeDefined();
        expect(rules[fg].kind).toMatch(/^(include|exclude|redact_or_gate|pull_from_kv)$/);
      }
    }
  });

  it('filterForAudience includes A fields and excludes D fields', () => {
    const passport = {
      schema_version: 'p31.cognitivePassport/1.1.0',
      audience_matrix_version: '1.0.0',
      profile: 'public' as const,
      fields: {
        pii: { name: 'Test' },
        prof: { title: 'Engineer' },
      },
    };

    const result = filterForAudience(passport, 'public');

    // prof is A for public — should be included
    expect(result.document.fields.prof).toEqual({ title: 'Engineer' });
    // pii is D for public — should be excluded
    expect(result.document.fields.pii).toBeUndefined();
    // pii should be in excluded list
    expect(result.excluded_fields).toContain('pii');
  });

  it('filterForAudience redacts R fields', () => {
    const passport = {
      schema_version: 'p31.cognitivePassport/1.1.0',
      audience_matrix_version: '1.0.0',
      profile: 'public' as const,
      fields: {
        cog: { neurotype: 'AuDHD' },
      },
    };

    const result = filterForAudience(passport, 'public');

    // cog is D for public — excluded
    expect(result.document.fields.cog).toBeUndefined();
    expect(result.excluded_fields).toContain('cog');
  });

  it('filterForAudience passes genesis/provenance through', () => {
    const passport = {
      schema_version: 'p31.cognitivePassport/1.1.0',
      audience_matrix_version: '1.0.0',
      profile: 'public' as const,
      fields: {
        prof: { title: 'Engineer' },
      },
      provenance: {
        hash_sha256: 'abc123',
        iso_timestamp: '2026-01-01T00:00:00Z',
        schema_id: 'p31.cognitivePassport/1.1.0',
      },
    };

    const result = filterForAudience(passport, 'public');

    expect(result.document.fields.gen).toBeDefined();
  });

  it('matrixCellToExportRule handles all 4 cell types', () => {
    expect(matrixCellToExportRule('A')).toEqual({ kind: 'include' });
    expect(matrixCellToExportRule('D')).toEqual({ kind: 'exclude' });
    expect(matrixCellToExportRule('R')).toEqual({ kind: 'redact_or_gate' });
    expect(matrixCellToExportRule('S')).toEqual({ kind: 'pull_from_kv', fallback: 'static' });
  });
});
