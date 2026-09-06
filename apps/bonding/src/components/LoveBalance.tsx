/**
 * BONDING — LOVE Balance Display
 * Shows current LOVE care-credit balance from the love-ledger.
 */
import { useState, useEffect } from 'react';
import { getLOVEBalance } from '../lib/love';
import { getUserId } from '../lib/identity';

export function LoveBalance() {
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const id = getUserId();
    getLOVEBalance(id).then(b => {
      setBalance(b);
      if (b === 0) setError(true);
    }).catch(() => setError(true));
  }, []);

  if (balance === null) return <span style={{ opacity: 0.5 }}>Loading balance...</span>;

  return (
    <div style={{
      background: 'rgba(0,240,255,0.06)',
      border: '1px solid rgba(0,240,255,0.15)',
      borderRadius: 12,
      padding: '10px 16px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 13,
      color: '#e2e8f0',
    }}>
      <span style={{ fontSize: 16 }}>💎</span>
      <span style={{ fontWeight: 600, color: '#00F0FF' }}>{balance > 0 ? balance.toLocaleString() : '0'}</span>
      <span style={{ color: '#94a3b8' }}>LOVE</span>
    </div>
  );
}
