import React from 'react';
import { useAtmosphere } from '../components/AtmosphereProvider';

export const IgnitionSurface: React.FC<{ className?: string }> = ({ className }) => {
  const { grayRock, spoons, setSurface } = useAtmosphere();
  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center ${className ?? ''}`}>
      {grayRock ? (
        <p className="font-sans text-xs text-zinc-500">Ignition offline.</p>
      ) : (
        <>
          <span className="text-xs font-sans text-white/40 tracking-wide mb-4">Ignition</span>
          <p className="text-xs font-sans text-zinc-400 mb-6 text-center max-w-xs">
            Welcome to PHOS — Phosphorus Human Operating Surface.<br />
            Choose your entry point.
          </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'ARCADE', label: 'Apps' },
                { key: 'HEARTH', label: 'Family' },
                { key: 'THE_BUFFER', label: 'Build' },
                { key: 'ARCHIVE', label: 'Knowledge' },
              ].map((d) => (
                <button key={d.key} onClick={() => setSurface(d.key as any)}
                  className="px-4 py-2 text-xs font-sans border border-white/10 text-white/60 rounded hover:bg-white/10">
                  {d.label}
                </button>
              ))}
            </div>
            <div className="mt-6">
              <a href="https://ko-fi.com/trimtab69420" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] rounded-full bg-pink-500/10 text-pink-400/70 hover:text-pink-300 hover:bg-pink-500/20 transition-all no-underline">
                <span>💜</span>
                <span>Support P31</span>
              </a>
            </div>
        </>
      )}
    </div>
  );
};

export default IgnitionSurface;