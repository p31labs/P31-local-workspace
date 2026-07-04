import React, { useState } from 'react';
import { useAtmosphere } from '../components/AtmosphereProvider';
import AtomOrbitals from '../components/ambient/AtomOrbitals';

export const BondingSurface: React.FC<{ className?: string }> = ({ className }) => {
  const { grayRock, spoons } = useAtmosphere();
  const [launched, setLaunched] = useState(false);

  if (launched) {
    return (
      <div className={`relative w-full h-full flex flex-col ${className ?? ''}`}>
        <div className="flex justify-between items-center p-3 bg-black/60 border-b border-white/10">
          <span className="font-mono text-xs text-amber-400 tracking-widest uppercase">BONDING // Molecular Chemistry</span>
          <button onClick={() => setLaunched(false)} className="px-3 py-1 text-xs font-mono border border-white/20 text-white/70 rounded hover:bg-white/10">
            ← Back
          </button>
        </div>
        <iframe
          src="https://bonding.p31ca.org"
          className="w-full flex-grow border-0"
          title="BONDING Molecular Chemistry Game"
          allow="fullscreen"
        />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className ?? ''}`}>
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <AtomOrbitals />
      </div>
      <div className="relative flex flex-col items-center justify-center h-full text-center py-20" style={{ zIndex: 1 }}>
        {grayRock ? (
          <p className="font-mono text-xs text-zinc-500">Bonding suspended.</p>
        ) : (
          <>
            <span className="font-mono text-xs text-amber-500/60 tracking-widest uppercase mb-4">Molecular Bonding</span>
            <p className="font-mono text-xs text-zinc-400 mb-2">Build molecules. Learn chemistry. Document engagement.</p>
            <p className="font-mono text-[10px] text-zinc-600 mb-6">Every atom placed = timestamped parental engagement log</p>
            <button
              onClick={() => setLaunched(true)}
              className="px-6 py-3 text-sm font-mono border border-amber-500/50 text-amber-400 rounded-lg hover:bg-amber-900/30 transition-all tracking-widest"
            >
              LAUNCH_BONDING
            </button>
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
    </div>
  );
};

export default BondingSurface;
