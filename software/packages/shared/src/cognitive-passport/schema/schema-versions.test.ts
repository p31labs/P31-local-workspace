import { describe, it, expect } from 'vitest';
import { normalize, isVersionSupported } from './schema-versions';

describe('schema-versions', () => {
  it('normalizes a minimal passport', () => {
    const result = normalize({});
    expect(result.schema_version).toBe('p31.cognitivePassport/1.1.0');
    expect(result.fields).toBeDefined();
    expect(result.profile).toBeDefined();
  });

  it('normalizes a v1.0.0 passport', () => {
    const v1Doc = {
      schema_version: 'p31.cognitivePassport/1.0.0',
      profile: 'clinician',
      fields: {
        pii: { name: 'Test' },
      },
      provenance: {
        hash_sha256: 'abc',
        iso_timestamp: '2026-01-01T00:00:00Z',
        schema_id: 'p31.cognitivePassport/1.0.0',
      },
    };

    const result = normalize(v1Doc);
    expect(result.schema_version).toBe('p31.cognitivePassport/1.1.0');
    expect(result.profile).toBe('clinician');
  });

  it('preserves existing profile', () => {
    const result = normalize({ profile: 'court' });
    expect(result.profile).toBe('court');
  });

  it('sets default profile to public when missing', () => {
    const result = normalize({});
    expect(result.profile).toBe('public');
  });

  it('isVersionSupported checks correctly', () => {
    expect(isVersionSupported('p31.cognitivePassport/1.1.0')).toBe(true);
    expect(isVersionSupported('p31.cognitivePassport/1.0.0')).toBe(true);
    expect(isVersionSupported('p31.cognitivePassport/2.0.0')).toBe(false);
  });

  it('throws on non-object input', () => {
    expect(() => normalize(null)).toThrow('Invalid passport');
    expect(() => normalize('string')).toThrow('Invalid passport');
  });
});
