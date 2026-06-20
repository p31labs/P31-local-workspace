import React, { useState, useCallback } from 'react';
import type { ThemeShape } from '../lib/themeEngine';
import { useDevice } from '../../../software/cloudflare-worker/{project}/command-center/src/cloud-hub-html.js';
import { Layers, Link2, WifiOff, Check } from 'lucide-react';

export function SuperpositionSurface({ theme, spoons }: { theme: ThemeShape; spoons: number }) {
  const { devices, currentDevice, isSuperposition } = useDevice();
  const isLowEnergy = spoons <= 1;
  const onlineNodes = devices.filter(d => d.online && d.id !== currentDevice.id);
  const [linking, setLinking] = useState<string | null>(null);
  const [linked, setLinked] = useState<Set<string>>(new Set());

  const handleLink = useCallback((deviceId: string) => {
    setLinking(deviceId);
    setTimeout(() => {
      setLinking(null);
      setLinked(prev => new Set(prev).add(deviceId));
      setTimeout(() => {
        setLinked(prev => {
          const next = new Set(prev);
          next.delete(deviceId);
          return next;
        });
      }, 3000);
    }, 1500);
  }, []);

  return (
    <div className={`w-full mx-auto p-4 md:p-8 z-20 relative ${isLowEnergy ? 'opacity-70' : 'opacity-100'}`}>
      <div className="flex items-center gap-3 mb-8 text-emerald-400 font-mono">
        <Layers className="animate-pulse" />
        <h2 className="text-xl tracking-widest uppercase">Superposition Canvas</h2>
      </div>

      {onlineNodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-emerald-900/30 rounded-2xl bg-[#050505]/50 backdrop-blur-sm">
          <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse mb-4 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
          <p className="font-mono text-sm text-emerald-500/70 tracking-widest">SCANNING LOCAL MESH...</p>
          <p className="font-mono text-[10px] text-zinc-500 mt-2">No other authorized nodes detected.</p>
        </div>
      ) : (
        <div className={`grid ${theme.gridCols || 'grid-cols-1 md:grid-cols-2'} gap-6`}>
          {devices.filter(d => d.online).map(device => (
            <div
              key={device.id}
              className={`${theme.surfaceCard || 'p-4 border border-white/5 rounded-xl'} ${
                device.id === currentDevice.id
                  ? 'border-emerald-500/40 ring-1 ring-emerald-500/20'
                  : 'opacity-80'
              } transition-all duration-500 relative overflow-hidden group`}
            >
              {device.id === currentDevice.id && (
                <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-500/50" />
              )}

              <div className="flex items-center gap-2 mb-4">
                <div className={`w-2 h-2 rounded-full ${device.online ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-red-500'}`} />
                <span className="font-mono text-sm font-bold text-emerald-400/90">{device.name}</span>
                <span className="ml-auto text-[10px] font-mono text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded-full">LVL.{device.level}</span>
              </div>

              <div className="text-xs font-mono text-zinc-400 space-y-3">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span>STATUS:</span>
                  <span className={device.online ? 'text-emerald-500/70' : 'text-red-500/70'}>
                    {device.online ? 'CONNECTED' : 'OFFLINE'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span>IP ADDRESS:</span>
                  <span>{device.ip || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>ACTIVE SURFACE:</span>
                  <span className="text-emerald-300">
                    {device.id === currentDevice.id ? 'SUPERPOSITION' : 'GREETING'}
                  </span>
                </div>
              </div>

              {isSuperposition && device.online && device.id !== currentDevice.id && !isLowEnergy && (
                <button
                  onClick={() => handleLink(device.id)}
                  disabled={linking === device.id || linked.has(device.id)}
                  className={`mt-6 w-full py-2 flex items-center justify-center gap-2 border text-[10px] font-mono transition-all rounded-lg ${
                    linking === device.id
                      ? 'bg-amber-950/20 border-amber-900/30 text-amber-500 animate-pulse'
                      : linked.has(device.id)
                      ? 'bg-emerald-950/30 border-emerald-700/40 text-emerald-400'
                      : 'bg-emerald-950/20 hover:bg-emerald-900/40 border-emerald-900/30 text-emerald-500'
                  }`}
                >
                  {linking === device.id ? (
                    <>LINKING...</>
                  ) : linked.has(device.id) ? (
                    <><Check size={12} /> LINK ESTABLISHED</>
                  ) : (
                    <><Link2 size={12} /> ESTABLISH DATA LINK</>
                  )}
                </button>
              )}
              {!device.online && (
                <div className="mt-6 w-full py-2 flex items-center justify-center gap-2 bg-red-950/10 border border-red-900/20 text-[10px] font-mono text-red-500/50 rounded-lg">
                  <WifiOff size={12} /> NODE UNREACHABLE
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
