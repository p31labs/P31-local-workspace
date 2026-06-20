import React, { useState, useRef, useEffect, useCallback } from 'react';
import { routeIntent } from '../../../software/cloudflare-worker/{project}/command-center/src/cloud-hub-html.js';
import { setMuted } from '../../../software/cloudflare-worker/{project}/command-center/src/cloud-hub-html.js';
import { useDevice } from '../../../software/cloudflare-worker/{project}/command-center/src/cloud-hub-html.js';
import { Zap, Mic, Send } from 'lucide-react';

interface TerminalOmnibarProps {
  spoons: number;
  onSetSurface: (s: string) => void;
  onSetSpoons: (s: number) => void;
  onToggleHud: () => void;
  onShowHelp: () => void;
  onShowStatus: () => void;
  disabled?: boolean;
}

export default function TerminalOmnibar({
  spoons, onSetSurface, onSetSpoons, onToggleHud, onShowHelp, onShowStatus, disabled,
}: TerminalOmnibarProps) {
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const { inferredLevel } = useDevice();

  const execute = useCallback((input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setHistory(prev => [...prev, trimmed]);
    setHistoryIdx(-1);

    const clean = trimmed.toLowerCase();
    if (clean === '/help') return onShowHelp();
    if (clean === '/status' || clean === 'status') return onShowStatus();
    if (clean === 'hud' || clean === '/hud') return onToggleHud();

    const audioMatch = clean.match(/^audio\s+(on|off)$/);
    if (audioMatch) return setMuted(audioMatch[1] === 'off');

    const spoonsMatch = clean.match(/^spoons?\s*(\d)$/);
    if (spoonsMatch) return onSetSpoons(Math.max(0, Math.min(5, parseInt(spoonsMatch[1], 10))));

    const goMatch = clean.match(/^(?:go|goto|navigate|open)\s+(.+)/);
    const intentStr = goMatch ? goMatch[1] : clean;
    const surface = routeIntent(intentStr, spoons);

    if (surface !== 'GREETING' || clean.includes('greeting') || clean.includes('hello')) {
      onSetSurface(surface);
    } else {
      onSetSurface('GREETING');
    }
  }, [spoons, onSetSurface, onSetSpoons, onToggleHud, onShowHelp, onShowStatus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      execute(value);
      setValue('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const newIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(newIdx);
      setValue(history[newIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx === -1) return;
      const newIdx = historyIdx + 1;
      if (newIdx >= history.length) {
        setHistoryIdx(-1);
        setValue('');
      } else {
        setHistoryIdx(newIdx);
        setValue(history[newIdx]);
      }
    }
  };

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40"
      style={{ bottom: `${12 + Math.max(0, 4 - inferredLevel) * 4}px` }}
    >
      <div className={`flex items-center bg-[#050505]/90 backdrop-blur-xl border border-white/5 focus-within:border-emerald-500/40 rounded-full shadow-2xl transition-all ${inferredLevel <= 1 ? 'px-4 py-3 gap-2' : 'px-6 py-4 gap-3'}`}>
        <Zap size={inferredLevel <= 1 ? 14 : 16} className="text-emerald-500 shrink-0" />
        <span className={`text-emerald-500 font-mono shrink-0 font-bold ${inferredLevel <= 1 ? 'text-xs' : 'text-sm'}`}>$</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Enter intent or /help..."
          className="flex-1 bg-transparent border-none outline-none text-zinc-200 font-mono placeholder:text-zinc-600 ml-2"
          autoComplete="off"
        />
        <Mic size={inferredLevel <= 1 ? 14 : 18} className="text-zinc-500 hover:text-emerald-400 cursor-pointer shrink-0 transition-colors ml-2" />
        <Send
          size={inferredLevel <= 1 ? 14 : 18}
          className="text-zinc-500 hover:text-emerald-400 cursor-pointer shrink-0 ml-3 transition-colors"
          onClick={() => { execute(value); setValue(''); }}
        />
      </div>
    </div>
  );
}
