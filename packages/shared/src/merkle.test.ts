/**
 * merkle.test.ts — Tests for SBT Privacy Merkle Tree
 * Verifies SHA-256 Merkle tree correctness with domain-separated hashing.
 */

import { describe, it, expect } from 'vitest';
import { MerkleTree, hexToBytes, bytesToHex } from './merkle';

const enc = new TextEncoder();

function leaf(data: string): Uint8Array {
  return enc.encode(data);
}

describe('MerkleTree', () => {
  it('builds a single-leaf tree (root length = 32)', async () => {
    const tree = await MerkleTree.build([leaf('claim:careScore=87')]);
    expect(tree.getLeafCount()).toBe(1);
    expect(tree.getTreeHeight()).toBe(1);
    expect(tree.getRoot().length).toBe(32);
  });

  it('builds a 2-leaf tree and verifies proof', async () => {
    const leaves = [leaf('claim:careScore=87'), leaf('claim:trustTier=trusted')];
    const tree = await MerkleTree.build(leaves);
    expect(tree.getLeafCount()).toBe(2);
    expect(tree.getTreeHeight()).toBe(2);

    const root = tree.getRoot();
    const proof = tree.getProof(0);
    expect(proof.length).toBe(1);

    const valid = await MerkleTree.verifyProof(leaves[0], proof, root);
    expect(valid).toBe(true);
  });

  it('builds a 4-leaf tree and verifies all proofs', async () => {
    const leaves = [
      leaf('did=alice'),
      leaf('careScore=92'),
      leaf('trustTier=high'),
      leaf('sbtTokenId=42'),
    ];
    const tree = await MerkleTree.build(leaves);
    expect(tree.getLeafCount()).toBe(4);
    expect(tree.getTreeHeight()).toBe(3);

    const root = tree.getRoot();
    for (let i = 0; i < 4; i++) {
      const proof = tree.getProof(i);
      const valid = await MerkleTree.verifyProof(leaves[i], proof, root);
      expect(valid).toBe(true);
    }
  });

  it('verifies proof fails with wrong leaf', async () => {
    const leaves = [leaf('a'), leaf('b')];
    const tree = await MerkleTree.build(leaves);
    const root = tree.getRoot();
    const proof = tree.getProof(0);

    const valid = await MerkleTree.verifyProof(leaf('wrong'), proof, root);
    expect(valid).toBe(false);
  });

  it('verifies proof fails with tampered root', async () => {
    const leaves = [leaf('a'), leaf('b')];
    const tree = await MerkleTree.build(leaves);
    const proof = tree.getProof(0);

    const fakeRoot = new Uint8Array(32).fill(0xff);
    const valid = await MerkleTree.verifyProof(leaves[0], proof, fakeRoot);
    expect(valid).toBe(false);
  });

  it('builds a 5-leaf unbalanced tree (odd count)', async () => {
    const leaves = ['a', 'b', 'c', 'd', 'e'].map(leaf);
    const tree = await MerkleTree.build(leaves);
    expect(tree.getLeafCount()).toBe(5);
    expect(tree.getTreeHeight()).toBe(4);

    const root = tree.getRoot();
    for (let i = 0; i < 5; i++) {
      const proof = tree.getProof(i);
      const valid = await MerkleTree.verifyProof(leaves[i], proof, root);
      expect(valid).toBe(true);
    }
  });

  it('throws on empty leaves', async () => {
    await expect(MerkleTree.build([])).rejects.toThrow('at least one leaf');
  });

  it('serializes to hex format', async () => {
    const leaves = [leaf('a'), leaf('b')];
    const tree = await MerkleTree.build(leaves);
    const serialized = tree.serialize();
    expect(serialized.leaves).toHaveLength(2);
    expect(serialized.root).toBe(bytesToHex(tree.getRoot()));
  });

  it('hexToBytes / bytesToHex round-trip', () => {
    const original = crypto.getRandomValues(new Uint8Array(32));
    const hex = bytesToHex(original);
    const decoded = hexToBytes(hex);
    expect(decoded).toEqual(original);
  });
});
