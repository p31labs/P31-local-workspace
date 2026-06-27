import { describe, it, expect, beforeEach } from 'vitest';
import { generateKeyPair, hashPayload, uint8ArrayToBase64, generateNonce, generateMerkleProof } from '../../src/crypto/verify';

describe('K4 Crypto — Key Generation', () => {
  it('generates Ed25519 + ML-DSA-65 keypair with valid DID', async () => {
    const keys = await generateKeyPair();

    expect(keys.did).toMatch(/^did:key:z[A-Za-z0-9_-]+$/);
    expect(keys.ed25519.publicKey).toBeInstanceOf(Uint8Array);
    expect(keys.ed25519.publicKey.length).toBe(32);
    expect(keys.ed25519.privateKey.length).toBeGreaterThan(0);
    expect(keys.mldsa65.publicKey).toBeInstanceOf(Uint8Array);
    expect(keys.mldsa65.publicKey.length).toBe(1952);
    expect(keys.mldsa65.secretKey.length).toBeGreaterThan(0);
  });

  it('produces unique keypairs on repeated generation', async () => {
    const k1 = await generateKeyPair();
    const k2 = await generateKeyPair();

    expect(k1.did).not.toBe(k2.did);
    expect(k1.ed25519.publicKey).not.toEqual(k2.ed25519.publicKey);
    expect(k1.mldsa65.publicKey).not.toEqual(k2.mldsa65.publicKey);
  });
});

describe('K4 Crypto — Hash Utilities', () => {
  it('produces a 64-char hex SHA-256 hash', async () => {
    const hash = await hashPayload('tetrahedron-v2');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces deterministic hashes for identical payloads', async () => {
    const a = await hashPayload('payload-123');
    const b = await hashPayload('payload-123');
    expect(a).toBe(b);
  });

  it('produces distinct hashes for different payloads', async () => {
    const a = await hashPayload('alpha');
    const b = await hashPayload('beta');
    expect(a).not.toBe(b);
  });
});

describe('K4 Crypto — Merkle Proof Helper', () => {
  it('chains two hashes into a new SHA-256 proof', async () => {
    const prev = 'a'.repeat(64);
    const curr = 'b'.repeat(64);
    const proof = await generateMerkleProof(curr, prev);
    expect(proof).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('K4 Crypto — Encoding Utilities', () => {
  it('round-trips Uint8Array through base64', () => {
    const original = new Uint8Array([0x01, 0x02, 0x03, 0xab, 0xcd, 0xef]);
    const encoded = uint8ArrayToBase64(original);
    const decoded = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
    expect(decoded).toEqual(original);
  });
});

describe('K4 Crypto — Nonce Generation', () => {
  it('generates 64-char hex nonces', () => {
    const nonce = generateNonce();
    expect(nonce).toMatch(/^[a-f0-9]{64}$/);
  });

  it('generates unique nonces', () => {
    const n1 = generateNonce();
    const n2 = generateNonce();
    expect(n1).not.toBe(n2);
  });
});
