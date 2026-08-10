import { useCallback } from 'react';
import { useDataStore } from '../store/dataStore';
import { createHapiConnector } from '../engine/hapiConnector';

export default function DataControls() {
  const loading = useDataStore((s) => s.loading);
  const error = useDataStore((s) => s.error);
  const activeConnector = useDataStore((s) => s.activeConnector);
  const refresh = useDataStore((s) => s.refresh);
  const setActiveConnector = useDataStore((s) => s.setActiveConnector);

  const loadHungerMap = useCallback(() => {
    setActiveConnector(createHapiConnector('food-security'));
  }, [setActiveConnector]);

  const loadPopulation = useCallback(() => {
    setActiveConnector(createHapiConnector('population'));
  }, [setActiveConnector]);

  const clearData = useCallback(() => {
    setActiveConnector(null);
  }, [setActiveConnector]);

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: 20,
      background: 'rgba(6,10,18,0.88)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: '12px 16px',
      color: '#e0e4ec',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      minWidth: 200,
    }}>
      <div style={{ fontSize: 9, color: '#6a7a8a', textTransform: 'uppercase', letterSpacing: 1 }}>
        Data Sources
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={loadHungerMap} disabled={loading} style={{
          background: activeConnector?.id.startsWith('hapi-food') ? '#22d3ee' : 'rgba(255,255,255,0.05)',
          color: activeConnector?.id.startsWith('hapi-food') ? '#05070a' : '#8899aa',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 6,
          padding: '5px 10px',
          cursor: loading ? 'wait' : 'pointer',
          fontSize: 9,
          fontWeight: 600,
        }}>
          {loading && activeConnector?.id.startsWith('hapi-food') ? 'Loading...' : 'Hunger Map'}
        </button>

        <button onClick={loadPopulation} disabled={loading} style={{
          background: activeConnector?.id.startsWith('hapi-pop') ? '#22d3ee' : 'rgba(255,255,255,0.05)',
          color: activeConnector?.id.startsWith('hapi-pop') ? '#05070a' : '#8899aa',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 6,
          padding: '5px 10px',
          cursor: loading ? 'wait' : 'pointer',
          fontSize: 9,
          fontWeight: 600,
        }}>
          {loading && activeConnector?.id.startsWith('hapi-pop') ? 'Loading...' : 'Population'}
        </button>

        <button onClick={clearData} disabled={loading} style={{
          background: 'rgba(255,68,102,0.1)',
          color: '#ff4466',
          border: '1px solid rgba(255,68,102,0.2)',
          borderRadius: 6,
          padding: '5px 10px',
          cursor: loading ? 'wait' : 'pointer',
          fontSize: 9,
          fontWeight: 600,
        }}>
          Clear
        </button>
      </div>

      {error && (
        <div style={{ fontSize: 9, color: '#ff4466', marginTop: 4 }}>
          {error}
        </div>
      )}

      {activeConnector && !error && (
        <div style={{ fontSize: 9, color: '#6a7a8a', marginTop: 2 }}>
          {activeConnector.name}
        </div>
      )}
    </div>
  );
}
