import React from 'react';

const D20_POINTS = [...Array(20)].map((_, i) => {
  const phi = Math.acos(1 - 2 * (i + 0.5) / 20);
  const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
  return { id: i + 1, phi, theta };
});

export const HolographicD20 = ({ activeId, onSelect }) => {
  return (
    <div className="relative w-80 h-80 perspective-[1200px] transform-style-3d">
      <style>{`
        .perspective-[1200px] { perspective: 1200px; }
        .transform-style-3d { transform-style: preserve-3d; }
        @keyframes d20-spin {
          0% { transform: rotateY(0deg) rotateX(20deg); }
          100% { transform: rotateY(360deg) rotateX(20deg); }
        }
        .animate-d20 { animation: d20-spin 25s linear infinite; }
      `}</style>
      <div className="absolute inset-0 animate-d20 transform-style-3d">
        <div className="absolute inset-4 rounded-full border-2 border-cyan-500/20 bg-white/5 backdrop-blur-sm shadow-[inset_0_0_40px_rgba(0,243,255,0.2)]" />
        {D20_POINTS.map((pt) => {
          const r = 140;
          const x = r * Math.cos(pt.theta) * Math.sin(pt.phi);
          const y = r * Math.sin(pt.theta) * Math.sin(pt.phi);
          const z = r * Math.cos(pt.phi);
          const isActive = activeId === pt.id;
          return (
            <div
              key={pt.id}
              className="absolute top-1/2 left-1/2 transform-style-3d transition-all duration-700"
              style={{ transform: `translate3d(${x}px, ${y}px, ${z}px)` }}
            >
              <button
                type="button"
                onClick={() => onSelect(pt.id)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded border flex items-center justify-center text-[10px] font-black transition-all
                  ${isActive
                    ? 'bg-red-950 border-red-500 text-white shadow-[0_0_25px_red] scale-150 z-50'
                    : 'bg-black/80 border-cyan-500/40 text-cyan-400 hover:border-cyan-300 z-10'
                  }
                `}
                style={{ transform: `rotateY(${-pt.theta}rad) rotateX(${-pt.phi}rad)` }}
              >
                {pt.id}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
