/**
 * BONDING — P31 Labs
 * VoiceControls: Voice UI for pre-readers (Phase 5)
 * 
 * Features:
 * - Large microphone button (64px for kids)
 * - Pulsing animation when listening
 * - Speaking indicator
 * - Mute/unmute toggle
 * - Visual command feedback
 * 
 * Z-index: Cockpit layer (z10) — part of HUD layer
 */

import { useState, useCallback } from 'react';
import { useVoiceInput, type VoiceCommand } from '../hooks/useVoiceInput';
import { useVoiceFeedback } from '../engine/voiceFeedback';
import type { ElementSymbol } from '../types';

// Cockpit z-index reference:
// z1 = canvas (3D scene)
// z10 = HUD (this component)
// z50 = toasts
// z60 = modals
// z100 = full-screen (boot sequence)

interface VoiceControlsProps {
  /** Callback when element is selected via voice */
  onElementSelect?: (element: ElementSymbol) => void;
  /** Callback when build action is triggered */
  onBuild?: () => void;
  /** Callback when bond action is triggered */
  onBond?: () => void;
  /** Callback when help is requested */
  onHelp?: () => void;
  /** Callback when celebrate action is triggered */
  onCelebrate?: () => void;
  /** Callback when target molecule is set */
  onTargetMolecule?: (formula: string) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Show as compact (for sidebar) or full (for main UI) */
  compact?: boolean;
}

