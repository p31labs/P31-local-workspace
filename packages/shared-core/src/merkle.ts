/**
 * merkle.ts — Merkle Tree for SBT Privacy Layer
 *
 * Implements a SHA-256 Merkle tree with async hashing via Web Crypto API.
 * Compatible with Cloudflare Workers, browsers, and Node.js.
 *
 * Used to commit SBT claims without revealing them on-chain.
 * Root goes into LOVESBT, proof verifies membership without disclosing raw data.
 *
 * @module @p31/shared/merkle
 */

export interface MerkleProof {
  leaf: Uint8Array;
  proof: { sibling: Uint8Array; position: 'left' | 'right'; duplicate?: true }[];
  root: Uint8Array;
}

async function sha256(...data: Uint8Array[]): Promise<Uint8Array> {
  const total = new Uint8Array(data.reduce((acc, d) => acc + d.length, 0));
  let offset = 0;
  for (const d of data) {
    total.set(d, offset);
    offset += d.length;
  }
  const hash = await crypto.subtle.digest('SHA-256', total);
  return new Uint8Array(hash);
}

export class MerkleTree {
  private leaves: Uint8Array[];
  private layers: Uint8Array[][] = [];

  private constructor(leaves: Uint8Array[]) {
    this.leaves = leaves;
  }

  static async build(leaves: Uint8Array[]): Promise<MerkleTree> {
    if (leaves.length === 0) {
      throw new Error('MerkleTree requires at least one leaf');
    }

    const tree = new MerkleTree(leaves);

    let level = await Promise.all(leaves.map(async (leaf) => {
      const prefix = new Uint8Array([0x00]);
      return sha256(prefix, leaf);
    }));
    tree.layers = [level];

    while (level.length > 1) {
      const next: Uint8Array[] = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = i + 1 < level.length ? level[i + 1] : left;
        const prefix = new Uint8Array([0x01]);
        const hash = await sha256(prefix, left, right);
        next.push(hash);
      }
      tree.layers.push(next);
      level = next;
    }

    return tree;
  }

  getRoot(): Uint8Array {
    if (this.layers.length === 0) {
      throw new Error('MerkleTree not built');
    }
    return this.layers[this.layers.length - 1][0];
  }

  getProof(index: number): { sibling: Uint8Array; position: 'left' | 'right'; duplicate?: true }[] {
    if (index < 0 || index >= this.leaves.length) {
      throw new Error(`Leaf index ${index} out of range [0, ${this.leaves.length})`);
    }

    const proof: { sibling: Uint8Array; position: 'left' | 'right'; duplicate?: true }[] = [];
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

  getLeafCount(): number {
    return this.leaves.length;
  }

  getTreeHeight(): number {
    return this.layers.length;
  }

  static async verifyProof(
    leaf: Uint8Array,
    proof: { sibling: Uint8Array; position: 'left' | 'right'; duplicate?: true }[],
    root: Uint8Array,
  ): Promise<boolean> {
    const leafPrefix = new Uint8Array([0x00]);
    const nodePrefix = new Uint8Array([0x01]);
    let current = await sha256(leafPrefix, leaf);
    for (const step of proof) {
      if (step.duplicate) {
        current = await sha256(nodePrefix, current, current);
      } else {
        current = step.position === 'left'
          ? await sha256(nodePrefix, step.sibling, current)
          : await sha256(nodePrefix, current, step.sibling);
      }
    }

    if (current.length !== root.length) return false;
    for (let i = 0; i < current.length; i++) {
      if (current[i] !== root[i]) return false;
    }
    return true;
  }

  static async verifyMerkleProofArray(proof: MerkleProof): Promise<boolean> {
    return this.verifyProof(proof.leaf, proof.proof, proof.root);
  }

  serialize(): { leaves: string[]; root: string } {
    const toHex = (bytes: Uint8Array): string =>
      Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

    return {
      leaves: this.leaves.map(l => toHex(l)),
      root: toHex(this.getRoot()),
    };
  }
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error('Hex string must have even length');
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
