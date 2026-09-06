const LOVE_LEDGER_URL = 'https://love-ledger.trimtab-signal.workers.dev';
const GATEWAY_URL = 'https://gateway.p31ca.org/api/love';

export interface LoveBalance {
  userId: string;
  totalEarned: number;
  sovereigntyPool: number;
  performancePool: number;
  careScore: number;
  availableBalance: number;
  frozenBalance: number;
  totalSpoonDebt: number;
  updatedAt: number | null;
}

export interface LoveTransaction {
  id: string;
  userId: string;
  type: 'earn' | 'spend' | 'bonus';
  amount: number;
  description: string;
  metadata: Record<string, unknown>;
  created_at: number;
}

export interface ChainEntry {
  id: number;
  entry_type: string;
  entry_hash: string;
  prev_hash: string;
  payload_json: string;
  created_at: number;
}

export interface ChainVerification {
  valid: boolean;
  count: number;
  rootHash: string;
  entries: ChainEntry[];
}

export async function getLoveBalance(userId: string): Promise<LoveBalance | null> {
  try {
    const res = await fetch(`${LOVE_LEDGER_URL}/api/love/balance/${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    return await res.json() as Promise<LoveBalance>;
  } catch {
    return null;
  }
}

export async function getLoveTransactions(userId: string): Promise<LoveTransaction[]> {
  try {
    const res = await fetch(`${LOVE_LEDGER_URL}/api/love/transactions/${encodeURIComponent(userId)}`);
    if (!res.ok) return [];
    const data = await res.json() as { transactions: LoveTransaction[] };
    return data.transactions || [];
  } catch {
    return [];
  }
}

export async function mintLove(
  userId: string,
  transactionType: string,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  try {
    const res = await fetch(`${LOVE_LEDGER_URL}/api/love/earn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        transactionType,
        metadata: metadata || {},
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getLoveChain(userId: string): Promise<ChainVerification | null> {
  try {
    const res = await fetch(`${LOVE_LEDGER_URL}/api/love/chain?did=${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    return await res.json() as Promise<ChainVerification>;
  } catch {
    return null;
  }
}

export async function registerUser(userId: string): Promise<boolean> {
  try {
    const res = await fetch(`${LOVE_LEDGER_URL}/api/love/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const LOVE_AMOUNTS: Record<string, number> = {
  BLOCK_PLACED: 1,
  ATOM_PLACED: 1,
  PING: 1,
  COHERENCE_GIFT: 5,
  VOLTAGE_CALMED: 2,
  CARE_GIVEN: 2,
  CARE_RECEIVED: 3,
  ARTIFACT_CREATED: 10,
  MOLECULE_COMPLETE: 10,
  TETRAHEDRON_BOND: 15,
  MILESTONE_REACHED: 25,
  QUEST_COMPLETE: 50,
};
