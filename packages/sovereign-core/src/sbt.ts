import type { SBT } from './types';

export const LOVESBT_ADDRESS = '0x521cAD1b54CDDB2B6B53a30EBe050C429F9c6C55';
export const PROOF_OF_CARE_ADDRESS = '0x08263FdD50196F229C9C2ccD650056067b884538';

export interface SBTMetadata {
  name: string;
  description: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}

export function buildSBT(
  type: SBT['type'],
  issuer: string,
  tetrahedronHash: string,
  metadata: SBTMetadata,
  onChainTokenId?: number
): SBT {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    issuer,
    issuedAt: Date.now(),
    tetrahedronHash,
    metadata: metadata as unknown as Record<string, unknown>,
    onChainTokenId,
    onChainContract: onChainTokenId !== undefined ? LOVESBT_ADDRESS : undefined,
  };
}

export function computeTetrahedronHash(profile: {
  did: string;
  name: string;
  starCount: number;
  gamesCompleted: number;
}): string {
  const data = `${profile.did}|${profile.name}|${profile.starCount}|${profile.gamesCompleted}`;
  return simpleHash(data);
}

export async function mintSBTOnChain(
  to: string,
  careScore: number,
  trustTier: number,
  metadataUri: string,
  retries = 2
): Promise<{ ok: boolean; tokenId?: number; error?: string }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch('https://ledger-bridge.trimtab-signal.workers.dev/care-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userDid: to,
          careScore,
          trustTier,
          metadataUri,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        if ((res.status === 401 || res.status === 403) && attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        return { ok: false, error: `HTTP ${res.status}: ${text}` };
      }
      const data = await res.json() as { tokenId?: number };
      return { ok: true, tokenId: data.tokenId };
    } catch (err) {
      if (attempt === retries) {
        return { ok: false, error: String(err) };
      }
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return { ok: false, error: 'Max retries exceeded' };
}

export function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

export const SBT_TYPES = {
  achievement: '🏆',
  credential: '🎓',
  affiliation: '🤝',
  guardian: '🛡️',
} as const;

export const SBT_TYPE_LABELS: Record<string, string> = {
  achievement: 'Achievement',
  credential: 'Credential',
  affiliation: 'Affiliation',
  guardian: 'Guardian',
};
