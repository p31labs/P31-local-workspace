import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWhisper } from '../hooks/useWhisper';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceInputButton({ onTranscript, disabled = false, className = '' }: VoiceInputButtonProps) {
  const {
    status,
    tier,
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useWhisper();

  const [showPreview, setShowPreview] = useState(false);
  const previewTimeoutRef = useRef<any>(null);

  const isLocal = tier === 'local';

  const handleClick = useCallback(() => {
    if (disabled) return;
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
      setShowPreview(true);
    }
  }, [disabled, isListening, startListening, stopListening, resetTranscript]);

  useEffect(() => {
    if (status === 'idle' && transcript && !isListening) {
      onTranscript(transcript);
      resetTranscript();
      setShowPreview(false);
    }
  }, [status, transcript, isListening, onTranscript, resetTranscript]);

  useEffect(() => {
    if (isListening && transcript) {
      setShowPreview(true);
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = setTimeout(() => {
        setShowPreview(false);
      }, 3000);
    }
  }, [isListening, transcript]);

  useEffect(() => {
    return () => clearTimeout(previewTimeoutRef.current);
  }, []);

  if (!isSupported) {
    return (
      <button
        disabled
        className={`flex items-center justify-center w-11 h-11 rounded-full opacity-30 cursor-not-allowed ${className}`}
        aria-label="Voice input unavailable"
        title="Voice input unavailable on this device"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="8" y1="2" x2="16" y2="2" />
        </svg>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={disabled}
        aria-label={isListening ? 'Stop recording' : `Start voice input (${isLocal ? 'Local WASM' : 'Edge fallback'})`}
        className={`flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 cursor-pointer ${
          isListening
            ? 'bg-red-500/20 text-red-400 animate-pulse shadow-lg shadow-red-500/20'
            : 'phos-glass text-[var(--phos-text)]/60 hover:text-[var(--phos-primary)] hover:bg-white/5'
        } ${disabled ? 'opacity-30 cursor-not-allowed' : ''} ${className}`}
        title={isListening ? 'Stop recording' : `Voice input (${isLocal ? 'Local WASM' : 'Edge fallback'})`}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      </button>

      {showPreview && transcript && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 rounded-lg phos-glass text-xs whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis">
          <span className="opacity-60 mr-1">
            {isLocal ? '🧠' : '⚡'}
          </span>
          {transcript}
          {isListening && <span className="inline-block w-1.5 h-1.5 ml-1 rounded-full bg-red-400 animate-pulse" />}
        </div>
      )}

      <div
        className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full transition-colors ${
          isListening ? 'bg-red-500 animate-pulse' : status === 'loading' ? 'bg-yellow-500' : status === 'transcribing' ? 'bg-blue-400 animate-pulse' : 'bg-transparent'
        }`}
      />
    </div>
  );
}
