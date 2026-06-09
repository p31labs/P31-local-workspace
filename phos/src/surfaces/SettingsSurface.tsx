import React, { useState } from 'react';
import { useAtmosphere } from '../components/AtmosphereProvider';

export const SettingsSurface: React.FC<{ className?: string }> = ({ className }) => {
  const { grayRock, setGrayRock } = useAtmosphere();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [devMode, setDevMode] = useState(false);
  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center ${className ?? ''}`}>
      {grayRock ? (
        <p className="font-mono text-xs text-zinc-500">Settings locked.</p>
      ) : (
        <div className="w-full max-w-xs p-4 space-y-3">
          <h2 className="font-mono text-xs text-zinc-400 tracking-widest uppercase mb-4">Settings</h2>
          <label className="flex items-center justify-between">
            <span className="font-mono text-xs text-zinc-300">Reduce Motion</span>
            <button onClick={() => setReduceMotion(!reduceMotion)}
              className={`w-8 h-4 rounded-full border ${reduceMotion ? 'bg-emerald-600 border-emerald-500' : 'bg-zinc-800 border-zinc-600'} relative`}>
              <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${reduceMotion ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </label>
          <label className="flex items-center justify-between">
            <span className="font-mono text-xs text-zinc-300">GRAY ROCK</span>
            <button onClick={() => setGrayRock(!grayRock)}
              className={`w-8 h-4 rounded-full border ${grayRock ? 'bg-red-600 border-red-500' : 'bg-zinc-800 border-zinc-600'} relative`}>
              <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${grayRock ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </label>
          <label className="flex items-center justify-between">
            <span className="font-mono text-xs text-zinc-300">Dev Mode</span>
            <button onClick={() => setDevMode(!devMode)}
              className={`w-8 h-4 rounded-full border ${devMode ? 'bg-amber-600 border-amber-500' : 'bg-zinc-800 border-zinc-600'} relative`}>
              <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${devMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </label>
        </div>
      )}
    </div>
  );
};

export default SettingsSurface;