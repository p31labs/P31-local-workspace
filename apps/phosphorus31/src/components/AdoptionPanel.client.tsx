import { useState, useEffect } from 'react';
import { GlassCard } from '@p31ca/ui/chrome';

interface CounterscaleRow {
  eg?: string;
  ea?: string;
  el?: string;
  count?: number;
  [key: string]: unknown;
}

function normalizeRows(data: unknown): CounterscaleRow[] {
  if (Array.isArray(data)) return data as CounterscaleRow[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.events)) return obj.events as CounterscaleRow[];
    if (Array.isArray(obj.rows)) return obj.rows as CounterscaleRow[];
    if (Array.isArray(obj.data)) return obj.data as CounterscaleRow[];
  }
  return [];
}

export function AdoptionPanel() {
  const [totalEvents, setTotalEvents] = useState<number>(0);
  const [uniqueUsers, setUniqueUsers] = useState<number>(0);
  const [loveEvents, setLoveEvents] = useState<number>(0);
  const [topEvents, setTopEvents] = useState<{ name: string; count: number }[]>([]);
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('https://analytics.p31ca.org/api/events?range=30d');
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        const rows = normalizeRows(json);

        const total = rows.reduce((sum, r) => sum + (Number(r?.count) || 0), 0);
        const userField = rows.find(r => r && (r.visitor || r.user || r.userId || r.uid));
        let uniq = 0;
        if (userField) {
          const key = Object.keys(userField).find(k => /visitor|user|uid/i.test(k));
          const seen = new Set<string>();
          rows.forEach(r => {
            const v = key ? r[key] : undefined;
            if (v != null) seen.add(String(v));
          });
          uniq = seen.size;
        }

        const love = rows.filter(r => {
          const name = `${r?.eg ?? ''} ${r?.ea ?? ''} ${r?.el ?? ''}`.toLowerCase();
          return /love|care/.test(name);
        });
        const loveCount = love.reduce((sum, r) => sum + (Number(r?.count) || 0), 0);

        const byName = new Map<string, number>();
        rows.forEach(r => {
          const name = r?.eg || r?.ea || r?.el || 'unknown';
          byName.set(name, (byName.get(name) || 0) + (Number(r?.count) || 0));
        });
        const top = [...byName.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));

        setTotalEvents(total);
        setUniqueUsers(uniq);
        setLoveEvents(loveCount);
        setTopEvents(top);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <GlassCard>
        <div style={{ padding: 16, color: 'var(--p31-muted)', fontSize: 13 }}>Analytics unavailable</div>
      </GlassCard>
    );
  }

  return (
    <div data-mcp-tool="adoptionPanel" data-mcp-state="idle" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        <GlassCard>
          <div style={{ padding: 16 }}>
            <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 28, fontWeight: 700, color: 'var(--p31-accent)' }}>
              {loading ? '…' : totalEvents.toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: 'var(--p31-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>
              Events (30d)
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div style={{ padding: 16 }}>
            <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 28, fontWeight: 700, color: 'var(--p31-accent)' }}>
              {loading ? '…' : uniqueUsers.toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: 'var(--p31-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>
              Unique Users
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div style={{ padding: 16 }}>
            <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 28, fontWeight: 700, color: 'var(--p31-accent)' }}>
              {loading ? '…' : loveEvents.toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: 'var(--p31-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>
              LOVE / Care Events
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 10, color: 'var(--p31-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Top Events
          </div>
          {loading ? (
            <div style={{ fontSize: 12, color: 'var(--p31-muted)' }}>Loading…</div>
          ) : topEvents.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--p31-muted)' }}>No events recorded yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topEvents.map((e) => (
                <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--p31-fg, #f0f2f5)', fontWeight: 600 }}>{e.name}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 12, color: 'var(--p31-accent)' }}>
                    {e.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

export default AdoptionPanel;
