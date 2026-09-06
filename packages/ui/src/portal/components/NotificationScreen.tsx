import { useEffect, useMemo, useRef, useState } from 'react';

interface Notification {
  id: string;
  type: string;
  icon: string;
  title: string;
  body: string;
  priority: 'low' | 'medium' | 'high';
  color: string;
  time: number;
}

interface NotificationScreenProps {
  active: boolean;
  spoons: number;
  onSpoonChange: (level: number) => void;
  storageKey: string;
  starfieldPaused?: boolean;
  onToggleStarfieldPaused?: () => void;
}

const TEMPLATES: Record<string, Omit<Notification, 'id' | 'time'>> = {
  meds: { type: 'meds', icon: '⏰', title: 'Time for your morning meds', body: 'Vitamin D, L-theanine. Take with food.', color: '#F59E0B', priority: 'high' },
  movement: { type: 'movement', icon: '☕', title: "You've been focused for 90min", body: 'A 10-minute break helps. Walk, stretch.', color: '#10B981', priority: 'low' },
  social: { type: 'social', icon: '👤', title: 'You have a new message', body: 'Read when ready.', color: '#8B5CF6', priority: 'low' },
  bonding: { type: 'bonding', icon: '🎮', title: 'BONDING session starting', body: 'Want to build something together?', color: '#00F0FF', priority: 'medium' },
  grants: { type: 'grants', icon: '📝', title: 'Grant deadline approaching', body: 'Your draft is 90% done. Finalize today?', color: '#F43F5E', priority: 'high' },
};

const OPT_IN_KEYS = Object.keys(TEMPLATES);
const OPT_IN_LABELS: Record<string, string> = {
  meds: 'Medication',
  movement: 'Movement breaks',
  social: 'Social messages',
  bonding: 'BONDING activity',
  grants: 'Grant deadlines',
};

function loadOpts(storageKey: string): Record<string, boolean> {
  try {
    const saved = localStorage.getItem(`p31:${storageKey}:notif-optins`);
    if (saved) return JSON.parse(saved);
  } catch {}
  const all: Record<string, boolean> = {};
  OPT_IN_KEYS.forEach((k) => (all[k] = true));
  return all;
}

