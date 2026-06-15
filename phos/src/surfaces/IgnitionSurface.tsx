import React from 'react';
import { useAtmosphere } from '../components/AtmosphereProvider';
import { useSpoonCapabilities } from '../hooks/useSpoonCapabilities';

export const IgnitionSurface: React.FC<{ className?: string }> = ({ className }) => {
  const { grayRock, spoons, setSurface } = useAtmosphere();
  const caps = useSpoonCapabilities();

  const allDestinations = [
    { key: 'ARCADE', label: 'Apps' },
    { key: 'HEARTH', label: 'Family' },
    { key: 'THE_BUFFER', label: 'Build' },
    { key: 'ARCHIVE', label: 'Knowledge' },
  ];

  const visibleDests = grayRock ? [] : allDestinations.slice(0, caps.maxVisibleSurfaces);

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center ${className ?? ''}`}>
      {grayRock ? (
        <p className="font-mono text-xs text-zinc-500">Ignition offline.</p>
      ) : (
        <>
          <span className="font-mono text-xs text-orange-500/60 tracking-widest uppercase mb-4">Ignition</span>
          <p className="font-mono text-xs text-zinc-400 mb-6 text-center max-w-xs">
            Welcome to PHOS — Phosphorus Human Operating Surface.<br />
            Choose your entry point.
          </p>
          {visibleDests.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {visibleDests.map((d) => (
                <button key={d.key} onClick={() => setSurface(d.key as any)}
                  className="px-4 py-2 text-xs font-mono border border-orange-800/40 text-orange-400 rounded hover:bg-orange-900/20">
                  {d.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="font-mono text-[10px] text-zinc-600">Navigation suspended in current energy state.</p>
          )}
          {spoons >= 2 && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <button onClick={() => setSurface('ARCADE_OS')}
                className="px-6 py-2 text-xs font-mono border border-emerald-400/40 text-emerald-400 rounded-full hover:bg-emerald-500/20 transition-all flex items-center gap-2">
                <span>🎮</span>
                <span>Arcade OS</span>
              </button>
              <button onClick={() => setSurface('WILLOW')}
                className="px-6 py-2 text-xs font-mono border border-pink-400/40 text-pink-400 rounded-full hover:bg-pink-500/20 transition-all flex items-center gap-2">
                <span>🧸</span>
                <span>Willow</span>
              </button>
              <a href="https://ko-fi.com/trimtab69420" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] rounded-full bg-pink-500/10 text-pink-400/70 hover:text-pink-300 hover:bg-pink-500/20 transition-all no-underline">
                <span>💜</span>
                <span>Support P31</span>
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
};
