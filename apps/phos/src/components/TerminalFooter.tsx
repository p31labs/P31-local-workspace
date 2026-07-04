import React from 'react';

export default function TerminalFooter() {
  return (
    <div className="absolute bottom-4 w-full flex items-center justify-center gap-6 text-[9px] font-mono text-emerald-800/50 tracking-widest uppercase select-none z-30">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        State: FLOW
      </div>
      <span className="opacity-20">|</span>
      <span>TAURI BRIDGE: SECURED</span>
    </div>
  );
}