function loadHistory(storageKey: string): Notification[] {
  try {
    const saved = localStorage.getItem(`p31:${storageKey}:notif-history`);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

function groupLabel(time: number): string {
  const now = new Date();
  const then = new Date(time);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime();
  if (day === today) return 'Today';
  if (day === today - 86400000) return 'Yesterday';
  return 'Earlier';
}

function formatTime(time: number): string {
  return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(time: number): string {
  return new Date(time).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function NotificationScreen({ active, spoons, onSpoonChange, storageKey, starfieldPaused, onToggleStarfieldPaused }: NotificationScreenProps) {
  const [opts, setOpts] = useState<Record<string, boolean>>(() => loadOpts(storageKey));
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [history, setHistory] = useState<Notification[]>(() => loadHistory(storageKey));
  const [panelOpen, setPanelOpen] = useState(() => {
    try {
      return localStorage.getItem(`p31:${storageKey}:notif-panel`) === 'true';
    } catch {
      return false;
    }
  });
  const timersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    try {
      localStorage.setItem(`p31:${storageKey}:notif-optins`, JSON.stringify(opts));
    } catch {}
  }, [opts, storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(`p31:${storageKey}:notif-history`, JSON.stringify(history));
    } catch {}
  }, [history, storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(`p31:${storageKey}:notif-panel`, String(panelOpen));
    } catch {}
  }, [panelOpen, storageKey]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  const close = (id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  };

  const trigger = (type: string) => {
    if (!opts[type] || spoons === 0) return;
    const t = TEMPLATES[type];
    if (!t) return;
    const n: Notification = { ...t, id: `${type}-${Date.now()}`, time: Date.now() };
    setNotifs((prev) => [...prev, n]);
    setHistory((prev) => [...prev.slice(-19), n]);
    window.__jitterbug?.notify(type, 0.5, 0.5, t.title);
    if (n.priority !== 'high') {
      const base = n.priority === 'low' ? 6000 : 10000;
      const delay = base * Math.max(1, 6 - spoons);
      const timer = window.setTimeout(() => close(n.id), delay);
      timersRef.current.set(n.id, timer);
    }
  };

  const clearAll = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current.clear();
    setNotifs([]);
    setHistory([]);
  };

  const grouped = useMemo(() => {
    const groups: { label: string; items: Notification[] }[] = [];
    [...history]
      .sort((a, b) => b.time - a.time)
      .forEach((n) => {
        const label = groupLabel(n.time);
        const g = groups.find((x) => x.label === label);
        if (g) g.items.push(n);
        else groups.push({ label, items: [n] });
      });
    return groups;
  }, [history]);

  if (!active) return null;

  const muted = spoons === 0;
  const glassBlur = spoons <= 1 ? 'none' : 'blur(12px)';

  return (
    <section
      className="notification-screen"
      aria-label="Notifications"
      style={{
        position: 'relative',
        flex: '1 1 0%',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--p31-space-md, 12px)',
        pointerEvents: 'none',
      }}
    >
      <details
        open={panelOpen}
        onToggle={(e) => setPanelOpen(e.currentTarget.open)}
        style={{
          position: 'absolute',
          top: 0,
          right: 'var(--p31-space-md, 12px)',
          width: 'min(360px, 100%)',
          pointerEvents: 'auto',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: glassBlur,
          WebkitBackdropFilter: glassBlur,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 'var(--p31-radius-xl, 16px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          zIndex: 5,
          overflow: 'hidden',
        }}
      >
        <summary
          style={{
            cursor: 'pointer',
            padding: '12px 16px',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--p31-text, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            userSelect: 'none',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <span aria-hidden>⚙️</span> Notification settings
          {notifs.length > 0 && (
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--p31-text-secondary, #9CA3AF)',
              }}
            >
              {notifs.length} active
            </span>
          )}
        </summary>

        <div style={{ padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--p31-text-secondary, #9CA3AF)', marginBottom: 8 }}>
              Spoon level
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[0, 1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => onSpoonChange(s)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    background: spoons === s ? 'var(--p31-accent, #00F0FF)' : 'rgba(255,255,255,0.06)',
                    color: spoons === s ? 'var(--p31-bg, #0A0E17)' : 'var(--p31-text, #E2E8F0)',
                    fontWeight: spoons === s ? 600 : 400,
                    fontSize: 12,
                  }}
                >
                  {s === 0 ? '🧘 0' : `🥄 ${s}`}
                </button>
              ))}
            </div>
            {muted && (
              <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 8, background: 'rgba(251,113,133,0.12)', border: '1px solid rgba(251,113,133,0.25)', fontSize: 12, color: '#F43F5E', lineHeight: 1.5 }}>
                🧘 Sensory rest active. Notifications muted and the starfield is subdued.
              </div>
            )}
          </div>

          {onToggleStarfieldPaused && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--p31-text-secondary, #9CA3AF)', marginBottom: 8 }}>
                Animation
              </div>
              <button
                onClick={onToggleStarfieldPaused}
                aria-pressed={starfieldPaused}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: starfieldPaused ? '1px solid var(--p31-accent, #00F0FF)' : '1px solid rgba(255,255,255,0.12)',
                  cursor: 'pointer',
                  background: starfieldPaused ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.04)',
                  color: 'var(--p31-text, #E2E8F0)',
                  fontSize: 12,
                  fontWeight: 600,
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span aria-hidden>{starfieldPaused ? '▶️' : '⏸️'}</span>
                {starfieldPaused ? 'Resume animation' : 'Pause animation'}
                <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 400, color: 'var(--p31-text-secondary, #9CA3AF)' }}>
                  {starfieldPaused ? 'frozen' : 'ambient'}
                </span>
              </button>
              <p style={{ marginTop: 6, fontSize: 11, lineHeight: 1.5, color: 'var(--p31-text-secondary, #9CA3AF)' }}>
                Pauses the ambient starfield without entering sensory rest.
              </p>
            </div>
          )}

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--p31-text-secondary, #9CA3AF)', marginBottom: 8 }}>
              Opt in
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {OPT_IN_KEYS.map((k) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--p31-text, #E2E8F0)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={opts[k]}
                    onChange={(e) => setOpts((prev) => ({ ...prev, [k]: e.target.checked }))}
                    style={{ accentColor: 'var(--p31-accent, #00F0FF)' }}
                  />
                  {OPT_IN_LABELS[k]}
                </label>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--p31-text-secondary, #9CA3AF)', marginBottom: 8 }}>
              Trigger a test notification
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {OPT_IN_KEYS.map((k) => {
                const t = TEMPLATES[k];
                return (
                  <button
                    key={k}
                    onClick={() => trigger(k)}
                    disabled={!opts[k] || muted}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: 'none',
                      cursor: !opts[k] || muted ? 'not-allowed' : 'pointer',
                      background: 'rgba(255,255,255,0.04)',
                      color: !opts[k] || muted ? 'var(--p31-text-tertiary, #64748B)' : 'var(--p31-text, #E2E8F0)',
                      fontSize: 12,
                      textAlign: 'left',
                      borderLeft: `3px solid ${t.color}`,
                      opacity: !opts[k] || muted ? 0.45 : 1,
                    }}
                  >
                    {t.icon} {t.title}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--p31-text-secondary, #9CA3AF)' }}>
                History ({history.length})
              </span>
              {history.length > 0 && (
                <button
                  onClick={clearAll}
                  style={{
                    marginLeft: 'auto',
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.12)',
                    cursor: 'pointer',
                    background: 'transparent',
                    color: 'var(--p31-text-secondary, #9CA3AF)',
                    fontSize: 11,
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
            {grouped.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--p31-text-tertiary, #64748B)', fontStyle: 'italic' }}>
                No notifications yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                {grouped.map((g) => (
                  <div key={g.label}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--p31-text-tertiary, #64748B)', marginBottom: 4 }}>
                      {g.label}
                    </div>
                    {g.items.map((n) => (
                      <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)' }}>
                        <span style={{ fontSize: 14 }}>{n.icon}</span>
                        <span style={{ color: 'var(--p31-text, #E2E8F0)' }}>{n.title}</span>
                        <span style={{ color: 'var(--p31-text-tertiary, #64748B)', marginLeft: 'auto', fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 10 }}>
                          {g.label === 'Earlier' ? formatDate(n.time) : formatTime(n.time)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </details>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          width: 'min(480px, 100%)',
          pointerEvents: 'none',
        }}
      >
        {notifs.map((n) => (
          <article
            key={n.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              gap: 12,
              alignItems: 'start',
              padding: '14px 16px',
              borderRadius: 'var(--p31-radius-lg, 12px)',
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: glassBlur,
              WebkitBackdropFilter: glassBlur,
              borderTop: '1px solid rgba(255,255,255,0.09)',
              borderRight: '1px solid rgba(255,255,255,0.09)',
              borderBottom: '1px solid rgba(255,255,255,0.09)',
              borderLeft: `4px solid ${n.color}`,
              boxShadow: '0 6px 24px rgba(0,0,0,0.3)',
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }} aria-hidden>{n.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--p31-text, #E2E8F0)' }}>{n.title}</div>
              <div style={{ fontSize: 12, color: 'var(--p31-text-secondary, #9CA3AF)', marginTop: 2 }}>{n.body}</div>
              <div style={{ fontSize: 10, color: 'var(--p31-text-tertiary, #64748B)', marginTop: 6 }}>
                {n.priority === 'high' ? 'Stays until dismissed' : `Auto-dismisses soon`} · {formatTime(n.time)}
              </div>
            </div>
            <button
              onClick={() => close(n.id)}
              aria-label="Dismiss notification"
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.12)',
                cursor: 'pointer',
                background: 'transparent',
                color: 'var(--p31-text-secondary, #9CA3AF)',
                fontSize: 12,
              }}
            >
              ✕
            </button>
          </article>
        ))}

        {notifs.length === 0 && history.length === 0 && (
          <p
            style={{
              textAlign: 'center',
              fontSize: 14,
              color: 'var(--p31-text-secondary, #9CA3AF)',
              lineHeight: 1.6,
              pointerEvents: 'none',
            }}
          >
            🌌 No notifications. The starfield is calm.
          </p>
        )}
      </div>
    </section>
  );
}
