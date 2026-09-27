import { useState, useEffect } from 'react';
import { BondingUIGSurface } from './components/BondingUIGSurface';
import { K4Hero } from '@p31ca/ui/K4Hero';
import '@p31ca/ui/k4-hero.css';
import { mountStarfield } from '@p31ca/ui/starfield';
import '@p31ca/ui/starfield.css';

function getUrlParam(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(key);
}

export function BondingApp() {
  const [spoons, setSpoons] = useState(3);
  const [genMode, setGenMode] = useState(false);
  const [intentPrompt, setIntentPrompt] = useState<string | undefined>(undefined);

  useEffect(() => {
    const instance = mountStarfield(undefined, { spoons });
    return () => instance.destroy();
  }, []);

  useEffect(() => {
    const gen = getUrlParam('gen');
    const intent = getUrlParam('intent');
    if (gen === '1') setGenMode(true);
    if (intent) {
      setGenMode(true);
      setIntentPrompt(intent);
    }
  }, []);

  return (
    <div data-spoons={spoons} style={{
      minHeight: '100vh', background: '#0A0A0F', color: '#F5F5F7',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <a href="#main-content" style={{
        position: 'absolute', left: -9999, top: 'auto', width: 1, height: 1, overflow: 'hidden',
      }} onFocus={(e) => { e.currentTarget.style.position = 'static'; e.currentTarget.style.width = 'auto'; e.currentTarget.style.height = 'auto'; }}>
        Skip to main content
      </a>

      <main id="main-content" style={{ width: '100%', maxWidth: 640, padding: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: '#00F0FF' }}>Bonding</h1>
        <p style={{ fontSize: 14, color: '#cbd5e1', marginBottom: 24 }}>
          Molecule-building chemistry game for neurodivergent children
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }} role="radiogroup" aria-label="Spoons level">
          {[0, 1, 2, 3, 4, 5].map(s => (
            <button key={s} onClick={() => setSpoons(s)} role="radio" aria-checked={spoons === s}
              style={{
                minWidth: 48, minHeight: 48, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: spoons === s ? '#00F0FF' : 'rgba(255,255,255,0.06)',
                color: spoons === s ? '#0a0e14' : '#e2e8f0',
                fontWeight: spoons === s ? 600 : 400, fontSize: 13,
              }}>
              {s}
            </button>
          ))}
        </div>

        {genMode ? (
          <BondingUIGSurface
            spoons={spoons}
            onReady={() => setSpoons(3)}
            intentPrompt={intentPrompt}
          />
        ) : (
          <>
            <K4Hero />
            <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 24 }}>
              Spoons: {spoons} — {spoons <= 1 ? 'Motion disabled' : 'Active'}
            </p>
            <button
              onClick={() => setGenMode(true)}
              style={{
                background: 'rgba(0,240,255,0.15)',
                border: '1px solid rgba(0,240,255,0.3)',
                color: '#00F0FF',
                borderRadius: 12,
                padding: '12px 24px',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                width: '100%',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,240,255,0.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,240,255,0.15)'; }}
              aria-label="Enter Bonding game"
            >
              Enter Bonding →
            </button>
          </>
        )}
      </main>

      <footer style={{
        marginTop: 'auto', padding: '20px 0', borderTop: '1px solid rgba(255,255,255,0.08)',
        textAlign: 'center', fontSize: 12, color: 'rgba(245,245,247,0.3)', width: '100%',
      }}>
        Bonding · P31 Labs · EIN 42-1888158
      </footer>
    </div>
  );
}
