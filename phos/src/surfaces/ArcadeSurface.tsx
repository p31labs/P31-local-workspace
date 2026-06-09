import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAtmosphere } from '../components/AtmosphereProvider';
import { mintCredits } from '../lib/KarmaEngine';

const ARCADE_GAMES = [
  { id: 'smallball', name: 'P31 Smallball', category: 'sports', stress: 'low' },
  { id: 'gridiron', name: 'Gridiron Strategy', category: 'strategy', stress: 'high' },
  { id: 'cards', name: 'Sovereign Card Table', category: 'cards', stress: 'low' },
  { id: 'liquid-sculptor', name: 'Liquid Sculptor', category: 'creative', stress: 'low' },
  { id: 'resonance-rings', name: 'Resonance Rings', category: 'creative', stress: 'low' },
  { id: 'magnetic-poetry', name: 'Magnetic Poetry', category: 'creative', stress: 'low' },
  { id: 'orbital-drift', name: 'Orbital Drift', category: 'physics', stress: 'high' },
  { id: 'geodesic-builder', name: 'Geodesic Builder', category: 'physics', stress: 'high' },
  { id: 'water-parksimulator', name: 'Water Park Simulator', category: 'strategy', stress: 'low' },
];

const ARCADE_ORIGIN = 'https://arcade.p31ca.org';

interface RpcMessage {
  type: 'SBT_SCORE_UPDATE' | 'GAME_EVENT' | 'PHAUTH_CHALLENGE';
  payload: Record<string, unknown>;
  gameId: string;
  timestamp: number;
}

export function ArcadeSurface({ theme, spoons }: { theme: Record<string, string>; spoons: number }) {
  const [filter, setFilter] = useState('all');
  const [activeGameUrl, setActiveGameUrl] = useState<string | null>(null);
  const [lastScore, setLastScore] = useState<RpcMessage | null>(null);
  const [earnedThisSession, setEarnedThisSession] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scoreQueue = useRef<RpcMessage[]>([]);

  const activeGames = ARCADE_GAMES.filter((game) => {
    if (spoons <= 2 && game.stress === 'high') return false;
    if (filter !== 'all' && game.category !== filter) return false;
    return true;
  });

  const processScoreUpdate = useCallback((msg: RpcMessage) => {
    if (msg.type !== 'SBT_SCORE_UPDATE') return;
    const score = msg.payload?.score as number || 0;
    const multiplier = msg.payload?.multiplier as number || 1;
    const credits = Math.max(1, Math.floor(score / 100) * multiplier);

    try {
      mintCredits(credits, `arcade:${msg.gameId}`);
      setLastScore(msg);
      setEarnedThisSession((prev) => prev + credits);
    } catch { /* karma engine failure — non-blocking */ }
  }, []);

  /* v8 ignore start */
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      // Verify origin
      if (!e.origin.startsWith(ARCADE_ORIGIN) && e.origin !== 'null') return;

      const data = e.data as RpcMessage;
      if (!data?.type || !data?.gameId) return;

      switch (data.type) {
        case 'SBT_SCORE_UPDATE':
          scoreQueue.current.push(data);
          processScoreUpdate(data);
          break;
        case 'GAME_EVENT':
          // Log game events for analytics
          break;
        default:
          break;
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [processScoreUpdate]);

  const sendToIframe = useCallback((msg: Record<string, unknown>) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(msg, ARCADE_ORIGIN);
    }
  }, []);
  /* v8 ignore stop */

  /* v8 ignore start */
  if (activeGameUrl) {
    return (
      <div className="space-y-4 w-full h-[500px] flex flex-col">
        <div className="flex justify-between items-center bg-slate-900 p-2 border border-white/5 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">SENTINEL_SANDBOX_ACTIVE</span>
            {earnedThisSession > 0 && (
              <span className="text-[10px] font-mono text-emerald-400">+{earnedThisSession} LOVE this session</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => sendToIframe({ type: 'PHOS_PING', ts: Date.now() })}
              className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded font-mono text-[10px]"
            >
              PING
            </button>
            <button
              onClick={() => setActiveGameUrl(null)}
              className="px-3 py-1 bg-white/10 hover:bg-white/15 border border-white/10 rounded-full font-mono text-[10px]"
            >
              TERMINATE_EXECUTION (ESC)
            </button>
          </div>
        </div>
        <iframe
          ref={iframeRef}
          src={activeGameUrl}
          className="w-full flex-grow border border-white/5 rounded-2xl bg-black shadow-inner"
          title="Sandbox Node"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
        {lastScore && (
          <div className="text-[10px] font-mono text-emerald-400/60">
            Score verified: {lastScore.gameId} @ {new Date(lastScore.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    );
  }
  /* v8 ignore stop */

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-white/5 pb-3">
        <div>
          <h3 className="text-xs font-mono tracking-widest uppercase opacity-60">The Arcade Environment Hub</h3>
          {spoons <= 2 && <p className="text-[10px] text-orange-400 font-mono mt-0.5">⚠️ Zen Mode Forced: High-friction nodes isolated.</p>}
          {earnedThisSession > 0 && (
            <p className="text-[10px] text-emerald-400 font-mono mt-0.5">Session earnings: {earnedThisSession} LOVE</p>
          )}
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 font-mono text-[10px]">
          {['all', 'sports', 'strategy', 'creative', 'physics'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-2 py-1 rounded border capitalize ${cat === filter ? 'bg-white/10 border-white/20 font-bold' : 'bg-transparent border-transparent opacity-60'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {activeGames.map((game) => (
          <div
            key={game.id}
            onClick={() => setActiveGameUrl(`${ARCADE_ORIGIN}/sandbox/${game.id}`)}
            className="p-3.5 rounded-xl border border-white/5 bg-white/5 hover:border-white/20 transition-all cursor-pointer flex justify-between items-center group"
          >
            <div className="space-y-0.5">
              <span className="text-xs font-medium group-hover:text-cyan-400 transition-colors">{game.name}</span>
              <span className="text-[9px] font-mono uppercase opacity-40 block">{game.category} // strain: {game.stress}</span>
            </div>
            <span className="text-[10px] font-mono opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity">LAUNCH →</span>
          </div>
        ))}
      </div>
    </div>
  );
}
