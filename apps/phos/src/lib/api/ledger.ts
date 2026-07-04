import { endpoints } from '../../config/endpoints';
import { signedFetch } from '../api/signer';

export interface LoveBalance {
  did: string;
  balance: number;
  staked: number;
  earned: number;
  reputation: number;
}

export interface LoveTransaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  type: string;
  timestamp: string;
}

export async function fetchLoveBalance(did: string): Promise<LoveBalance> {
  const url = new URL(`${endpoints.loveLedger}/balance`);
  url.searchParams.set('did', did);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch love balance');
  return res.json();
}

export async function transferLove(from: string, to: string, amount: number, signature: string): Promise<{ transactionId: string }> {
  const res = await signedFetch(
    `${endpoints.loveLedger}/transfer`,
    { method: 'POST', body: JSON.stringify({ from, to, amount, signature }) },
    'from'
  );
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to transfer LOVE');
  }
  return res.json();
}

export async function stakeLove(did: string, contractId: string, amount: number, signature: string): Promise<{ contractId: string; staker: string; amount: number }> {
  const res = await signedFetch(
    `${endpoints.loveLedger}/stake`,
    { method: 'POST', body: JSON.stringify({ did, contractId, amount, signature }) },
    'did'
  );
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to stake LOVE');
  }
  return res.json();
}
