import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface PlayerState {
  did: string;
  spoons: number;
  loveBalance: number;
  setSpoons: (s: number) => void;
  refreshBalance: () => Promise<void>;
  mintLOVE: (amount: number, reason: string) => Promise<boolean>;
}

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [did, setDid] = useState('');
  const [spoons, setSpoons] = useState(() => {
    if (typeof window === 'undefined') return 3;
    return parseInt(localStorage.getItem('p31:spoons') || '3', 10);
  });
  const [loveBalance, setLoveBalance] = useState(0);

  useEffect(() => {
    let stored = typeof window !== 'undefined' ? localStorage.getItem('p31:did') : null;
    if (!stored) { stored = 'did:key:' + (typeof crypto !== 'undefined' ? crypto.randomUUID().replace(/-/g, '').slice(0, 24) : 'local'); if (typeof window !== 'undefined') localStorage.setItem('p31:did', stored); }
    setDid(stored);
  }, []);

  const refreshBalance = async () => {
    if (!did) return;
    const res = await fetch('/api/balance?did=' + encodeURIComponent(did));
    const data = await res.json();
    setLoveBalance(data.balance || 0);
  };

  useEffect(() => { if (did) refreshBalance(); }, [did]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('p31:spoons', String(spoons)); }, [spoons]);

  const mintLOVE = async (amount: number, reason: string): Promise<boolean> => {
    if (!did) return false;
    try {
      await fetch('/api/love/mint', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did, amount, reason }),
      });
      await refreshBalance();
      return true;
    } catch { return false; }
  };

  return (
    <PlayerContext.Provider value={{ did, spoons, loveBalance, setSpoons, refreshBalance, mintLOVE }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerState {
  const ctx = useContext(PlayerContext);
  if (!ctx) return {
    did: '', spoons: 3, loveBalance: 0,
    setSpoons: () => {}, refreshBalance: async () => {}, mintLOVE: async () => false,
  };
  return ctx;
}

export default PlayerProvider;
