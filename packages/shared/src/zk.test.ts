/**
 * zk.test.ts — Tests for HMAC-SHA256 zero-knowledge proof module
 */

import { describe, it, expect } from 'vitest';
import {
  generateNullifier,
  generateZKProof,
  verifyZKProof,
  proveClaim,
  proveClaimInSet,
  verifyClaimInSet,
} from './zk';

const secret = new TextEncoder().encode('p31-supersecret-test-key');

describe('ZK Proofs (HMAC-SHA256)', () => {
  it('generates a deterministic nullifier', async () => {
    const n1 = await generateNullifier('did:web:alice', 'careScore', secret);
    const n2 = await generateNullifier('did:web:alice', 'careScore', secret);
    expect(n1).toBe(n2);
    expect(n1.length).toBe(64);
  });

  it('generates different nullifiers for different claims', async () => {
    const n1 = await generateNullifier('did:web:alice', 'careScore', secret);
    const n2 = await generateNullifier('did:web:alice', 'trustTier', secret);
    expect(n1).not.toBe(n2);
  });

  it('generates and verifies a ZK proof for single claim', async () => {
    const proof = await proveClaim(
      { did: 'did:web:alice', claimKey: 'careScore', claimValue: '92' },
      secret,
    );

    expect(proof.leafHex).toBeDefined();
    expect(proof.rootHex).toBeDefined();
    expect(proof.nullifier).toBeDefined();
    expect(proof.proof).toBeDefined();

    const valid = await verifyZKProof(proof, secret);
    expect(valid).toBe(true);
  });

  it('verification fails with wrong secret', async () => {
    const proof = await proveClaim(
      { did: 'did:web:alice', claimKey: 'careScore', claimValue: '92' },
      secret,
    );

    const wrongSecret = new TextEncoder().encode('attacker-key');
    const valid = await verifyZKProof(proof, wrongSecret);
    expect(valid).toBe(false);
  });

  it('generates proof for claim in a set', async () => {
    const claims = [
      { did: 'did:web:alice', claimKey: 'did', claimValue: 'alice' },
      { did: 'did:web:alice', claimKey: 'careScore', claimValue: '92' },
      { did: 'did:web:alice', claimKey: 'trustTier', claimValue: 'high' },
      { did: 'did:web:alice', claimKey: 'sbtTokenId', claimValue: '42' },
    ];

    const proof = await proveClaimInSet(claims, 1, secret);

    const valid = await verifyZKProof(proof, secret);
    expect(valid).toBe(true);
  });

  it('nullifier prevents double-proving (different nullifiers per claim)', async () => {
    const claims = [
      { did: 'did:web:alice', claimKey: 'careScore', claimValue: '92' },
      { did: 'did:web:alice', claimKey: 'trustTier', claimValue: 'high' },
    ];

    const p1 = await proveClaimInSet(claims, 0, secret);
    const p2 = await proveClaimInSet(claims, 1, secret);

    expect(p1.nullifier).not.toBe(p2.nullifier);
    expect(p1.rootHex).toBe(p2.rootHex); // same set → same root
    expect(p1.leafHex).not.toBe(p2.leafHex);
  });

  it('verifyClaimInSet validates both merkle and proof', async () => {
    const enc = new TextEncoder();
    const claims = [
      { did: 'did:web:alice', claimKey: 'a', claimValue: '1' },
      { did: 'did:web:alice', claimKey: 'b', claimValue: '2' },
      { did: 'did:web:alice', claimKey: 'c', claimValue: '3' },
    ];

    const idx = 1;
    const proof = await proveClaimInSet(claims, idx, secret);

    const { MerkleTree } = await import('./merkle');
    const leaves = claims.map(c => enc.encode(`${c.claimKey}:${c.claimValue}`));
    const tree = await MerkleTree.build(leaves);
    const mp = tree.getProof(idx);

    const result = await verifyClaimInSet(proof, leaves[idx], mp, tree.getRoot(), secret);
    expect(result.merkleValid).toBe(true);
    expect(result.proofValid).toBe(true);
    expect(result.valid).toBe(true);
  });
});
