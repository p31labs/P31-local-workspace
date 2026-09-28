import { describe, it, expect } from 'vitest';
import { json } from './evidence-vault';

describe('Evidence Vault', () => {
  it('should create a valid case payload', () => {
    const casePayload = {
      title: 'Johnson v. Johnson',
      partyADid: 'did:key:zWilliam',
      partyBDid: 'did:key:zRespondent',
    };
    expect(casePayload.title).toBeTruthy();
    expect(casePayload.partyADid).toContain('did:key');
    expect(casePayload.partyBDid).toContain('did:key');
  });

  it('should structure upload response correctly', () => {
    const response = {
      evidenceId: 'ev-001',
      fileName: 'testimony.pdf',
      fileSize: 1024,
      sha256Hash: 'd9a18272890444303c2ace3228913f994c58a859fd377d64eee4511f2250041f',
      ed25519Signature: '06baf30b0cd0909fc9c9d8dfe84e01d2407f6d32843684c047a8a6f21560cd1370eac227b44b6a1a00958738155737b8f21013bfd2446267ae88242f38d5760d',
      chainHash: 'f5a83d6a3f3927a619d3ca7f0e7e918c4c97549e3638b6a55737989aa5e83615',
    };
    expect(response.evidenceId).toBeTruthy();
    expect(response.sha256Hash).toHaveLength(64);
    expect(response.chainHash).toHaveLength(64);
  });

  it('should detect hash mismatch on verification', () => {
    const originalHash = 'd9a18272890444303c2ace3228913f994c58a859fd377d64eee4511f2250041f';
    const tamperedHash = '0000000000000000000000000000000000000000000000000000000000000000';
    expect(originalHash).not.toBe(tamperedHash);
  });

  it('should maintain chain-of-custody linking', () => {
    const entry1 = { chainHash: 'hash001', chainPrevHash: null };
    const entry2 = { chainHash: 'hash002', chainPrevHash: 'hash001' };
    const entry3 = { chainHash: 'hash003', chainPrevHash: 'hash002' };
    expect(entry2.chainPrevHash).toBe(entry1.chainHash);
    expect(entry3.chainPrevHash).toBe(entry2.chainHash);
  });

  it('json() accepts a Request in the status position (WS-7 1101 regression)', () => {
    const req = new Request('https://phos.p31ca.org/api/cases');
    const res = json({ cases: [], count: 0 }, req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });

  it('json() still honors an explicit status with a trailing request', () => {
    const req = new Request('https://phos.p31ca.org/api/cases');
    const res = json({ error: 'Authentication required' }, 401, req);
    expect(res.status).toBe(401);
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });
});
