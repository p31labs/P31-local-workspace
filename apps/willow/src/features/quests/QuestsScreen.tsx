/**
 * @file QuestsScreen.tsx — WILLOW quests + skill tree (genesis).
 * Ported from prototype, design-core tokens.
 */

import { useState } from 'react';
import { GlassCard, GlowButton } from '@p31/ui/chrome';
import { useWillowStore, SKILLS } from '../../store/willowStore';

export function QuestsScreen() {
  const { quests, completeQuest, xp } = useWillowStore();
  const [tab, setTab] = useState<'quests' | 'skills'>('quests');
  const done = quests.filter((q) => q.done).length;

  return (
    <div className="flex flex-col gap-3 h-full animate-[fadeUp_0.22s_ease-out]">
      <div className="flex gap-1 border-b border-[rgba(52,211,153,0.1)]">
        {[['quests', '⚔️ Quests'], ['skills', '🌟 Skills']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id as 'quests' | 'skills')}
            style={{
              padding: '8px 14px', border: 'none', borderBottom: `2px solid ${tab === id ? 'var(--p31-accent)' : 'transparent'}`,
              background: 'transparent', color: tab === id ? 'var(--p31-accent)' : 'var(--p31-text-tertiary)', fontSize: 12,
              fontWeight: tab === id ? 600 : 400, cursor: 'pointer',
            }}
          >{label}</button>
        ))}
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 10, color: 'var(--p31-text-secondary)', padding: '10px 0' }}>{done}/{quests.length} done</div>
      </div>

      {tab === 'quests' && (
        <div className="flex-1 overflow-y-auto flex flex-col gap-2">
          {quests.map((q) => (
            <GlassCard key={q.id} className="flex items-center gap-2.5 p-2.5" style={{ borderColor: q.done ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.07)', opacity: q.done ? 0.7 : 1 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{q.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, textDecoration: q.done ? 'line-through' : 'none', color: q.done ? 'var(--p31-text-secondary)' : 'var(--p31-text-primary)' }}>{q.title}</div>
                <div style={{ fontSize: 10, color: 'var(--p31-text-secondary)', marginTop: 2 }}>{q.desc}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <span style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 9, color: 'var(--p31-accent-violet)' }}>+{q.xp} XP</span>
                  <span style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 9, color: 'var(--p31-accent-gold)' }}>+{q.love} ❤️</span>
                </div>
              </div>
              {q.done ? <span style={{ fontSize: 20 }}>✅</span> : (
                <GlowButton color="green" size="sm" onClick={() => completeQuest(q.id)}>Claim</GlowButton>
              )}
            </GlassCard>
          ))}
        </div>
      )}

      {tab === 'skills' && (
        <div className="flex-1 overflow-y-auto flex flex-col gap-2.5">
          {SKILLS.map((s) => {
            const progress = Math.min(1, xp / (s.xpNeeded * s.level));
            return (
              <GlassCard key={s.id} className="p-2.5">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{s.emoji}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{s.label}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 11, color: s.color, fontWeight: 700 }}>Lv.{s.level}</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress * 100}%`, background: s.color, borderRadius: 3, transition: 'width 0.4s' }} />
                </div>
                <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 9, color: 'var(--p31-text-secondary)', marginTop: 4 }}>
                  {Math.floor(progress * s.xpNeeded * s.level)} / {s.xpNeeded * s.level} XP to Lv.{s.level + 1}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
