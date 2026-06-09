import { describe, expect, it } from 'vitest';
import {
  COGNITIVE_PASSPORT_AUDIENCE_MATRIX,
  FIELD_GROUPS,
  PROFILE_IDS,
  exportRulesForProfile,
  matrixCellToExportRule,
  requiresSerializationProfile,
} from './cognitive-passport-profiles';

describe('cognitive-passport-profiles (audience matrix v1.0.0)', () => {
  it('has 12 profiles and 18 field groups', () => {
    expect(PROFILE_IDS.length).toBe(12);
    expect(FIELD_GROUPS.length).toBe(18);
    for (const id of PROFILE_IDS) {
      expect(Object.keys(COGNITIVE_PASSPORT_AUDIENCE_MATRIX[id]).length).toBe(18);
    }
  });

  it('maps S to pull_from_kv + fallback static', () => {
    const r = matrixCellToExportRule('S');
    expect(r.kind).toBe('pull_from_kv');
    if (r.kind === 'pull_from_kv') expect(r.fallback).toBe('static');
  });

  it('cursor-agent sent column is S', () => {
    expect(COGNITIVE_PASSPORT_AUDIENCE_MATRIX['cursor-agent'].sent).toBe('S');
    const rules = exportRulesForProfile('cursor-agent');
    expect(rules.sent.kind).toBe('pull_from_kv');
  });

  it('child profile blocks live sent', () => {
    expect(COGNITIVE_PASSPORT_AUDIENCE_MATRIX.child.sent).toBe('D');
  });

  it('requires serialization_profile when Cog column is A (not when R)', () => {
    expect(requiresSerializationProfile('cursor-agent')).toBe(true);
    expect(requiresSerializationProfile('ssa')).toBe(true);
    expect(requiresSerializationProfile('court')).toBe(false);
    expect(requiresSerializationProfile('child')).toBe(false);
  });
});
