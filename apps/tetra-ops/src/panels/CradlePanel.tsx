/**
 * @file CradlePanel — Cosmic Cradle side panel with planetary data and countdown.
 */

import { useState, useEffect } from 'react';
import { CRADLE_PLANETS, CRADLE_TOUR, GRAND_TRINE, TALENT_TRINES, ASPECTS, CRADLE_PEAK, getCradleCountdown } from '../data/cradle';

export function CradlePanel() {
  const [cd, setCd] = useState(getCradleCountdown);

  useEffect(() => {
    const id = setInterval(() => setCd(getCradleCountdown()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div data-mcp-tool="cradlePanel" data-mcp-state="idle" style={{ padding: '12px', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#f0f2f5', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        🌌 COSMIC CRADLE
      </h2>

      {/* Countdown */}
      <div style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(251,191,36,0.2)', background: 'rgba(251,191,36,0.06)' }}>
        {cd ? (
          cd.isActive
            ? <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>Alignment active — July 19–24, 2026</div>
            : cd.isPast
              ? <div style={{ fontSize: 12, color: 'rgba(240,242,245,0.4)' }}>The Cradle has passed. Its energy remains.</div>
              : <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>
                  Peak in {cd.days}d {cd.hours}h {cd.minutes}m
                </div>
        ) : (
          <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>July 19, 2026</div>
        )}
        <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 9, color: 'rgba(240,242,245,0.3)', marginTop: 4 }}>
          Peaks July 19 · Window: July 19–24, 2026
        </div>
      </div>

      {/* Planets */}
      <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', marginBottom: -4 }}>
        PLANETS AT 10°
      </div>
      {CRADLE_PLANETS.map(p => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
          <span>{p.emoji}</span>
          <span style={{ fontWeight: 600, color: p.color }}>{p.name}</span>
          <span style={{ color: 'rgba(240,242,245,0.4)' }}>{p.sign}</span>
          <span style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 10, color: 'rgba(240,242,245,0.3)' }}>{p.degree}</span>
        </div>
      ))}

      {/* Grand Trine */}
      <div style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(251,191,36,0.1)', background: 'rgba(251,191,36,0.03)' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#fbbf24', marginBottom: 4 }}>{GRAND_TRINE.name}</div>
        <div style={{ fontSize: 10, color: 'rgba(240,242,245,0.5)', lineHeight: 1.5 }}>{GRAND_TRINE.description}</div>
        <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 9, color: 'rgba(240,242,245,0.3)', marginTop: 4 }}>
          {GRAND_TRINE.planets.join(' ↔ ')}
        </div>
      </div>

      {/* Aspects */}
      <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 9, color: 'rgba(240,242,245,0.25)', letterSpacing: '0.08em' }}>
        {ASPECTS.map((a, i) => <div key={i}>{a}</div>)}
      </div>

      {/* Quote */}
      <div style={{ padding: '10px', borderRadius: 8, background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.1)', marginTop: 4 }}>
        <div style={{ fontSize: 11, color: 'rgba(167,139,250,0.7)', fontStyle: 'italic', lineHeight: 1.6 }}>
          "A change for the better — the civilization of our new mini Great Year at last becomes adult."
        </div>
        <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 9, color: 'rgba(240,242,245,0.3)', marginTop: 6 }}>
          — André Barbault, Planetary Cycles
        </div>
      </div>

      {/* Tour */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
        {CRADLE_TOUR.map((line, i) => (
          <div key={i} style={{ fontSize: 10, color: 'rgba(240,242,245,0.4)', lineHeight: 1.5 }}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CradlePanel;
