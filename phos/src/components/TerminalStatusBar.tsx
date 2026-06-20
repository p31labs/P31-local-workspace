import React, { useState, useEffect } from 'react';
import { getBalance } from '../../../software/cloudflare-worker/{project}/command-center/src/cloud-hub-html.js';
import { isMuted } from '../../../software/cloudflare-worker/{project}/command-center/src/cloud-hub-html.js';
import { useDevice } from '../../../software/cloudflare-worker/{project}/command-center/src/cloud-hub-html.js';
import { Waves, Database, Activity, Monitor, Layers, Wifi } from 'lucide-react';

interface TerminalStatusBarProps {
  themeName: string;
  spoons: number;
}

export default function TerminalStatusBar({ themeName, spoons }: TerminalStatusBarProps) {
  const [karma, setKarma] = useState(0);
  const { currentDevice, inferredLevel, isSuperposition, toggleSuperposition, devices } = useDevice();
  const onlineCount = devices.filter(d => d.online).length;

  useEffect(() => {
    const tick = () => setKarma(getBalance());
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, []);

  if (themeName !== 'QUANTUM') {
    return <div className="h-6 bg-black/80 flex items-center px-4 text-[9px] font-mono text-emerald-600/40 tracking-wider select-none shrink-0" />;
  }

  return (
    <div className="w-full flex items-center justify-between px-8 py-5 shrink-0 select-none z-30 relative">
      <div className="flex items-center gap-3 text-emerald-400 font-mono tracking-widest text-sm font-bold">
        <span className="opacity-70">&gt;_</span>
        <span>PHOS <span className="opacity-40">//</span> NATIVE</span>
        <span className="ml-3 text-[10px] text-zinc-500 flex items-center gap-1.5 border border-white/5 px-3 py-1 rounded-full">
          <Monitor size={10} className="opacity-70" />
          {currentDevice.name} <span className="opacity-40">| LVL.{currentDevice.level}</span>
        </span>
      </div>

      <div className="flex items-center gap-4 font-mono text-[10px] font-medium tracking-wider">
        <button
          onClick={toggleSuperposition}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
            isSuperposition
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-white/5 bg-white/5 text-zinc-500 hover:border-emerald-500/20 hover:text-emerald-400/60'
          }`}
          aria-label="Toggle superposition mode"
        >
          <Layers size={12} className={isSuperposition ? 'animate-pulse' : 'opacity-70'} />
          {isSuperposition ? 'SUPERPOSITION' : `${onlineCount} NODES`}
        </button>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/5 bg-white/5 text-zinc-500">
          <Waves size={12} className="opacity-70" /> {isMuted() ? 'AUDIO OFF' : 'AUDIO ON'}
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
          <Database size={12} className="opacity-70" /> KARMA: {karma}
        </div>

        <div className="flex items-center gap-4 px-5 py-2 rounded-full border border-white/5 bg-white/5 text-zinc-500">
          <div className="flex items-center gap-2 text-zinc-400"><Activity size={12} className="opacity-70" /> SPOONS:</div>
          <div className="flex items-center gap-3">
            {[0, 1, 2, 3, 4, 5].map(s => (
              <span
                key={s}
                className={spoons === s
                  ? 'text-emerald-400 border border-emerald-500/40 rounded-full w-5 h-5 flex items-center justify-center bg-emerald-500/10'
                  : 'opacity-50'
                }
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
