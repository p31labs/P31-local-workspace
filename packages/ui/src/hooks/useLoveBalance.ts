/**
 * @file useLoveBalance — React hook for live LOVE balance from love-ledger Worker.
 */

import { useEffect, useState } from 'react';

interface LoveBalance {
  total_earned: number;
  sovereignty_pool: number;
  performance_pool: number;
  care_score: number;
}

export function useLoveBalance(did: string | undefined) {
  const [balance, setBalance] = useState<LoveBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!did) { setLoading(false); setBalance(null); return; }
    fetch(`https://love-ledger.p31ca.org/api/love/balance/${did}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setBalance(data || null))
      .catch(() => setBalance(null))
      .finally(() => setLoading(false));
  }, [did]);

  return { balance, loading };
}

export default useLoveBalance;
