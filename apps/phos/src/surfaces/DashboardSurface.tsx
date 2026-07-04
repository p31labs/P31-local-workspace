import React, { useState, useEffect, useCallback } from 'react';
import { endpoints } from '../config/endpoints';

interface DashboardCard {
  id: string;
  label: string;
  value: string | number;
  icon: string;
  status: 'online' | 'warning' | 'offline';
  surface: string;
  detail?: string;
}

async function fetchKarma(): Promise<string> {
  try {
    const resp = await fetch(`${endpoints.k4Api}/api/mesh`);
    if (!resp.ok) throw new Error('K4 unavailable');
    const data = await resp.json();
    const vertices = data.mesh?.vertices || {};
    let total = 0;
    for (const v of Object.values(vertices) as any[]) {
      total += Number(v.love) || 0;
    }
    return total > 0 ? total.toLocaleString() : '—';
  } catch {
    return '—';
  }
}

async function fetchMeshNodes(): Promise<string> {
  try {
    const resp = await fetch(`${endpoints.k4Api}/api/mesh`);
    if (!resp.ok) throw new Error('K4 unavailable');
    const data = await resp.json();
    const vertexCount = Object.keys(data.mesh?.vertices || {}).length;
    const edgeCount = data.mesh?.edges?.length || data.edges || 0;
    return vertexCount > 0 ? `${vertexCount}v/${edgeCount}e` : '—';
  } catch {
    return '—';
  }
}

async function fetchIntercepts(): Promise<string> {
  try {
    const resp = await fetch(`${endpoints.bufferWorker}/stats`);
    if (!resp.ok) throw new Error('Buffer unavailable');
    const data = await resp.json();
    return data.interceptsThisWeek?.toString() || '0';
  } catch {
    return '—';
  }
}

export function DashboardSurface({ onNavigate }: { onNavigate?: (surface: string) => void }) {
  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const [karma, nodes, intercepts] = await Promise.all([
        fetchKarma(),
        fetchMeshNodes(),
        fetchIntercepts(),
      ]);

      setCards([
        { id: 'buffer', label: 'Intercepts This Week', value: intercepts, icon: '✎', status: 'online', surface: 'THE_BUFFER' },
        { id: 'karma', label: 'LOVE Balance', value: karma, icon: '⊜', status: karma !== '—' ? 'online' : 'warning', surface: 'LEDGER' },
        { id: 'nodes', label: 'Mesh Levels', value: nodes, icon: '⌗', status: nodes !== '—' ? 'online' : 'warning', surface: 'GRID' },
        { id: 'vault', label: 'Vault', value: 'Local', icon: '◉', status: 'online', surface: 'VAULT', detail: 'PGlite encrypted store' },
        { id: 'hearth', label: 'Family Hearth', value: 'Active', icon: '◈', status: 'online', surface: 'HEARTH', detail: 'Energy & pain alerts' },
        { id: 'settings', label: 'System', value: 'Configure', icon: '⚙', status: 'online', surface: 'SETTINGS' },
      ]);
    } catch {
      setError('Some services unreachable');
      setCards([
        { id: 'offline', label: 'System Status', value: 'Degraded', icon: '⊙', status: 'offline', surface: 'SETTINGS', detail: 'Check connection' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--phos-border)', borderTopColor: 'var(--phos-primary)' }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-light tracking-wide" style={{ color: 'var(--phos-text)' }}>
          Delta Gateway
        </h1>
        {error && (
          <span className="text-[10px] font-mono opacity-40">{error}</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => onNavigate?.(card.surface)}
            className="p-4 rounded-xl text-left transition-all duration-200 hover:scale-[1.02]"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--phos-bg) 85%, transparent)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid var(--phos-border)',
            }}
            aria-label={`${card.label}: ${card.value}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl" aria-hidden="true">{card.icon}</span>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: card.status === 'online' ? 'rgba(0,255,65,0.1)' : card.status === 'warning' ? 'rgba(255,179,71,0.1)' : 'rgba(255,68,68,0.1)',
                  color: card.status === 'online' ? 'var(--phos-primary)' : card.status === 'warning' ? '#FFB347' : '#ff4444',
                }}
              >
                {card.status}
              </span>
            </div>
            <div className="text-lg font-light" style={{ color: 'var(--phos-text)' }}>{card.value}</div>
            <div className="text-xs mt-0.5" style={{ opacity: 0.5 }}>{card.label}</div>
            {card.detail && (
              <div className="text-[10px] mt-1" style={{ opacity: 0.35 }}>{card.detail}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
