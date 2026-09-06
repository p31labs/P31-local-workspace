import React, { useEffect, useState } from 'react';
import { MvpCard } from './ui/MvpCard';

interface Mvp {
  name: string;
  status: string;
  url: string;
  badge: string;
}

export const MvpHub: React.FC = () => {
  const [mvps, setMvps] = useState<Mvp[]>([]);

  useEffect(() => {
    fetch('/mvps.json')
      .then(response => response.json())
      .then(data => setMvps(data))
      .catch(error => console.error('Error loading MVPs:', error));
  }, []);

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', background: '#0f1115', color: '#d8d6d0' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: '2rem', color: '#d8d6d0' }}>
        P31 Ecosystem Hub
      </h1>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.5rem',
        maxWidth: '72rem',
        margin: '0 auto',
      }}>
        {mvps.map((mvp, index) => (
          <MvpCard key={index} mvp={mvp} />
        ))}
      </div>
    </div>
  );
};