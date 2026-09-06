const LOVE_API = '/api/love/mint';
const FEDERATION_ATTEST_API = 'https://federation.p31ca.org/love/attest';
const SHADOW_BRIDGE_URL = 'https://shadow-bridge.trimtab-signal.workers.dev';

export async function mintLOVE(amount: number, reason: string, did?: string): Promise<boolean> {
  const resolvedDid = did ?? (typeof window !== 'undefined' ? localStorage.getItem('p31:did') : null);
  if (!resolvedDid) return false;

  try {
    const res = await fetch(LOVE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ did: resolvedDid, amount, reason }),
    });
    if (!res.ok) throw new Error('Arcade mint failed');
  } catch {
    return false;
  }

  try {
    await fetch(`${SHADOW_BRIDGE_URL}/game/pending-love`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: resolvedDid,
        amount,
        reason: `arcade_${reason}`,
      }),
    });
  } catch {
    // fire-and-forget; don't block the main flow
  }

  return true;
}

/**
 * Attest a cooperative care action with DRRP (Diminishing Returns on Repeated Pairings).
 * Both giver and receiver DIDs must be present. The federation-bridge enforces the decay curve.
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
      body: JSON.stringify({
        giver_did: giverDid,
        receiver_did: receiverDid,
        action,
      }),
    });
    if (!res.ok) return { ok: false };
    const data = await res.json() as any;
    return { ok: true, reward: data.reward, multiplier: data.multiplier, pair_id: data.pair_id };
  } catch {
    return { ok: false };
  }
}

export const LOVE_REWARDS = {
  bashball_win: 100,
  bashball_season_champ: 500,
  bashball_home_run: 50,
  bashball_training: 25,
  gridiron_win: 150,
  gridiron_super_bowl: 600,
  gridiron_touchdown: 50,
  gridiron_training: 30,
  strategy_mission: 100,
  strategy_campaign: 1000,
  strategy_training: 25,
  cards_win: 50,
  cards_streak: 75,
  liquid_challenge: 25,
  liquid_all: 100,
  geodesic_challenge: 50,
  geodesic_build: 10,
  jitterbug_level: 50,
  jitterbug_all: 500,
} as const;
