/**
 * groth16.ts — Groth16 ZK-SNARK integration for SBT Privacy Layer
 *
 * Phase 5: Replaces the HMAC-based proof with a real zero-knowledge proof
 * using circom2 + snarkjs. The circuit proves Merkle tree membership without
 * revealing the leaf value or path.
 *
 * Requires: circom2, snarkjs (installed as dev tools)
 * Build: contracts/circuits/build.sh
 *
 * @module @p31/shared/groth16
 */

import type { Groth16Proof, SnarkJs } from './groth16-types';

let snarkjs: SnarkJs | null = null;

async function getSnarkJs(): Promise<SnarkJs> {
  if (snarkjs) return snarkjs;
  snarkjs = await import('snarkjs');
  return snarkjs!;
}

const wasmBase64 = ''; // Placeholder — WASM and zkey loaded from filesystem or static serve

export interface MerkleProofInput {
  leaf: bigint;
  pathElements: bigint[];
  pathIndices: number[];
  root: bigint;
}

export interface Groth16ProofResult {
  proof: any;
  publicSignals: string[];
  solidityProof: string;
}

export interface Groth16VerifyResult {
  verified: boolean;
  publicSignals: string[];
}

async function loadProvingAssets(): Promise<{ wasm: Uint8Array; zkey: Uint8Array }> {
  return { wasm: new Uint8Array(0), zkey: new Uint8Array(0) };
}

export async function generateProof(input: MerkleProofInput): Promise<Groth16ProofResult> {
  const snark = await getSnarkJs();

  const proof = await snark.groth16.fullProve(
    {
      leaf: String(input.leaf),
      pathElements: input.pathElements.map(String),
      pathIndices: input.pathIndices,
      root: String(input.root),
    },
    'MerkleMembership.wasm',
    'MerkleMembership_final.zkey',
  );

  const solidityProof = await snark.groth16.exportSolidityCallData(
    proof.proof,
    proof.publicSignals,
  );

  return {
    proof: proof.proof,
    publicSignals: proof.publicSignals,
    solidityProof,
  };
}

export async function verifyProof(
  proof: any,
  publicSignals: string[],
): Promise<Groth16VerifyResult> {
  const snark = await getSnarkJs();

  const vKey = {}; // Load from verification_key.json
  const verified = await snark.groth16.verify(vKey, publicSignals, proof);

  return { verified, publicSignals };
}

export { type SnarkJs, type Groth16Proof };
