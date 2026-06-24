import { describe, it, expect } from 'vitest';
import {
  forgeIdentity,
  signCovenant,
  simulateForging,
  bytesToHex,
  hexToBytes,
} from '../forge';

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

describe('bytesToHex / hexToBytes', () => {
  it('round-trips Uint8Array through hex', () => {
    const original = new Uint8Array([0, 16, 255, 128]);
    const hex = bytesToHex(original);
    expect(hex).toBe('0010ff80');
    const decoded = hexToBytes(hex);
    expect(decoded).toEqual(original);
  });

  it('produces leading zeros correctly', () => {
    expect(bytesToHex(new Uint8Array([0, 0, 1]))).toBe('000001');
  });

  it('rejects odd-length hex strings', () => {
    expect(() => hexToBytes('abc')).toThrow('Invalid hex string');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SIMULATE FORGING (no browser crypto required)
// ─────────────────────────────────────────────────────────────────────────────

describe('simulateForging', () => {
  it('returns a structurally valid ForgeResult', () => {
    const result = simulateForging('TestUser', 'will');

    expect(result.keypair.publicKey).toHaveLength(64);
    expect(result.keypair.privateKey).toHaveLength(64);
    expect(result.identity.alias).toBe('TestUser');
    expect(result.identity.vertex).toBe('will');
    expect(result.identity.publicKey).toBe(result.keypair.publicKey);
    expect(result.identity.covenantSigned).toBe(false);
    expect(result.identity.id).toMatch(/^si_sim_/);
    expect(result.identity.genesisHash).toMatch(/^sim_/);
  });

  it('generates different keys per invocation', () => {
    const a = simulateForging('A', 'will');
    const b = simulateForging('B', 'will');
    expect(a.keypair.publicKey).not.toBe(b.keypair.publicKey);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FORGE IDENTITY (requires @noble/ed25519 + WebCrypto)
// ─────────────────────────────────────────────────────────────────────────────

describe('forgeIdentity', () => {
  it('returns a valid Ed25519 keypair and identity', async () => {
    const result = await forgeIdentity('S.J.', 'sj');

    expect(result.keypair.publicKey).toHaveLength(64);
    expect(result.keypair.privateKey).toHaveLength(64);
    expect(result.identity.alias).toBe('S.J.');
    expect(result.identity.vertex).toBe('sj');
    expect(result.identity.genesisHash).toHaveLength(64);
    expect(result.identity.covenantSigned).toBe(false);
    expect(result.identity.createdAt).toBeTruthy();
  }, 15000);
});

// ─────────────────────────────────────────────────────────────────────────────
// SIGN COVENANT
// ─────────────────────────────────────────────────────────────────────────────

describe('signCovenant', () => {
  it('produces a detached Ed25519 signature', async () => {
    const { keypair } = await forgeIdentity('W.J.', 'wj');
    const payload = {
      type: 'p31.sovereign_covenant/1.0.0',
      clauses: ['test'],
    };

    const { signature, publicKey } = await signCovenant(payload, keypair.privateKey);

    expect(signature).toHaveLength(128);
    expect(publicKey).toBe(keypair.publicKey);
  }, 15000);
});