export function VoiceControls({
  onElementSelect,
  onBuild,
  onBond,
  onHelp,
  onCelebrate,
  onTargetMolecule,
  disabled = false,
  compact = false,
}: VoiceControlsProps) {
  const [lastCommandText, setLastCommandText] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);
  
  const {
    isListening,
    isSupported: speechRecognitionSupported,
    transcript,
    toggleListening,
  } = useVoiceInput({
    continuous: true,
    onCommand: handleVoiceCommand,
    onListeningChange: (_listening) => {
      // Could trigger haptic feedback here
    },
  });

  const voiceFeedback = useVoiceFeedback();
  const ttsSupported = voiceFeedback.isSupported();

  // Handle incoming voice commands
  function handleVoiceCommand(command: VoiceCommand) {
    setLastCommandText(transcript);
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 2000);

    switch (command.type) {
      case 'select_element':
        if (command.payload) {
          voiceFeedback.selectElement(command.payload as string);
          onElementSelect?.(command.payload as ElementSymbol);
        }
        break;
      case 'build':
        voiceFeedback.placeAtom();
        onBuild?.();
        break;
      case 'bond':
        voiceFeedback.bondAtoms();
        onBond?.();
        break;
      case 'help':
        voiceFeedback.showHelp();
        onHelp?.();
        break;
      case 'celebrate':
        voiceFeedback.celebrate();
        onCelebrate?.();
        break;
      case 'target_molecule':
        if (command.payload) {
          voiceFeedback.targetMolecule(command.payload as string);
          onTargetMolecule?.(command.payload as string);
        }
        break;
    }
  }

  // Handle mic button click
  const handleMicClick = useCallback(() => {
    if (disabled) return;
    toggleListening();
  }, [disabled, toggleListening]);

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    voiceFeedback.toggleMute();
  }, [voiceFeedback]);

  // If neither speech recognition nor TTS is supported, don't show component
  if (!speechRecognitionSupported && !ttsSupported) {
    return null;
  }

  const size = compact ? 'w-10 h-10' : 'w-16 h-16';
  const iconSize = compact ? 'text-xl' : 'text-3xl';

  return (
    <div 
      className="flex items-center gap-2 pointer-events-auto"
      style={{ zIndex: 10 }}
    >
      {/* Microphone Button */}
      <button
        onClick={handleMicClick}
        disabled={disabled || !speechRecognitionSupported}
        className={`
          relative flex items-center justify-center rounded-full
          transition-all duration-200 ease-out
          ${size}
          ${isListening 
            ? 'bg-red-500/80 animate-pulse shadow-lg shadow-red-500/50' 
            : 'bg-slate-700/80 hover:bg-slate-600/80'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          border-2 ${isListening ? 'border-red-400' : 'border-slate-500'}
        `}
        aria-label={isListening ? 'Stop listening' : 'Start voice input'}
        title={isListening ? 'Listening...' : 'Tap to speak'}
      >
        {/* Mic Icon */}
        <span className={`${iconSize} select-none`}>
          {isListening ? '🎤' : '🫦'}
        </span>
        
        {/* Pulsing ring when listening */}
        {isListening && (
          <span className="absolute inset-0 rounded-full animate-ping bg-red-400/30" />
        )}
      </button>

      {/* Mute Toggle Button */}
      {ttsSupported && (
        <button
          onClick={handleMuteToggle}
          disabled={disabled}
          className={`
            flex items-center justify-center rounded-full
            transition-all duration-200
            ${compact ? 'w-10 h-10' : 'w-12 h-12'}
            ${voiceFeedback.isMuted() 
              ? 'bg-slate-800/80 text-red-400' 
              : 'bg-slate-700/80 text-green-400 hover:bg-slate-600/80'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          aria-label={voiceFeedback.isMuted() ? 'Unmute voice' : 'Mute voice'}
          title={voiceFeedback.isMuted() ? 'Voice muted' : 'Voice enabled'}
        >
          <span className={compact ? 'text-lg' : 'text-xl'}>
            {voiceFeedback.isMuted() ? '🔇' : '🔊'}
          </span>
        </button>
      )}

      {/* Speaking Indicator */}
      {voiceFeedback.isSpeaking() && (
        <div 
          className={`
            flex items-center gap-1 px-3 py-1 rounded-full
            bg-green-500/80 text-white text-sm font-medium
            animate-pulse
            ${compact ? 'text-xs px-2' : ''}
          `}
        >
          <span className="animate-bounce">💬</span>
          <span>Speaking</span>
        </div>
      )}

      {/* Command Feedback Toast */}
      {showFeedback && lastCommandText && (
        <div 
          className={`
            absolute top-full mt-2 left-1/2 -translate-x-1/2
            px-4 py-2 rounded-lg bg-slate-800/90 text-white
            text-sm font-medium whitespace-nowrap
            animate-fade-in border border-slate-600
            ${compact ? 'text-xs px-2 py-1' : ''}
          `}
          style={{ zIndex: 50 }}
        >
          🎤 "{lastCommandText}"
        </div>
      )}
    </div>
  );
}

// Help overlay for voice commands
export function VoiceHelpOverlay({ onClose }: { onClose: () => void }) {
  const voiceFeedback = useVoiceFeedback();

  const commands = [
    { command: '"hydrogen" or "h"', action: 'Select Hydrogen element' },
    { command: '"carbon" or "c"', action: 'Select Carbon element' },
    { command: '"oxygen" or "o"', action: 'Select Oxygen element' },
    { command: '"nitrogen" or "n"', action: 'Select Nitrogen element' },
    { command: '"build"', action: 'Place atom on canvas' },
    { command: '"bond"', action: 'Connect selected atoms' },
    { command: '"help"', action: 'Show this help' },
    { command: '"celebrate"', action: 'Trigger celebration' },
    { command: '"molecule water"', action: 'Set target to H₂O' },
  ];

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/60 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 border-2 border-slate-600"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">🎤 Voice Commands</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        <p className="text-slate-300 mb-4 text-sm">
          Tap the microphone and speak these commands:
        </p>

        <ul className="space-y-2 mb-6">
          {commands.map((item, i) => (
            <li 
              key={i}
              className="flex items-center gap-3 text-slate-200"
            >
              <code className="bg-slate-700 px-2 py-1 rounded text-green-400 font-mono text-sm">
                {item.command}
              </code>
              <span className="text-slate-400 text-sm">→ {item.action}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => {
            voiceFeedback.showHelp();
            onClose();
          }}
          className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold"
        >
          Try it! 🎤
        </button>
      </div>
    </div>
  );
}

// Mini voice controls for compact spaces (like sidebar)
export function MiniVoiceControls(props: Omit<VoiceControlsProps, 'compact'>) {
  return <VoiceControls {...props} compact />;
}