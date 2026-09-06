import { describe, it, expect, beforeAll } from 'vitest';
import { computeGenesisHash, verifyGenesisHash } from './genesis';

describe('genesis', () => {
  it('computes a deterministic SHA-256 hash', async () => {
    const payload = { test: 'hello', num: 42 };
    const hash1 = await computeGenesisHash(payload);
    const hash2 = await computeGenesisHash(payload);

    expect(hash1.hash_sha256).toBe(hash2.hash_sha256);
    expect(hash1.hash_sha256.length).toBe(64); // 256 bits = 64 hex chars
  });

  it('includes correct schema_id', async () => {
    const result = await computeGenesisHash({}, 'p31.cognitivePassport/1.1.0');
    expect(result.schema_id).toBe('p31.cognitivePassport/1.1.0');
  });

  it('includes iso_timestamp', async () => {
    const result = await computeGenesisHash({});
    expect(result.iso_timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('produces different hashes for different payloads', async () => {
    const hash1 = await computeGenesisHash({ a: 1 });
    const hash2 = await computeGenesisHash({ a: 2 });
    expect(hash1.hash_sha256).not.toBe(hash2.hash_sha256);
  });

  it('is deterministic regardless of key order', async () => {
    const hash1 = await computeGenesisHash({ a: 1, b: 2 });
    const hash2 = await computeGenesisHash({ b: 2, a: 1 });
    expect(hash1.hash_sha256).toBe(hash2.hash_sha256);
  });

  it('verifyGenesisHash returns true for matching hash', async () => {
    const payload = { foo: 'bar' };
    const genesis = await computeGenesisHash(payload);
    const valid = await verifyGenesisHash(payload, genesis.hash_sha256);
    expect(valid).toBe(true);
  });

  it('verifyGenesisHash returns false for wrong hash', async () => {
    const payload = { foo: 'bar' };
    const valid = await verifyGenesisHash(payload, '0000000000000000000000000000000000000000000000000000000000000000');
    expect(valid).toBe(false);
  });
});
