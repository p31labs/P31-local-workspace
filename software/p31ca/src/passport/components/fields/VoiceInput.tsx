import React, { useState, useCallback, useRef, useEffect } from 'react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  fieldLabel: string;
  language?: string;
}

export function VoiceInput({ onTranscript, fieldLabel, language = 'en-US' }: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const SpeechRecognitionAPI = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

  const startListening = useCallback(() => {
    setError(null);

    if (!SpeechRecognitionAPI) {
      setError('Speech recognition not available in this browser');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      onTranscript(text);
      setListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(event.error === 'no-speech'
        ? 'No speech detected'
        : `Error: ${event.error}`);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [language, onTranscript, SpeechRecognitionAPI]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  return (
    <button
      type="button"
      onClick={listening ? stopListening : startListening}
      className={[
        'p-2 rounded-lg border transition-all duration-200',
        listening
          ? 'bg-teal-600/30 border-teal-500 text-teal-400 animate-pulse'
          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200',
      ].join(' ')}
      title={listening ? `Listening for ${fieldLabel}...` : `Speak ${fieldLabel}`}
      aria-label={listening ? `Recording ${fieldLabel}` : `Voice input for ${fieldLabel}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
      {error && (
        <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-[10px] text-rose-400 whitespace-nowrap bg-zinc-900 px-2 py-0.5 rounded">
          {error}
        </span>
      )}
    </button>
  );
}
