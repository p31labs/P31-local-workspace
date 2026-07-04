import { describe, it, expect } from 'vitest';
import { extractPublicKeyFromDID, verifyEd25519Signature } from '../verify';

describe('DID Key Extraction', () => {
  it('should extract 32-byte key from did:key with 0xed01 prefix', () => {
    const key = extractPublicKeyFromDID('did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK');
    expect(key).toBeInstanceOf(Uint8Array);
    expect(key.length).toBeGreaterThanOrEqual(32);
  });

  it('should throw on invalid DID format', () => {
    expect(() => extractPublicKeyFromDID('bad:did'))
      .toThrow(/Invalid DID format/);
  });
});

describe('Ed25519 Signature Verification — native WebCrypto pipeline', () => {
  it('should verify and reject a real Ed25519 signature', async () => {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true, ['sign', 'verify']
    );

    const publicKeyRaw = new Uint8Array(await crypto.subtle.exportKey('raw', keyPair.publicKey));
    const payload = JSON.stringify({ action: 'vote', proposalId: 'test' });
    const sigBytes = await crypto.subtle.sign('Ed25519', keyPair.privateKey, new TextEncoder().encode(payload));
    const signature = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));

    const publicKey = await crypto.subtle.importKey(
      'raw', publicKeyRaw, { name: 'Ed25519' }, false, ['verify']
    );

    expect(await crypto.subtle.verify(
      'Ed25519', publicKey,
      Uint8Array.from(atob(signature), c => c.charCodeAt(0)),
      new TextEncoder().encode(payload)
    )).toBe(true);

    expect(await crypto.subtle.verify(
      'Ed25519', publicKey,
      Uint8Array.from(atob(signature), c => c.charCodeAt(0)),
      new TextEncoder().encode(JSON.stringify({ action: 'hack' }))
    )).toBe(false);
  });
});
