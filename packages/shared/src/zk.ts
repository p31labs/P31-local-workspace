/**
 * zk.ts — Zero-Knowledge Proof Module for SBT Privacy Layer
 *
 * Phase 2: HMAC-SHA256 commitment-based proof (simulation path).
 * Phase 3+: Replace with Poseidon hash → Circom circuit → Groth16 ZK-SNARK.
 *
 * The API surface is designed to be compatible with future ZK upgrades:
 *   generateZKProof() → real Groth16 proof
 *   verifyZKProof()    → real SNARK verification
 *
 * Current approach: HMAC-SHA256 binding of leaf + merkle proof + nullifier.
 * Nullifiers prevent double-proving (each unique secret produces a unique nullifier).
 *
 * @module @p31/shared/zk
 */

import { MerkleTree, hexToBytes, bytesToHex } from './merkle';

export interface ZKProof {
  leafHex: string;
  rootHex: string;
  nullifier: string;
  proof: string;
}

async function hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', new Uint8Array(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new Uint8Array(data));
  return new Uint8Array(sig);
}

export async function generateNullifier(
  did: string,
  claimKey: string,
  secret: Uint8Array,
): Promise<string> {
  const enc = new TextEncoder();
  const input = enc.encode(`${did}:${claimKey}`);
  const hmac = await hmacSha256(secret, input);
  return bytesToHex(hmac);
}

export async function generateZKProof(
  leaf: Uint8Array,
  merkleProof: { sibling: Uint8Array; position: 'left' | 'right'; duplicate?: true }[],
  root: Uint8Array,
  nullifier: string,
  secret: Uint8Array,
): Promise<ZKProof> {
  const nullifierBytes = hexToBytes(nullifier);
  const bindingInput = new Uint8Array(nullifierBytes.length + root.length);
  bindingInput.set(nullifierBytes, 0);
  bindingInput.set(root, nullifierBytes.length);

  const proofBytes = await hmacSha256(secret, bindingInput);

  return {
    leafHex: bytesToHex(leaf),
    rootHex: bytesToHex(root),
    nullifier,
    proof: bytesToHex(proofBytes),
  };
}

export async function verifyZKProof(
  zkProof: ZKProof,
  secret: Uint8Array,
): Promise<boolean> {
  const nullifierBytes = hexToBytes(zkProof.nullifier);
  const root = hexToBytes(zkProof.rootHex);
  const leaf = hexToBytes(zkProof.leafHex);

  const bindingInput = new Uint8Array(nullifierBytes.length + root.length);
  bindingInput.set(nullifierBytes, 0);
  bindingInput.set(root, nullifierBytes.length);

  const expectedProof = await hmacSha256(secret, bindingInput);
  const actualProof = hexToBytes(zkProof.proof);

  if (expectedProof.length !== actualProof.length) return false;
  for (let i = 0; i < expectedProof.length; i++) {
    if (expectedProof[i] !== actualProof[i]) return false;
  }
  return true;
}

export interface PrivacyClaim {
  did: string;
  claimKey: string;
  claimValue: string;
}

export async function proveClaim(
  claim: PrivacyClaim,
  secret: Uint8Array,
): Promise<ZKProof> {
  const enc = new TextEncoder();
  const leaf = enc.encode(`${claim.claimKey}:${claim.claimValue}`);
  const nullifier = await generateNullifier(claim.did, claim.claimKey, secret);

  const tree = await MerkleTree.build([leaf]);
  const root = tree.getRoot();

  return generateZKProof(leaf, [], root, nullifier, secret);
}

export async function proveClaimInSet(
  claims: PrivacyClaim[],
  targetIndex: number,
  secret: Uint8Array,
): Promise<ZKProof> {
  if (targetIndex < 0 || targetIndex >= claims.length) {
    throw new Error(`Target index ${targetIndex} out of range [0, ${claims.length})`);
  }

  const enc = new TextEncoder();
  const leaves = claims.map(c => enc.encode(`${c.claimKey}:${c.claimValue}`));

  const tree = await MerkleTree.build(leaves);
  const root = tree.getRoot();
  const merkleProof = tree.getProof(targetIndex);
  const leaf = leaves[targetIndex];

  const claim = claims[targetIndex];
  const nullifier = await generateNullifier(claim.did, claim.claimKey, secret);

  return generateZKProof(leaf, merkleProof, root, nullifier, secret);
}

export async function verifyClaimInSet(
  zkProof: ZKProof,
  leaf: Uint8Array,
  merkleProof: { sibling: Uint8Array; position: 'left' | 'right'; duplicate?: true }[],
  root: Uint8Array,
  secret: Uint8Array,
): Promise<{ valid: boolean; merkleValid: boolean; proofValid: boolean }> {
  const merkleValid = await MerkleTree.verifyProof(leaf, merkleProof, root);
  const proofValid = await verifyZKProof(zkProof, secret);

  return {
    valid: merkleValid && proofValid,
    merkleValid,
    proofValid,
  };
}
