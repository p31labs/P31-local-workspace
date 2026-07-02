export interface LoveTokenReward {
  orderId: string;
  edgeId: string;
  amount: string;
  summary: string;
  payUrl?: string;
}

export async function createLoveToken(
  edgeId: string,
  amount: string,
  summary: string,
  fulfillmentUrl: string,
  token: string
): Promise<LoveTokenReward> {
  const EVIDENCE_VAULT = 'https://sovereign-justice-evidence.trimtab-signal.workers.dev';

  const res = await fetch(`${EVIDENCE_VAULT}/api/taler/order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ edgeId, amount, summary, fulfillmentUrl }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}
