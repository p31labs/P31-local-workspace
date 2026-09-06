import React, { useEffect, useState } from 'react';

const CrisisIsland = () => {
  const [spoons, setSpoons] = useState(3);

  useEffect(() => {
    const update = () => {
      const s = parseInt(document.documentElement.getAttribute('data-spoons') || '3', 10);
      setSpoons(s);
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-spoons'] });
    return () => observer.disconnect();
  }, []);

  if (spoons > 0) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: '#000' }}>
      <div className="text-center p-8 max-w-md">
        <div className="text-6xl mb-6 animate-pulse">💜</div>
        <h2 className="text-2xl font-bold text-white mb-4">Take a breath.</h2>
        <p className="text-white/60 mb-8">You're in crisis mode. Everything is paused. No timers, no pressure.</p>
        <button
          onClick={() => {
            localStorage.setItem('p31:spoons', '3');
            document.documentElement.setAttribute('data-spoons', '3');
            document.documentElement.setAttribute('data-theme', 'bridge');
          }}
          className="px-6 py-3 rounded-xl font-bold transition-colors"
          style={{ background: 'var(--p31-accent)', color: 'var(--p31-void)' }}
        >
          I'm ready to continue
        </button>
        <p className="text-white/30 text-xs mt-4">Press Escape to exit crisis mode</p>
      </div>
    </div>
  );
};

export default CrisisIsland;
