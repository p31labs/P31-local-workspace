// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Lobby: multiplayer create/join room flow
//
// Shows after "Play Together" is tapped on ModeSelect.
// Two paths: Start Room (host) or Join Room (guest).
// Self-contained local state; transitions to game on
// successful create/join via store actions.
// ═══════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { MODES } from '../data/modes';
import type { DifficultyId } from '../data/modes';
import {
  createRoom,
  joinRoom,
  startPolling,
  stopPolling,
} from '../lib/gameSync';
import { generateQRSvg } from '../engine/qrcode';
import { Starfield } from './Starfield';

type LobbyStep = 'choice' | 'create' | 'join' | 'waiting';

function WaitingDots() {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(id);
  }, []);
  return <span>Waiting for player{dots}</span>;
}

const COLORS = [
  { name: 'green', hex: '#22c55e' },
  { name: 'cyan', hex: '#06b6d4' },
  { name: 'amber', hex: '#f59e0b' },
  { name: 'magenta', hex: '#ec4899' },
  { name: 'violet', hex: '#8b5cf6' },
  { name: 'white', hex: '#ffffff' },
];

export function Lobby() {
  const setLobbyActive = useGameStore((s) => s.setLobbyActive);
  const setMultiplayer = useGameStore((s) => s.setMultiplayer);
  const setGameMode = useGameStore((s) => s.setGameMode);
  const setPlayerName = useGameStore((s) => s.setPlayerName);

  const [step, setStep] = useState<LobbyStep>('choice');
  const [name, setName] = useState('');
  const [color, setColor] = useState('#22c55e');
  const [mode, setMode] = useState<DifficultyId>('seed');
  const [code, setCode] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pollingRef = useRef(false);
  const [copyFeedback, setCopyFeedback] = useState<'copied' | 'failed' | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        stopPolling();
        pollingRef.current = false;
      }
    };
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Enter your name');
      return;
    }
    setError('');
    setLoading(true);
    try {
      setPlayerName(name.trim());
      const result = await createRoom(name.trim(), color, mode);
      setRoomCode(result.code);
      setStep('waiting');

      // Poll for second player
      pollingRef.current = true;
      startPolling((room) => {
        if (room.players.length >= 2) {
          stopPolling();
          pollingRef.current = false;
          setGameMode(mode);
          setMultiplayer(result.code, result.playerId);
        }
      });
    } catch (e) {
      const msg = e instanceof DOMException && e.name === 'AbortError'
        ? 'Connection timed out. Check your network and try again.'
        : 'Could not create room. Try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!name.trim()) {
      setError('Enter your name');
      return;
    }
    if (code.length < 4) {
      setError('Enter the room code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      setPlayerName(name.trim());
      const result = await joinRoom(code.toUpperCase(), name.trim(), color, mode);
      // Detect the host's mode and use it
      const hostPlayer = result.room.players[0];
      const hostMode = (hostPlayer?.mode ?? mode) as DifficultyId;
      setGameMode(hostMode);
      setMultiplayer(code.toUpperCase(), result.playerId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not join room');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'choice') {
      setLobbyActive(false);
    } else {
      if (pollingRef.current) {
        stopPolling();
        pollingRef.current = false;
      }
      setStep('choice');
      setError('');
    }
  };

  return (
    <div
      className="isolate relative w-full h-full flex flex-col items-center justify-center gap-6 select-none"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <Starfield />
      {/* Title */}
      <div className="text-center">
        <h1 className="text-3xl font-black tracking-tighter text-white/90 mb-1">
          {'BONDING'.split('').map((ch, i) => (
            <span
              key={i}
              className="inline-block"
              style={{ animation: `letterReveal 0.3s ease-out ${i * 0.06}s both` }}
            >{ch}</span>
          ))}
        </h1>
        <p className="text-sm text-white/30 font-mono"
          style={{ animation: 'letterReveal 0.4s ease-out 0.5s both' }}
        >
          Play Together
        </p>
      </div>

      {/* Step: Choice */}
      {step === 'choice' && (
        <div className="flex flex-col items-center gap-4">
          {/* Mode picker (compact) */}
          <div className="flex items-center gap-2 mb-2">
            {MODES.map((m, idx) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`mode-card-enter flex items-center gap-1 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                  mode === m.id
                    ? 'glass-card text-white'
                    : 'border border-white/[0.08] text-white/40 hover:bg-white/[0.06]'
                }`}
                style={{ minHeight: 44, animationDelay: `${0.15 + idx * 0.08}s` }}
              >
                <span className="text-lg">{m.emoji}</span>
                <span className="text-xs font-medium">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Start / Join cards */}
          <div className="flex items-stretch gap-4">
            <button
              type="button"
              onClick={() => setStep('create')}
              className="mode-card-enter glass-card flex flex-col items-center justify-center gap-2 p-6 rounded-2xl transition-all active:scale-95 cursor-pointer"
              style={{ minWidth: 140, minHeight: 120, touchAction: 'manipulation', animationDelay: '0.3s' }}
            >
              <span className="text-3xl">+</span>
              <span className="text-base font-bold text-white/80">Start Room</span>
              <span className="text-xs text-white/30">Create a new room</span>
            </button>

            <button
              type="button"
              onClick={() => setStep('join')}
              className="mode-card-enter glass-card flex flex-col items-center justify-center gap-2 p-6 rounded-2xl transition-all active:scale-95 cursor-pointer"
              style={{ minWidth: 140, minHeight: 120, touchAction: 'manipulation', animationDelay: '0.4s' }}
            >
              <span className="text-3xl">&rarr;</span>
              <span className="text-base font-bold text-white/80">Join Room</span>
              <span className="text-xs text-white/30">Enter a room code</span>
            </button>
          </div>
        </div>
      )}

      {/* Step: Create */}
      {step === 'create' && (
        <div className="flex flex-col items-center gap-4 w-72">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            className={`w-full px-4 py-3 glass-card rounded-xl text-white text-center font-medium placeholder:text-white/20 focus:outline-none focus:border-white/30 ${
              error ? 'border-red-400/50' : 'border-white/10'
            }`}
            style={{ minHeight: 48 }}
          />

          {/* Color picker */}
          <div className="flex items-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setColor(c.hex)}
                className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                  color === c.hex ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className={`w-full px-6 py-3 rounded-xl transition-all cursor-pointer font-medium disabled:opacity-40 ${
              name.trim()
                ? 'bg-green hover:bg-green/90 text-void'
                : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
            }`}
            style={{ minHeight: 48 }}
          >
            {loading ? <><span className="helix-spinner" /> Creating...</> : 'Create Room'}
          </button>
          {error && <p className="text-sm text-red-400/80 font-medium">{error}</p>}
        </div>
      )}

      {/* Step: Waiting for player */}
      {step === 'waiting' && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-xs text-white/30 font-mono">Room Code</p>
          <div className="flex items-center gap-6">
            <p
              className="text-5xl font-black font-mono tracking-widest text-white select-all"
              style={{ letterSpacing: '0.15em' }}
            >
              {roomCode.slice(0, 3)}-{roomCode.slice(3)}
            </p>
            <div
              className="opacity-80"
              dangerouslySetInnerHTML={{
                __html: generateQRSvg(roomCode, {
                  size: 120,
                  fgColor: '#FFFFFF',
                  bgColor: 'transparent',
                }),
              }}
            />
          </div>
          {/* WCD-CC03: Copy button */}
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(roomCode).then(
                () => {
                  setCopyFeedback('copied');
                  setTimeout(() => setCopyFeedback(null), 2000);
                },
                () => {
                  setCopyFeedback('failed');
                  setTimeout(() => setCopyFeedback(null), 3000);
                },
              );
            }}
            className="text-xs text-white/40 hover:text-white/60 border border-white/[0.12] rounded-lg px-4 py-1.5 transition-colors cursor-pointer"
            style={{ minHeight: 36 }}
          >
            {copyFeedback === 'copied' ? 'Copied!' : copyFeedback === 'failed' ? 'Copy failed — tap code to select' : 'Copy Code'}
          </button>
          <p className="text-sm text-white/30">
            Share this code with your player
          </p>
          <div className="flex items-center gap-2 text-white/20 text-sm">
            <span className="inline-block w-2 h-2 rounded-full bg-green/40 animate-pulse" />
            <WaitingDots />
          </div>
        </div>
      )}

      {/* Step: Join */}
      {step === 'join' && (
        <div className="flex flex-col items-center gap-4 w-72">
          <input
            type="text"
            placeholder="ROOM CODE"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
            maxLength={6}
            className={`w-full px-4 py-3 glass-card rounded-xl text-white text-center font-mono text-2xl tracking-widest uppercase placeholder:text-white/15 focus:outline-none focus:border-white/30 scan-underline ${
              error ? 'border-red-400/50' : 'border-white/10'
            }`}
            style={{ minHeight: 48 }}
          />

          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            className={`w-full px-4 py-3 glass-card rounded-xl text-white text-center font-medium placeholder:text-white/20 focus:outline-none focus:border-white/30 ${
              error ? 'border-red-400/50' : 'border-white/10'
            }`}
            style={{ minHeight: 48 }}
          />

          {/* Color picker */}
          <div className="flex items-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setColor(c.hex)}
                className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                  color === c.hex ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleJoin}
            disabled={loading}
            className={`w-full px-6 py-3 rounded-xl transition-all cursor-pointer font-medium disabled:opacity-40 ${
              code.length === 6 && name.trim()
                ? 'bg-green hover:bg-green/90 text-void'
                : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
            }`}
            style={{ minHeight: 48 }}
          >
            {loading ? <><span className="helix-spinner" /> Joining...</> : 'Join Room'}
          </button>
          {error && <p className="text-sm text-red-400/80 font-medium">{error}</p>}
        </div>
      )}

      {/* Back button */}
      <button
        type="button"
        onClick={handleBack}
        className="text-xs text-white/30 hover:text-white/50 transition-colors cursor-pointer"
        style={{ minHeight: 48, touchAction: 'manipulation' }}
      >
        &larr; Back
      </button>
    </div>
  );
}
