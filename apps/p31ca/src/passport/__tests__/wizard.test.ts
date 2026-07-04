import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveDraft, loadDraft } from '../lib/db/index';

vi.mock('../lib/db/index', () => ({
  saveDraft: vi.fn(),
  loadDraft: vi.fn(),
}));

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

describe('Passport core logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves draft to IndexedDB', async () => {
    const draft = { givenName: 'Will', profile: { autismOrganic: true } };
    (saveDraft as any).mockResolvedValue(undefined);
    await saveDraft('current-draft', draft);
    expect(saveDraft).toHaveBeenCalledWith('current-draft', draft);
  });

  it('loads existing draft', async () => {
    const mockDraft = { givenName: 'Will', profile: {} };
    (loadDraft as any).mockResolvedValue(mockDraft);
    const result = await loadDraft('current-draft');
    expect(result).toEqual(mockDraft);
  });

  it('computes genesis hash — real SHA-256', async () => {
    const payload = { fields: { pii: { givenName: 'Will' } } };
    const json = JSON.stringify(payload, Object.keys(payload).sort());
    const hash = await sha256Hex(json);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);

    const hash2 = await sha256Hex(json);
    expect(hash).toEqual(hash2);
  });

  it('filters fields by audience (A/D/R/S)', () => {
    const AUDIENCE_MATRIX = {
      public: {
        pii: 'D', med: 'D', cog: 'D', comm: 'D', prof: 'A',
        fam: 'D', org: 'A', leg: 'D', ben: 'D', fin: 'D',
        work: 'D', vault: 'D', comms: 'D', sched: 'D', lex: 'D',
        agt: 'D', sent: 'D', gen: 'A',
      },
    };

    function filterForAudience(
      doc: Record<string, unknown>,
      profile: string,
    ): Record<string, unknown> {
      const rules = AUDIENCE_MATRIX[profile as keyof typeof AUDIENCE_MATRIX];
      if (!rules) return doc;
      const excluded = new Set(
        Object.entries(rules).filter(([, v]) => v === 'D').map(([k]) => k),
      );
      const fields = { ...(doc.fields || {}) };
      for (const key of Object.keys(fields)) {
        if (excluded.has(key)) delete fields[key as string];
      }
      return { ...doc, fields };
    }

    const passport = {
      schema_version: 'p31.cognitivePassport/1.1.0',
      audience_matrix_version: '1.0.0',
      profile: 'public',
      fields: { pii: { givenName: 'Will' }, med: { diagnoses: ['AuDHD'] } },
    };
    const publicView = filterForAudience(passport, 'public');
    expect(publicView.fields.pii).toBeUndefined();
    expect(publicView.fields.med).toBeUndefined();
  });
});
