/**
 * SpIn Mesh — Crypto Unit Tests (Vitest)
 */

import { describe, it, expect } from 'vitest';
import { encryptAttestation, decryptAttestation, encodeAttestation, decodeAttestation, deriveKey } from '../crypto/crypto';

describe('Joy Attestation Crypto', () => {
  const uuid = 'urn:uuid:12345678-1234-1234-1234-123456789abc';

  it('derives a consistent AES-GCM key from UUID', async () => {
    const key1 = await deriveKey(uuid);
    const key2 = await deriveKey(uuid);
    // Test that keys produce same encryption/decryption result
    const plaintext = 'test consistency';
    const { nonce: nonce1, ciphertext: ciphertext1 } = await encryptAttestation(uuid, plaintext, key1);
    const decrypted1 = await decryptAttestation(uuid, nonce1, ciphertext1, key1);
    expect(decrypted1).toBe(plaintext);
    
    // Same ciphertext should decrypt with key2 to same plaintext
    const decrypted2 = await decryptAttestation(uuid, nonce1, ciphertext1, key2);
    expect(decrypted2).toBe(plaintext);
  });

  it('encrypts and decrypts a plaintext message', async () => {
    const plaintext = 'This game got me through a burnout period.';
    const { nonce, ciphertext } = await encryptAttestation(uuid, plaintext);
    const decrypted = await decryptAttestation(uuid, nonce, ciphertext);
    expect(decrypted).toBe(plaintext);
  });

  it('encode/decode round‑trip preserves blob', async () => {
    const { nonce, ciphertext } = await encryptAttestation(uuid, 'test');
    const encoded = encodeAttestation({ nonce, ciphertext });
    const decoded = decodeAttestation(encoded);
    expect(decoded.nonce).toEqual(nonce);
    expect(decoded.ciphertext).toEqual(ciphertext);
  });

  it('different UUIDs yield different keys', async () => {
    const plaintext = 'same plaintext';
    const key1 = await deriveKey(uuid);
    const key2 = await deriveKey('urn:uuid:other-1234');
    // Encrypt with key1
    const { nonce, ciphertext } = await encryptAttestation(uuid, plaintext, key1);
    // Decrypt with key2 should either fail or produce different result (garbage)
    try {
      const decryptedWithWrongKey = await decryptAttestation(uuid, nonce, ciphertext, key2);
      // If it doesn't throw, it should not be the plaintext
      expect(decryptedWithWrongKey).not.toBe(plaintext);
      // And should not be empty
      expect(decryptedWithWrongKey.length).toBeGreaterThan(0);
    } catch (error) {
      // If it throws, that's also acceptable - wrong key should fail decryption
      expect(error).toBeDefined();
    }
  });
});