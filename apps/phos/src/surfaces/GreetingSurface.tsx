import React from 'react';
import { useAtmosphere } from '../components/AtmosphereProvider';

export const GreetingSurface: React.FC<{ className?: string }> = ({ className }) => {
  const { grayRock, spoons, setSurface } = useAtmosphere();
  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center ${className ?? ''}`}>
      {grayRock ? (
        <p className="font-mono text-xs text-zinc-500">System suspended.</p>
      ) : (
        <>
          <div className="text-4xl font-mono text-emerald-400 mb-2">P³¹</div>
          <p className="font-mono text-xs text-zinc-500 mb-6">
            spoons: {spoons}/5
          </p>
          <div className="flex gap-2">
            <button onClick={() => setSurface('IGNITION')}
              className="px-4 py-2 text-xs font-mono border border-emerald-800/40 text-emerald-400 rounded hover:bg-emerald-900/20">
              Enter
            </button>
            <button onClick={() => setSurface('COMPASS')}
              className="px-4 py-2 text-xs font-mono border border-zinc-700 text-zinc-400 rounded hover:bg-zinc-800">
              Comp​ass
            </button>
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

export default GreetingSurface;