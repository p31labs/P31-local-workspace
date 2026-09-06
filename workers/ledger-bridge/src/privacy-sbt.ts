/**
 * privacy-sbt.ts — Privacy-Enabled SBT Minting
 *
 * Self-contained module for ledger-bridge worker.
 * Uses @noble/hashes for SHA-256, Web Crypto for HMAC.
 *
 * CWP-2026-067: SBT Privacy Layer
 */

import { sha256 } from '@noble/hashes/sha256';
import { issueSDJWT, type SDCredential } from './sdjwt';
export type { SDCredential };

const enc = new TextEncoder();

// ─── Hash helpers ──────────────────────────────────────────────────────

function sha256Bytes(data: Uint8Array): Uint8Array {
  return sha256(data);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, data);
  return new Uint8Array(sig);
}

// ─── MerkleTree (inline, self-contained) ──────────────────────────────

type MerkleNode = Uint8Array;

interface MerkleProofStep {
  sibling: Uint8Array;
  position: 'left' | 'right';
  duplicate?: true;
}

class MerkleTree {
  private layers: MerkleNode[][];

  private constructor() {
    this.layers = [];
  }

  static async build(leaves: MerkleNode[]): Promise<MerkleTree> {
    const tree = new MerkleTree();

    const leafPrefix = new Uint8Array([0x00]);
    let level = leaves.map(l => sha256Bytes(new Uint8Array([...leafPrefix, ...l])));
    tree.layers = [level];

    const nodePrefix = new Uint8Array([0x01]);
    while (level.length > 1) {
      const next: MerkleNode[] = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = i + 1 < level.length ? level[i + 1] : left;
        next.push(sha256Bytes(new Uint8Array([...nodePrefix, ...left, ...right])));
      }
      tree.layers.push(next);
      level = next;
    }

    return tree;
  }

  getRoot(): MerkleNode {
    return this.layers[this.layers.length - 1][0];
  }

  getProof(index: number): MerkleProofStep[] {
    const proof: MerkleProofStep[] = [];
    let idx = index;
    for (let level = 0; level < this.layers.length - 1; level++) {
      const isLeft = idx % 2 === 0;
      const siblingIdx = isLeft ? idx + 1 : idx - 1;
      if (siblingIdx >= 0 && siblingIdx < this.layers[level].length) {
        proof.push({
          sibling: this.layers[level][siblingIdx],
          position: isLeft ? 'right' : 'left',
        });
      } else {
        proof.push({
          sibling: this.layers[level][idx],
          position: isLeft ? 'right' : 'left',
          duplicate: true,
        });
      }
      idx = Math.floor(idx / 2);
    }
    return proof;
  }
}

// ─── Claim Types ───────────────────────────────────────────────────────

export interface PrivacyClaim {
  did: string;
  claimKey: string;
  claimValue: string;
}

export interface PrivateSbtOptions {
  did: string;
  ethAddress: string;
  careScore?: number;
  trustTier?: string;
  sbtTokenId?: number;
  privacy: {
    hideCareScore?: boolean;
    hideTrustTier?: boolean;
    hideTokenId?: boolean;
    secretHex?: string;
  };
}

export interface PrivateSbtResult {
  sdjwt: string;
  issuerPubB64: string;
  merkleRoot: string;
  nullifier: string;
  disclosedClaims: string[];
  hiddenClaims: string[];
}

// ─── Nullifier generation ─────────────────────────────────────────────

async function generateNullifier(
  did: string, claimKey: string, secret: Uint8Array,
): Promise<string> {
  const input = enc.encode(`${did}:${claimKey}`);
  const hmac = await hmacSha256(secret, input);
  return bytesToHex(hmac);
}

function secretFromHex(hex?: string): Uint8Array {
  if (hex && hex.length >= 64) {
    return hexToBytes(hex.substring(0, 64));
  }
  return crypto.getRandomValues(new Uint8Array(32));
}

export async function mintPrivateSBT(
  opts: PrivateSbtOptions,
  holderPubB64?: string,
): Promise<PrivateSbtResult> {
  const secret = secretFromHex(opts.privacy.secretHex);
  const { privacy } = opts;

  const allClaims: PrivacyClaim[] = [
    { did: opts.did, claimKey: 'did', claimValue: opts.did },
  ];
  if (opts.careScore !== undefined) {
    allClaims.push({ did: opts.did, claimKey: 'careScore', claimValue: String(opts.careScore) });
  }
  if (opts.trustTier) {
    allClaims.push({ did: opts.did, claimKey: 'trustTier', claimValue: opts.trustTier });
  }
  if (opts.sbtTokenId !== undefined) {
    allClaims.push({ did: opts.did, claimKey: 'sbtTokenId', claimValue: String(opts.sbtTokenId) });
  }

  const disclosedKeys: string[] = ['did'];
  if (!privacy.hideCareScore && opts.careScore !== undefined) disclosedKeys.push('careScore');
  if (!privacy.hideTrustTier && opts.trustTier) disclosedKeys.push('trustTier');
  if (!privacy.hideTokenId && opts.sbtTokenId !== undefined) disclosedKeys.push('sbtTokenId');

  const hiddenKeys = allClaims
    .filter(c => !disclosedKeys.includes(c.claimKey))
    .map(c => c.claimKey)
    .filter(k => k !== '');

  const leaves = allClaims.map(c => enc.encode(`${c.claimKey}:${c.claimValue}`));
  const tree = await MerkleTree.build(leaves);
  const merkleRoot = bytesToHex(tree.getRoot());

  const disclosedValues: Record<string, unknown> = {};
  for (const claim of allClaims) {
    if (disclosedKeys.includes(claim.claimKey)) {
      disclosedValues[claim.claimKey] = claim.claimValue;
    }
  }

  const credential = await issueSDJWT(
    {
      ...disclosedValues,
      merkle_root: merkleRoot,
      privacy_enabled: true,
    },
    holderPubB64,
  );

  const nullifier = await generateNullifier(opts.did, 'sbt', secret);

  return {
    sdjwt: credential.sdjwt,
    issuerPubB64: credential.issuerPubB64,
    merkleRoot,
    nullifier,
    disclosedClaims: disclosedKeys.filter(k => k !== 'did'),
    hiddenClaims: hiddenKeys.filter(Boolean),
  };
}

// ─── Re-exports used by /sbt/mint-private endpoint ────────────────────

export { MerkleTree as MerkleTreeBuilder, bytesToHex as toHex, hexToBytes as fromHex, generateNullifier as makeNullifier };
