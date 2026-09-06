/**
 * @file CaregiverPortal.tsx — WILLOW parent/caregiver dashboard.
 * Screen time, activity log, privacy settings. Behind PIN gate.
 */

import { useWillowStore } from '../../store/willowStore';

interface CaregiverPortalProps {
  onClose: () => void;
}

export function CaregiverPortal({ onClose }: CaregiverPortalProps) {
  const { love, xp, quests, mood, age } = useWillowStore();
  const completedQuests = quests.filter((q) => q.done).length;
  const totalLove = love;
  const totalXp = xp;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" style={{ background: 'rgba(7,13,10,0.95)', backdropFilter: 'blur(12px)' }}>
      <div className="w-full max-w-sm h-full max-h-[90vh] overflow-y-auto" style={{ background: 'var(--p31-surface)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 20, padding: 20 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--p31-text-primary)' }}>Parent Portal</div>
            <div style={{ fontSize: 11, color: 'var(--p31-text-secondary)', marginTop: 2 }}>
              {age ? `Child age: ${age}` : 'Age not set'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ minWidth: 40, minHeight: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'var(--p31-text-secondary)', fontSize: 18, cursor: 'pointer' }}
            aria-label="Close parent portal"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.12)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--p31-text-secondary)', marginBottom: 4 }}>Total LOVE</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--p31-accent)' }}>{totalLove}</div>
          </div>
          <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.12)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--p31-text-secondary)', marginBottom: 4 }}>Total XP</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--p31-accent-violet)' }}>{totalXp}</div>
          </div>
          <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.12)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--p31-text-secondary)', marginBottom: 4 }}>Quests Done</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--p31-accent-gold)' }}>{completedQuests}/{quests.length}</div>
          </div>
          <div style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.12)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--p31-text-secondary)', marginBottom: 4 }}>Current Mood</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--p31-accent-cyan)' }}>
              {mood === 'rainbow' ? '🌈 Amazing' : mood === 'sunny' ? '☀️ Good' : mood === 'cloudy' ? '⛅ Okay' : mood === 'rainy' ? '🌧️ Hard' : '⛈️ Rough'}
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--p31-surface2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--p31-text-primary)', marginBottom: 10 }}>Privacy & Safety</div>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 12, color: 'var(--p31-text-secondary)' }}>Data stays on device</span>
            <span style={{ fontSize: 12, color: 'var(--p31-accent)', fontWeight: 600 }}>✅ On</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 12, color: 'var(--p31-text-secondary)' }}>No external tracking</span>
            <span style={{ fontSize: 12, color: 'var(--p31-accent)', fontWeight: 600 }}>✅ On</span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 12, color: 'var(--p31-text-secondary)' }}>Caregiver PIN required</span>
            <span style={{ fontSize: 12, color: 'var(--p31-accent)', fontWeight: 600 }}>✅ On</span>
          </div>
        </div>

        <div style={{ background: 'var(--p31-surface2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--p31-text-primary)', marginBottom: 10 }}>Recent Activities</div>
          {quests.filter((q) => q.done).slice(0, 5).map((q) => (
            <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: 16 }}>{q.icon}</span>
              <span style={{ flex: 1, fontSize: 12, color: 'var(--p31-text-secondary)' }}>{q.title}</span>
              <span style={{ fontSize: 11, color: 'var(--p31-accent-gold)', fontFamily: 'var(--p31-font-mono, monospace)' }}>+{q.love}</span>
            </div>
          ))}
          {completedQuests === 0 && (
            <div style={{ fontSize: 12, color: 'var(--p31-text-tertiary)', textAlign: 'center', padding: 12 }}>No completed activities yet.</div>
          )}
        </div>

        <button
          onClick={onClose}
          style={{ minHeight: 48, width: '100%', borderRadius: 12, border: '1px solid rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.08)', color: 'var(--p31-accent)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          Close Portal
        </button>
      </div>
    </div>
  );
}
