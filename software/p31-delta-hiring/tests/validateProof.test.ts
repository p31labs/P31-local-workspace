import { describe, expect, it } from 'vitest';
import { parseProofJson } from '../src/lib/validateProof';

const minimal: unknown = {
  schema: 'p31.proofRecord/1.0.0',
  id: 'a1b2c3d4-e5f6-4a1b-9c0d-111122223333',
  created: '2026-01-01T00:00:00.000Z',
  updated: '2026-01-02T00:00:00.000Z',
  roleId: 'react-frontend-001',
  wcdId: 'WCD-FRONT-001',
  consent: { dataProcessing: true, shareWithReviewers: true, version: '1.0.0' },
  artifacts: [
    {
      id: 'art-1',
      kind: 'repo',
      label: 'Code',
      url: 'https://github.com/example/repo',
      commitSha: 'abc1234'
    }
  ],
  selfAssessment: { a11y: 3 },
  candidateNotes: 'Notes'
};

describe('parseProofJson', () => {
  it('accepts a valid minimal record', () => {
    const r = parseProofJson(minimal);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.schema).toBe('p31.proofRecord/1.0.0');
      expect(r.value.artifacts[0].commitSha).toBe('abc1234');
    }
  });
  it('rejects bad WCD id', () => {
    const bad = { ...(minimal as Record<string, unknown>), wcdId: 'nope' };
    const r = parseProofJson(bad);
    expect(r.ok).toBe(false);
  });
  it('rejects non-url artifact', () => {
    const bad = JSON.parse(JSON.stringify(minimal)) as Record<string, unknown>;
    const arts = (bad.artifacts as { url: string }[]);
    arts[0].url = 'not a url';
    const r = parseProofJson(bad);
    expect(r.ok).toBe(false);
  });
});
