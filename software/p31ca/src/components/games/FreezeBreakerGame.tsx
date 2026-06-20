import { useEffect, useState, useCallback } from 'react';
import { useSpoonStore } from '../lib/arcade-core/spoonStore.js';
import { on, emit } from '../lib/arcade-core/eventBus.js';

export function FreezeBreakerGame() {
  const { state: spoon, setLevel } = useSpoonStore();
  const [sessionCount, setSessionCount] = useState(0);
  const [lastStatus, setLastStatus] = useState('idle');

  const handleComplete = useCallback(() => {
    setLastStatus('complete');
    setSessionCount(c => c + 1);
    emit('p31:freezeBreakComplete', { streak: 1 });
    if (spoon.level < 12) {
      setLevel(spoon.level + 1, 'phos');
    }
  }, [spoon.level, setLevel]);

  useEffect(() => {
    if (spoon.level <= 1) {
      setLastStatus('rest');
      emit('p31:spoon:requested', { reason: 'low_spoons' });
    }
  }, [spoon.level]);

  useEffect(() => {
    return on('p31:triggerFreezeBreak', () => {
      setLastStatus('breaking');
    });
  }, []);

  const blocked = spoon.level <= 1;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center" style={{ background: '#0f1115' }}>
      {/* HUD */}
      <div className="absolute top-16 left-0 right-0 flex items-center justify-between px-5 z-10">
        <div className="flex items-center gap-3">
          <span className="text-[10px] tracking-[0.3em] uppercase text-white/40 font-bold">
            EXECUTIVE FREEZE INTERVENTION
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono text-white/35 tracking-widest">
            sessions: {sessionCount}
          </span>
          <span
            className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded"
            style={{
              color: blocked ? '#cc6247' : lastStatus === 'complete' ? '#3ba372' : '#7ec8e3',
              background: 'rgba(255,255,255,0.05)',
            }}
          >
            {blocked ? 'REST REQUIRED' : lastStatus}
          </span>
        </div>
      </div>

      {/* Spoons indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-3 px-5 py-3 rounded-full" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-sm">🥄</span>
          <div className="w-32 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(spoon.level / 12) * 100}%`,
                background: spoon.level <= 1 ? '#cc6247' : spoon.level <= 3 ? '#cda852' : '#4db8a8',
              }}
            />
          </div>
          <span className="text-[11px] font-mono font-bold text-white/80 min-w-[32px] text-right">
            {spoon.level}/12
          </span>
        </div>
      </div>

      {blocked && (
        <div className="absolute inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="text-center max-w-xs p-8" style={{ background: 'rgba(15,17,21,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' }}>
            <p className="text-4xl mb-4">🧘</p>
            <p className="text-base font-bold mb-2" style={{ color: '#cda852' }}>Spoons Critically Low</p>
            <p className="text-sm text-white/60 mb-4">
              Your cognitive energy is at <strong>{spoon.level}</strong>. Rest before attempting executive tasks.
            </p>
            <p className="text-xs text-white/40 font-mono">
              Recovery estimate: {spoon.recoveryMinutes} min
            </p>
          </div>
        </div>
      )}

      <FreezeBreakerOverlay onComplete={handleComplete} thresholdTime={3} spoonLevel={spoon.level} />
    </div>
  );
}
