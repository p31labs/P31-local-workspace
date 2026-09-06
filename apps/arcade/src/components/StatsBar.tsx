import { useEffect, useState } from 'react';
import { usePlayer } from './PlayerProvider';

export default function StatsBar() {
  const { loveBalance, spoons } = usePlayer();
  const [activePlayers, setActivePlayers] = useState(0);
  const [rooms, setRooms] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/active-players');
        const data = await res.json();
        setActivePlayers(data.activeInRoblox + data.rooms);
        setRooms(data.rooms || 0);
      } catch {}
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      display: 'flex', gap: 24, padding: '12px 24px',
      background: 'rgba(0,0,0,0.3)', borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.05)',
      justifyContent: 'space-between', flexWrap: 'wrap',
      fontSize: 13, fontFamily: 'monospace',
    }}>
      <div>
        <span style={{ color: '#94A3B8' }}>LOVE</span>{' '}
        <span style={{ fontWeight: 700, color: '#00F0FF' }}>{loveBalance}</span>
      </div>
      <div>
        <span style={{ color: '#94A3B8' }}>Spoons</span>{' '}
        <span style={{ fontWeight: 700, color: spoons <= 1 ? '#FB7185' : '#00F0FF' }}>{spoons}</span>
      </div>
      <div>
        <span style={{ color: '#94A3B8' }}>Active</span>{' '}
        <span style={{ fontWeight: 700, color: '#34D399' }}>{activePlayers}</span>
      </div>
      <div>
        <span style={{ color: '#94A3B8' }}>Rooms</span>{' '}
        <span style={{ fontWeight: 700 }}>{rooms}</span>
      </div>
    </div>
  );
}
