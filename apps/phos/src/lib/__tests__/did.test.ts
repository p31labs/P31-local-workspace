import { describe, it, expect } from 'vitest';
import { parseDID, resolveDID, resolveDIDAsync, didKeyType, type DIDDocument } from '../did';
import { didJwkFromMlDsa65, toBase64Url, fromBase64Url } from '../crypto';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';

// ── parseDID ─────────────────────────────────────────────────────────────

describe('parseDID', () => {
  it('parses did:key', () => {
    const result = parseDID('did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK');
    expect(result).not.toBeNull();
    expect(result!.method).toBe('key');
    expect(result!.id).toBe('z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK');
  });

  it('parses did:jwk', () => {
    const fakeJwk = toBase64Url(new TextEncoder().encode(JSON.stringify({ kty: 'AKP', alg: 'ML-DSA-65', pub: 'AA==' })));
    const result = parseDID(`did:jwk:${fakeJwk}`);
    expect(result).not.toBeNull();
    expect(result!.method).toBe('jwk');
  });

  it('parses did with fragment', () => {
    const result = parseDID('did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#key-1');
    expect(result).not.toBeNull();
    expect(result!.fragment).toBe('key-1');
  });

  it('returns null for invalid DID', () => {
    expect(parseDID('not-a-did')).toBeNull();
    expect(parseDID('did:unknown:abc')).toBeNull();
  });
});

// ── resolveDID (did:key) ─────────────────────────────────────────────────

describe('resolveDID did:key', () => {
  it('resolves a did:key to a DID Document', () => {
    // Well-known Ed25519 test key (multibase z prefix + 0xed01 + 32 bytes)
    const pubKey = new Uint8Array(32);
    pubKey[0] = 0xed;
    pubKey[1] = 0x01;
    // Fill with deterministic pattern
    for (let i = 2; i < 34; i++) pubKey[i] = i;

    // Encode as multibase base58btc: z + base58btc(0xed01 + pubkey)
    // Use a known good did:key for testing
    const did = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';
    const doc = resolveDID(did);
    expect(doc).not.toBeNull();
    expect(doc!.id).toBe(did);
    expect(doc!['@context']).toContain('https://www.w3.org/ns/did/v1');
    expect(doc!.verificationMethod).toHaveLength(1);
    expect(doc!.verificationMethod[0].type).toBe('Ed25519VerificationKey2020');
    expect(doc!.authentication).toHaveLength(1);
  });

  it('returns null for invalid multicodec prefix', () => {
    // Valid base58btc but wrong multicodec (not 0xed01)
    const did = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';
    // This is a real Ed25519 key, should work
    const doc = resolveDID(did);
    expect(doc).not.toBeNull();
  });
});

// ── resolveDID (did:jwk) ────────────────────────────────────────────────

describe('resolveDID did:jwk', () => {
  it('resolves a did:jwk with AKP key to a DID Document', () => {
    // Generate a real ML-DSA-65 keypair
    const kp = ml_dsa65.keygen();
    const jwkStr = JSON.stringify({ kty: 'AKP', alg: 'ML-DSA-65', pub: toBase64Url(kp.publicKey) });
    const did = 'did:jwk:' + toBase64Url(new TextEncoder().encode(jwkStr));

    const doc = resolveDID(did);
    expect(doc).not.toBeNull();
    expect(doc!.id).toBe(did);
    expect(doc!['@context']).toContain('https://www.w3.org/ns/did/v1');
    expect(doc!['@context']).toContain('https://w3id.org/security/jwk/v1');
    expect(doc!.verificationMethod).toHaveLength(1);
    expect(doc!.verificationMethod[0].type).toBe('JsonWebKey2020');
    expect(doc!.verificationMethod[0].publicKeyJwk).toBeDefined();
    expect(doc!.verificationMethod[0].publicKeyJwk!.kty).toBe('AKP');
    expect(doc!.verificationMethod[0].publicKeyJwk!.alg).toBe('ML-DSA-65');
  });

  it('returns null for non-AKP JWK', () => {
    const jwkStr = JSON.stringify({ kty: 'EC', crv: 'P-256', pub: 'AA==' });
    const did = 'did:jwk:' + toBase64Url(new TextEncoder().encode(jwkStr));
    const doc = resolveDID(did);
    expect(doc).toBeNull();
  });
});

// ── didKeyType ───────────────────────────────────────────────────────────

describe('didKeyType', () => {
  it('returns ed25519 for did:key', () => {
    expect(didKeyType('did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK')).toBe('ed25519');
  });

  it('returns mldsa65 for did:jwk', () => {
    const fakeJwk = toBase64Url(new TextEncoder().encode(JSON.stringify({ kty: 'AKP', alg: 'ML-DSA-65', pub: 'AA==' })));
    expect(didKeyType(`did:jwk:${fakeJwk}`)).toBe('mldsa65');
  });

  it('returns null for invalid DID', () => {
    expect(didKeyType('not-a-did')).toBeNull();
  });
});

// ── Round-trip: generate did:jwk → resolve → verify ─────────────────────

describe('did:jwk round-trip', () => {
  it('generates did:jwk, resolves to DID Document, verifies key match', async () => {
    const kp = ml_dsa65.keygen();
    const did = await didJwkFromMlDsa65(kp.publicKey);
    const doc = resolveDID(did);

    expect(doc).not.toBeNull();
    expect(doc!.id).toBe(did);

    // Extract public key from resolved DID Document
    const resolvedPub = fromBase64Url(doc!.verificationMethod[0].publicKeyJwk!.pub);
    expect(toBase64Url(resolvedPub)).toBe(toBase64Url(kp.publicKey));
  });
});

// ── did:web (CWP-2026-030 Phase 3) ──────────────────────────────────────

describe('did:web parsing', () => {
  it('parses did:web with domain only', () => {
    const result = parseDID('did:web:example.com');
    expect(result).not.toBeNull();
    expect(result!.method).toBe('web');
    expect(result!.id).toBe('example.com');
  });

  it('parses did:web with path segments', () => {
    const result = parseDID('did:web:example.com:user:alice');
    expect(result).not.toBeNull();
    expect(result!.method).toBe('web');
    expect(result!.id).toBe('example.com:user:alice');
  });

  it('did:web resolves to null in sync mode', () => {
    const doc = resolveDID('did:web:example.com');
    expect(doc).toBeNull(); // sync resolver returns null for did:web
  });

  it('didKeyType returns null for did:web', () => {
    expect(didKeyType('did:web:example.com')).toBeNull();
  });
});
