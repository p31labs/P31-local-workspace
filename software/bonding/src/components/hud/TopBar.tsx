/**
 * WCD-08 → WCD-25 → WCD-29 → WCD-31: TopBar — Transparent HUD.
 *
 * Left:   Mode emoji + 🤝 multiplayer + mute toggle
 * Center: "BONDING" title
 * Right:  LoveCounter
 *
 * WCD-29: Glassmorphism removed. Text-shadow for legibility.
 * WCD-31: 🤝 multiplayer button restored between mode and mute.
 *         Shows 👥{n} when in an active room.
 * 
 * Phase 5: Voice controls added for pre-readers (mic button + voice toggle)
 */

import { useState } from 'react';
import { useEconomyStore } from '../../genesis/economyStore';
import { isMuted, setMuted } from '../../engine/sound';
import { VoiceControls } from '../VoiceControls';
import { useGameStore } from '../../store/gameStore';
import { useVoiceFeedback } from '../../engine/voiceFeedback';
import type { ElementSymbol } from '../../types';

// ─── Inline LoveCounter (stripped of absolute positioning) ──────

function LoveCounter() {
  const totalLove = useEconomyStore(s => s.totalLove);
  const currentStreak = useEconomyStore(s => s.currentStreak);
  const hasHydrated = useEconomyStore(s => s._hasHydrated);

  if (!hasHydrated) return <div className="w-20" />;

  return (
    <div className="flex items-center gap-2 font-mono text-lg font-bold text-[#FFD700]">
      <span className="text-xl">💛</span>
      <span>{totalLove % 1 === 0 ? totalLove.toFixed(0) : totalLove.toFixed(1)}</span>
      {currentStreak > 1 && (
        <span className="text-xs opacity-50">🔥{currentStreak}d</span>
      )}
    </div>
  );
}

// ─── TopBar ─────────────────────────────────────────────────────

interface TopBarProps {
  modeEmoji?: string;
  onModeExit?: () => void;
  /** WCD-31: Open multiplayer lobby */
  onLobby?: () => void;
  /** WCD-31: True when in an active multiplayer room */
  isInRoom?: boolean;
  /** WCD-31: Number of players in the room (including self) */
  playerCount?: number;
  title?: string;
}

export function TopBar({ modeEmoji, onModeExit, onLobby, isInRoom, playerCount, title = 'BONDING' }: TopBarProps) {
  const [audioMuted, setAudioMuted] = useState(isMuted());
  const startDrag = useGameStore((s) => s.startDrag);
  const endDrag = useGameStore((s) => s.endDrag);
  const voiceFeedback = useVoiceFeedback();
  const calciumLogged = useGameStore(s => s.calciumLogged);
  const toggleCalciumLogged = useGameStore(s => s.toggleCalciumLogged);

  // Handle voice element selection
  const handleElementSelect = (element: ElementSymbol) => {
    startDrag(element);
    voiceFeedback.selectElement(element);
  };

  // Handle voice build action
  const handleBuild = () => {
    endDrag();
    voiceFeedback.placeAtom();
  };

  // Handle voice help
  const handleHelp = () => {
    voiceFeedback.showHelp();
  };

  // Handle voice celebrate
  const handleCelebrate = () => {
    voiceFeedback.celebrate();
  };

  return (
    <div className="h-full flex items-center justify-between px-4 gap-3 hud-text pointer-events-auto">
      {/* Left: Mode indicator + multiplayer + mute */}
      <div className="flex items-center gap-1.5">
        {modeEmoji && (
          <button
            onClick={onModeExit}
            className="w-10 h-10 flex items-center justify-center
                       rounded-2xl backdrop-blur-md
                       border border-white/[0.12]
                       hover:border-white/[0.25] hover:shadow-[0_0_12px_rgba(78,205,196,0.15)]
                       active:scale-95
                       transition-all duration-200 text-lg"
            style={{ background: 'rgba(6,10,16,0.5)', boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)' }}
            aria-label="Change mode"
            title="Tap to change mode"
          >
            {modeEmoji}
          </button>
        )}
        {/* WCD-31: Multiplayer — 🤝 solo, 👥{n} in room */}
        {onLobby && (
          <button
            onClick={onLobby}
            className="w-10 h-10 flex items-center justify-center
                       rounded-2xl backdrop-blur-md
                       border border-white/[0.12]
                       hover:border-white/[0.25] hover:shadow-[0_0_12px_rgba(78,205,196,0.15)]
                       active:scale-95
                       transition-all duration-200 text-base"
            style={{ background: 'rgba(6,10,16,0.5)', boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)' }}
            aria-label={isInRoom ? 'Room status' : 'Play together'}
            title={isInRoom ? `${playerCount} players` : 'Play Together'}
          >
            {isInRoom ? `\u{1F465}${playerCount ?? ''}` : '\u{1F91D}'}
          </button>
        )}
        {/* Mute toggle */}
        <button
          onClick={() => {
            const next = !audioMuted;
            setAudioMuted(next);
            setMuted(next);
          }}
          className="w-10 h-10 flex items-center justify-center
                     rounded-2xl backdrop-blur-md
                     border border-white/[0.12]
                     hover:border-white/[0.25] hover:shadow-[0_0_12px_rgba(78,205,196,0.15)]
                     active:scale-95
                     transition-all duration-200 text-base"
          style={{ background: 'rgba(6,10,16,0.5)', boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)' }}
          aria-label={audioMuted ? 'Unmute sound' : 'Mute sound'}
        >
          {audioMuted ? '\u{1F507}' : '\u{1F50A}'}
        </button>
        {/* Calcium logging */}
        <button
          onClick={toggleCalciumLogged}
          className="w-10 h-10 flex items-center justify-center
                     rounded-2xl backdrop-blur-md
                     border border-white/[0.12]
                     hover:border-white/[0.25] hover:shadow-[0_0_12px_rgba(78,205,196,0.15)]
                     active:scale-95
                     transition-all duration-200 text-base"
          style={{
            background: calciumLogged ? 'rgba(45, 255, 160, 0.2)' : 'rgba(6,10,16,0.5)',
            boxShadow: calciumLogged ? '0 2px 8px rgba(45,255,160,0.3), inset 0 1px 0 rgba(255,255,255,0.05)' : '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
          }}
          aria-label={calciumLogged ? 'Calcium logged today' : 'Log calcium intake'}
        >
          🦴
        </button>
        {/* Phase 5: Voice Controls for pre-readers */}
        <VoiceControls
          onElementSelect={handleElementSelect}
          onBuild={handleBuild}
          onHelp={handleHelp}
          onCelebrate={handleCelebrate}
          compact
        />
      </div>

      <span className="font-mono text-xs font-medium text-white/30 tracking-[0.15em] uppercase select-none">
        {title}
      </span>

      <LoveCounter />
    </div>
  );
}
