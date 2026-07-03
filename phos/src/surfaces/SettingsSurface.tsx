import React, { useState } from 'react';
import { useAtmosphere } from '../components/AtmosphereProvider';
import { useSovereignBrain } from '../hooks/useSovereignBrain';

export const SettingsSurface: React.FC<{ className?: string }> = ({ className }) => {
  const { grayRock, setGrayRock } = useAtmosphere();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [devMode, setDevMode] = useState(false);

  const {
    status: brainStatus,
    progress: brainProgress,
    tier: brainTier,
    isLocalSupported: brainSupported,
    isLocalReady: brainReady,
    toggleLocalBrain,
  } = useSovereignBrain();

  const brainActive = brainStatus === 'downloading' || (brainStatus === 'ready' && brainTier === 'local');

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

          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="font-mono text-xs text-zinc-300">Sovereign AI</span>
                {brainReady && (
                  <span className="ml-2 text-[10px] text-emerald-500 font-mono">ACTIVE</span>
                )}
              </div>
              <button
                onClick={toggleLocalBrain}
                disabled={!brainSupported || brainStatus === 'downloading'}
                className={`w-8 h-4 rounded-full border relative ${
                  brainActive ? 'bg-emerald-600 border-emerald-500' : 'bg-zinc-800 border-zinc-600'
                } ${!brainSupported ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${brainActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {brainStatus === 'downloading' && (
              <div className="mt-2 space-y-1">
                <div className="w-full h-1 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.round(brainProgress * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] font-mono text-zinc-500">
                  Downloading model... {Math.round(brainProgress * 100)}%
                </p>
              </div>
            )}
            {!brainSupported && (
              <p className="text-[10px] font-mono text-zinc-600 mt-1">
                WebGPU not available on this device
              </p>
            )}
            {brainStatus === 'error' && (
              <p className="text-[10px] font-mono text-red-500 mt-1">
                Failed to load model. Edge AI will be used as fallback.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsSurface;
