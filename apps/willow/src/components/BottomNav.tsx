/**
 * @file BottomNav.tsx — WILLOW primary navigation (genesis).
 * 5 tabs: Home, Create, Portal, Quests, Buddy.
 */

export type TabId = 'home' | 'draw' | 'portal' | 'quests' | 'buddy';

const NAV_ITEMS: { id: TabId; emoji: string; label: string }[] = [
  { id: 'home', emoji: '🏠', label: 'Home' },
  { id: 'draw', emoji: '🎨', label: 'Create' },
  { id: 'portal', emoji: '🌊', label: 'Portal' },
  { id: 'quests', emoji: '⚔️', label: 'Quests' },
  { id: 'buddy', emoji: '💚', label: 'Buddy' },
];

interface BottomNavProps {
  active: TabId;
  onChange: (t: TabId) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="glass ui-chrome" aria-label="Primary" style={{
      height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      borderTop: '1px solid rgba(52,211,153,0.1)', borderRadius: 0, zIndex: 10, flexShrink: 0,
    }}>
      {NAV_ITEMS.map(({ id, emoji, label }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-current={isActive ? 'page' : undefined}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '6px 12px', minWidth: 48, minHeight: 48, borderRadius: 12,
              background: isActive ? 'rgba(52,211,153,0.1)' : 'transparent',
              border: `1px solid ${isActive ? 'rgba(52,211,153,0.3)' : 'transparent'}`,
              transition: 'all 0.15s', cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{emoji}</span>
            <span style={{ fontSize: 10, color: isActive ? 'var(--p31-accent)' : 'var(--p31-text-tertiary)', fontWeight: isActive ? 600 : 400 }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
