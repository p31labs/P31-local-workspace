import { useEffect, useRef } from 'react';
import { CyberneticBonsaiScene } from './CyberneticBonsaiScene';
import { useSpoonStore } from '../../lib/arcade-core/spoonStore.ts';
import { emit } from '../../lib/arcade-core/eventBus.ts';

export function BonsaiGame() {
  const { state: spoon, setLevel } = useSpoonStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // PID input events from keyboard (for manual control)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyS') {
        emit('p31:pidAction', { type: 'sigh' });
        setLevel(Math.max(0, spoon.level - 1), 'manual');
      }
      if (e.code === 'KeyP') emit('p31:pidAction', { type: 'sleep' });
      if (e.code === 'KeyD') emit('p31:pidAction', { type: 'task' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setLevel, spoon.level]);

  return (
    <div ref={containerRef} className="fixed inset-0 z-10">
      <CyberneticBonsaiScene spoonLevel={spoon.level} />
      {/* HUD */}
      <div className="absolute top-16 left-5 z-20">
        <div className="px-4 py-2 rounded-lg text-[10px] tracking-widest uppercase font-bold"
          style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', color: '#cda852' }}>
          🧠 PID CONTROLLER ACTIVE
        </div>
        <p className="text-[10px] text-white/40 mt-2 font-mono">
          S = sigh (P) &nbsp;|&nbsp; P = pause (I) &nbsp;|&nbsp; D = task (D)
        </p>
        <p className="text-[10px] text-white/30 mt-1 font-mono">
          spoons: {spoon.level}/12 &nbsp;|&nbsp; jitter: {(spoon.jitterFactor * 100).toFixed(0)}%
        </p>
      </div>
    </div>
  );
}
