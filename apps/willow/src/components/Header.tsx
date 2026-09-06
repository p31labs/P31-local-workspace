/**
 * @file Header.tsx — WILLOW top bar (genesis).
 * Brand, mood, LOVE, level, spoon toggle. Design-core/skin-willow tokens.
 */

import { useWillowStore, MOODS } from '../store/willowStore';

export function Header({ onOpenParentPortal }: { onOpenParentPortal?: () => void }) {
  const { love, xp, mood, spoons, setSpoons } = useWillowStore();
  const level = Math.floor(xp / 500) + 1;
  const curMood = MOODS.find((m) => m.id === mood);

  return (
    <header className="glass ui-chrome willow-header" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 14px', borderBottom: '1px solid rgba(52,211,153,0.1)',
      flexShrink: 0, zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: 'linear-gradient(135deg, var(--p31-accent), var(--p31-accent-violet))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🌿</div>
        <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '0.04em' }}>
          P31 <span style={{ color: 'var(--p31-accent)' }}>WILLOW</span>
        </span>
        <span style={{ fontSize: 14 }}>{curMood?.emoji}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 10 }}>
        <span style={{ color: 'var(--p31-accent-gold)' }}>❤️ {love}</span>
        <span style={{ color: 'var(--p31-text-tertiary)' }}>|</span>
        <span style={{ color: 'var(--p31-accent-violet)' }}>Lv.{level}</span>
        <span style={{ color: 'var(--p31-text-tertiary)' }}>|</span>
        {onOpenParentPortal && (
          <button
            onClick={onOpenParentPortal}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 7,
              border: '1px solid rgba(52,211,153,0.15)', background: 'transparent', color: 'var(--p31-text-tertiary)',
              fontSize: 10, fontFamily: 'var(--p31-font-mono, monospace)', cursor: 'pointer',
            }}
            aria-label="Open parent portal"
          >
            🛡️
          </button>
        )}
        <button
          onClick={() => setSpoons(((spoons + 1) % 6) as 0 | 1 | 2 | 3 | 4 | 5)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 7,
            border: `1px solid ${spoons <= 1 ? 'rgba(251,113,133,0.3)' : 'rgba(52,211,153,0.2)'}`,
            background: 'transparent', color: spoons <= 1 ? 'var(--p31-accent-red)' : 'var(--p31-text-secondary)',
            fontSize: 10, fontFamily: 'var(--p31-font-mono, monospace)', cursor: 'pointer',
          }}
          aria-label="Cycle spoon level"
        >⚡ {spoons}/5</button>
      </div>
    </header>
  );
}
