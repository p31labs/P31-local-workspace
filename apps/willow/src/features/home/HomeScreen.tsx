/**
 * @file HomeScreen.tsx — WILLOW home (genesis).
 * Orb, XP bar, mood selector, today's quests. Ported from prototype.
 */

import { GlassCard, GlowButton } from '@p31ca/ui/chrome';
import { QuantumLayer } from '@p31ca/ui/quantum';
import { useWillowStore, MOODS } from '../../store/willowStore';

export function HomeScreen({ onQuests }: { onQuests?: () => void }) {
  const { mood, setMood, love, xp, quests, earnLove } = useWillowStore();
  const todayQuests = quests.filter((q) => !q.done).slice(0, 3);
  const xpProgress = xp % 500;
  const level = Math.floor(xp / 500) + 1;

  return (
    <div className="flex flex-col gap-3.5 h-full animate-[fadeUp_0.22s_ease-out]">
      <QuantumLayer simplified linkBase="https://p31ca.org" />
      <div className="flex flex-col items-center py-3">
        <div style={{ position: 'relative' }}>
          <div className="animate-[ripple_2s_ease-out_infinite]" style={{ position: 'absolute', inset: -20, borderRadius: '50%', border: '2px solid rgba(52,211,153,0.2)', pointerEvents: 'none' }} />
          <button
            onClick={() => earnLove(1)}
            className="animate-[orb-pulse_3s_ease-in-out_infinite]"
            style={{
              width: 90, height: 90, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(52,211,153,0.35), rgba(52,211,153,0.06))',
              border: '2px solid rgba(52,211,153,0.4)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 38, cursor: 'pointer',
            }}
            aria-label="Send Willow some love"
          >🌿</button>
        </div>
        <div style={{ marginTop: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Hey, I’m Willow 🌱</div>
          <div style={{ fontSize: 11, color: 'var(--p31-text-secondary)', marginTop: 2 }}>Level {level} · {xp} XP · {love} ❤️ LOVE</div>
        </div>
        <div style={{ width: '100%', maxWidth: 200, marginTop: 8 }}>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(xpProgress / 500) * 100}%`, background: 'linear-gradient(90deg, var(--p31-accent), var(--p31-accent-violet))', borderRadius: 2, transition: 'width 0.4s' }} />
          </div>
          <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 9, color: 'var(--p31-text-secondary)', textAlign: 'right', marginTop: 3 }}>{xpProgress}/500 to Lv.{level + 1}</div>
        </div>
      </div>

      <GlassCard className="p-3.5">
        <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 9, color: 'var(--p31-text-secondary)', letterSpacing: '0.14em', marginBottom: 8 }}>HOW ARE YOU FEELING?</div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {MOODS.map((m) => (
            <button
              key={m.id}
              onClick={() => { setMood(m.id); earnLove(3); }}
              title={m.label}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 10px',
                borderRadius: 12, border: `1px solid ${mood === m.id ? 'rgba(52,211,153,0.4)' : 'transparent'}`,
                background: mood === m.id ? 'rgba(52,211,153,0.08)' : 'transparent', transition: 'all 0.15s',
                minWidth: 44, minHeight: 44, cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 20 }}>{m.emoji}</span>
              <span style={{ fontSize: 9, color: mood === m.id ? 'var(--p31-accent)' : 'var(--p31-text-secondary)' }}>{m.label}</span>
            </button>
          ))}
        </div>
      </GlassCard>

      {todayQuests.length > 0 ? (
        <GlassCard className="p-3.5 flex-1 overflow-auto">
          <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 9, color: 'var(--p31-text-secondary)', letterSpacing: '0.14em', marginBottom: 8 }}>TODAY’S QUESTS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todayQuests.map((q) => (
              <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.1)' }}>
                <span style={{ fontSize: 20 }}>{q.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{q.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--p31-text-secondary)' }}>{q.desc}</div>
                </div>
                <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 10, color: 'var(--p31-accent-gold)', flexShrink: 0 }}>+{q.love} ❤️</div>
              </div>
            ))}
            <GlowButton color="green" size="sm" className="mt-1 self-start" onClick={onQuests}>See all quests →</GlowButton>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="p-6 text-center">
          <div style={{ fontSize: 32, marginBottom: 8 }}>🌟</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--p31-accent)' }}>All quests complete!</div>
          <div style={{ fontSize: 11, color: 'var(--p31-text-secondary)', marginTop: 4 }}>Amazing work today. You earned it 💚</div>
        </GlassCard>
      )}
    </div>
  );
}
