/**
 * BONDING — LOVE Economy Bridge
 *
 * Mirrors apps/arcade/src/games/common/love.ts pattern.
 * Posts to the love-ledger for care-credit minting on bonding achievements.
 */

const LOVE_API = 'https://gateway.p31ca.org/api/love/mint';
const FEDERATION_ATTEST_API = 'https://gateway.p31ca.org/api/federation/love/attest';

export async function mintLOVE(amount: number, reason: string, userId?: string): Promise<boolean> {
  const id = userId ?? (typeof window !== 'undefined' ? localStorage.getItem('p31:did') || localStorage.getItem('p31-device-id') : null);
  if (!id) return false;

  try {
    const res = await fetch(LOVE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ did: id, amount, reason }),
    });
    if (!res.ok) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Attest a cooperative care action with DRRP.
 * Calls federation-bridge /love/attest which enforces the decay curve
 * and appends to the hash-chained love_chain.
 */
export async function attestLOVE(
  giverDid: string,
  receiverDid: string,
  action: string
): Promise<{ ok: boolean; reward?: number; multiplier?: number; pair_id?: string }> {
  if (!giverDid || !receiverDid) return { ok: false };
  try {
    const res = await fetch(FEDERATION_ATTEST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ giver_did: giverDid, receiver_did: receiverDid, action }),
    });
    if (!res.ok) return { ok: false };
    const data = await res.json() as any;
    return { ok: true, reward: data.reward, multiplier: data.multiplier, pair_id: data.pair_id };
  } catch {
    return { ok: false };
  }
}

export async function getLOVEBalance(userId?: string): Promise<number> {
  const id = userId ?? (typeof window !== 'undefined' ? localStorage.getItem('p31:did') || localStorage.getItem('p31-device-id') : null);
  if (!id) return 0;

  try {
    const res = await fetch(`https://gateway.p31ca.org/api/love/balance/${encodeURIComponent(id)}`);
    if (!res.ok) return 0;
    const data = await res.json() as any;
    return data.balance ?? data.total ?? 0;
  } catch {
    return 0;
  }
}

export const LOVE_REWARDS = {
  bonding_session: 15,
  molecule_built: 50,
  covalent_bond: 25,
  workspace_streak: 30,
  onboarding_complete: 100,
  daily_login: 10,
  share_molecule: 20,
} as const;
