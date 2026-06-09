// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// RoomSidebar: remote player cards + ping/message system
//
// WCD-08: Base sidebar with emoji pings
// WCD-15: Text messages, connection indicator, ping log,
//         breathing indicator
// ═══════════════════════════════════════════════════════

import { useState, useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { sendPing } from '../lib/gameSync';
import { displayFormula } from '../engine/chemistry';
import { logEventA } from '../engine/exhibitA';

const REACTIONS = ['\u{1F49A}', '\u{1F914}', '\u{1F602}', '\u{1F53A}']; // 💚 🤔 😂 🔺
const MAX_PINGS_PER_PLAYER = 3;

interface PingLogEntry {
  id: string;
  fromName: string;
  reaction: string;
  message?: string;
  timestamp: number;
}

export function RoomSidebar() {
  const remotePlayers = useGameStore((s) => s.remotePlayers);
  const roomCode = useGameStore((s) => s.roomCode);
  const connectionStatus = useGameStore((s) => s.connectionStatus);
  const incomingPings = useGameStore((s) => s.incomingPings);
  const playerName = useGameStore((s) => s.playerName);

  const [expanded, setExpanded] = useState(() => window.innerWidth >= 640);
  const [sendingPing, setSendingPing] = useState<string | null>(null);
  const [messageTexts, setMessageTexts] = useState<Record<string, string>>({});
  const [lastEmoji, setLastEmoji] = useState('\u{1F49A}');
  const pingCountsRef = useRef<Map<string, number>>(new Map());
  const sentPingsRef = useRef<PingLogEntry[]>([]);

  const handlePing = useCallback(async (targetId: string, reaction: string, message?: string) => {
    const current = pingCountsRef.current.get(targetId) ?? 0;
    if (current >= MAX_PINGS_PER_PLAYER) return;

    pingCountsRef.current.set(targetId, current + 1);
    setSendingPing(`${targetId}-${reaction}`);
    setLastEmoji(reaction);
    await sendPing(targetId, reaction, message);

    // Track in local ping log
    const target = useGameStore.getState().remotePlayers.find(p => p.id === targetId);
    const targetName = target?.name ?? targetId;
    sentPingsRef.current = [...sentPingsRef.current, {
      id: Math.random().toString(36).slice(2, 10),
      fromName: playerName || 'You',
      reaction,
      message,
      timestamp: Date.now(),
    }].slice(-10);

    // Exhibit A
    if (message) {
      logEventA({
        type: 'message_sent',
        from: playerName || 'Player',
        to: targetName,
        message,
        reaction,
      });
    } else {
      logEventA({
        type: 'ping_sent',
        from: playerName || 'Player',
        to: targetName,
        reaction,
      });
    }

    setTimeout(() => setSendingPing(null), 300);
  }, [playerName]);

  const handleSendMessage = useCallback((targetId: string) => {
    const text = messageTexts[targetId]?.trim();
    if (!text) return;
    void handlePing(targetId, lastEmoji, text);
    setMessageTexts(prev => ({ ...prev, [targetId]: '' }));
  }, [handlePing, lastEmoji, messageTexts]);

  if (!roomCode || remotePlayers.length === 0) return null;

  // Connection status dot
  const statusColor = connectionStatus === 'connected'
    ? 'bg-emerald-400'
    : connectionStatus === 'reconnecting'
      ? 'bg-amber-400 animate-pulse'
      : 'bg-red-400';

  // Build ping log from incoming + sent
  const pingLog: PingLogEntry[] = [];
  for (const ping of incomingPings) {
    const sender = remotePlayers.find(p => p.id === ping.from);
    pingLog.push({
      id: ping.id,
      fromName: sender?.name ?? 'Someone',
      reaction: ping.reaction,
      message: ping.message,
      timestamp: new Date(ping.timestamp).getTime(),
    });
  }
  pingLog.push(...sentPingsRef.current);
  pingLog.sort((a, b) => a.timestamp - b.timestamp);
  const recentLog = pingLog.slice(-10);

  // Collapsed pill for narrow screens
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="absolute top-20 right-6 glass-card px-3 py-2 rounded-full text-xs text-white/40 cursor-pointer hover:text-white/60 transition-colors flex items-center gap-2"
        style={{ minHeight: 40, touchAction: 'manipulation' }}
      >
        <span className={`w-2 h-2 rounded-full ${statusColor}`} />
        {remotePlayers.length} player{remotePlayers.length !== 1 ? 's' : ''}
      </button>
    );
  }

  return (
    <div className="absolute top-20 right-6 flex flex-col gap-2 z-10 max-w-[220px] pointer-events-auto">
      {/* Header: connection + collapse */}
      <div className="flex items-center justify-between">
        <span className={`w-2 h-2 rounded-full ${statusColor}`} />
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-[10px] text-white/15 hover:text-white/30 transition-colors cursor-pointer"
          style={{ minHeight: 24 }}
        >
          collapse
        </button>
      </div>

      {remotePlayers.map((player) => {
        const pingCount = pingCountsRef.current.get(player.id) ?? 0;
        const pingsExhausted = pingCount >= MAX_PINGS_PER_PLAYER;
        const formula = player.state.displayFormula || player.state.formula;
        const isBreathing = player.state.breathing;

        return (
          <div
            key={player.id}
            className="glass-card p-3 rounded-xl min-w-[180px]"
          >
            {/* Player info row */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`w-3 h-3 rounded-full flex-shrink-0 ${isBreathing ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: player.color }}
              />
              <span className="text-sm font-semibold text-white/80 truncate">
                {player.name}
              </span>
              {isBreathing && (
                <span className="text-[10px] text-white/20">{'\u{1FAC1}'}</span>
              )}
            </div>

            {/* Status row */}
            <div className="flex items-center gap-2 text-xs text-white/40 mb-2">
              {formula ? (
                <span className="font-mono text-white/60">
                  {displayFormula(formula)}
                </span>
              ) : (
                <span className="text-white/20">building...</span>
              )}
              <span className="text-amber-400/60">
                {'\u2665'} {player.state.love}
              </span>
              {player.state.completed && (
                <span className="text-emerald-400/60">{'\u2713'} Done</span>
              )}
              {!player.state.completed && player.state.atoms > 0 && (
                <span>{player.state.atoms} atoms</span>
              )}
            </div>

            {/* Ping emoji buttons */}
            <div className="flex items-center gap-1 mb-1">
              {REACTIONS.map((reaction) => {
                const isActive = sendingPing === `${player.id}-${reaction}`;
                return (
                  <button
                    key={reaction}
                    type="button"
                    onClick={() => {
                      setLastEmoji(reaction);
                      void handlePing(player.id, reaction);
                    }}
                    disabled={pingsExhausted}
                    className={`px-2 py-1 rounded-lg text-sm transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white/20 scale-110'
                        : pingsExhausted
                          ? 'opacity-20 cursor-not-allowed'
                          : 'bg-white/5 hover:bg-white/10 active:scale-95'
                    }`}
                    style={{ minWidth: 48, minHeight: 48, touchAction: 'manipulation' }}
                  >
                    {reaction}
                  </button>
                );
              })}
            </div>

            {/* Message input */}
            {!pingsExhausted && (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Say something..."
                  value={messageTexts[player.id] ?? ''}
                  onChange={(e) => setMessageTexts(prev => ({
                    ...prev,
                    [player.id]: e.target.value.slice(0, 140),
                  }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage(player.id);
                  }}
                  className="flex-1 min-w-0 px-2 py-1.5 bg-white/5 border border-white/8 rounded-lg text-xs text-white placeholder:text-white/15 focus:outline-none focus:border-white/20"
                  style={{ minHeight: 32 }}
                  maxLength={140}
                />
                <button
                  type="button"
                  onClick={() => handleSendMessage(player.id)}
                  className="px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/40 hover:text-white/60 transition-all cursor-pointer"
                  style={{ minHeight: 32, touchAction: 'manipulation' }}
                >
                  {'\u{1F4E4}'}
                </button>
              </div>
            )}

            {pingsExhausted && (
              <p className="text-[10px] text-white/15 mt-1">No more pings</p>
            )}
          </div>
        );
      })}

      {/* Ping log */}
      {recentLog.length > 0 && (
        <div className="bg-white/[0.04] backdrop-blur-[20px] rounded-xl border border-white/[0.08] px-3 py-2 max-h-32 overflow-y-auto">
          <p className="text-[10px] text-white/20 mb-1">Recent</p>
          {recentLog.map((entry) => (
            <p key={entry.id} className="text-[11px] text-white/40 leading-snug truncate">
              {entry.fromName}: {entry.message ? `${entry.message} ` : ''}{entry.reaction}
            </p>
          ))}
        </div>
      )}

      {/* Room code footer */}
      <p className="text-[10px] text-white/10 font-mono text-right">
        Room {roomCode}
      </p>
    </div>
  );
}
