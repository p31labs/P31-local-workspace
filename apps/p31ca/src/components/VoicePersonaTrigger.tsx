import { useState, useEffect, useCallback, useRef } from 'react';

type SpeechRecognition = typeof window extends { SpeechRecognition: infer R } ? R
  : typeof window extends { webkitSpeechRecognition: infer R } ? R
  : never;

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface VoicePersonaTriggerProps {
  onPersonaMatch?: (personaId: string) => void;
  onError?: (error: string) => void;
  triggers?: Array<{ personaId: string; trigger: string }>;
  placeholderText?: string;
  disabled?: boolean;
  continuous?: boolean;
  className?: string;
}

export function VoicePersonaTrigger({
  onPersonaMatch,
  onError,
  triggers = [],
  placeholderText = 'Listening for persona command...',
  disabled = false,
  continuous = false,
  className = ''
}: VoicePersonaTriggerProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      onError?.('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let final = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      setTranscript(prev => prev + final);
      setInterimTranscript(interim);

      if (final && triggers.length > 0) {
        const normalized = final.toLowerCase().trim();
        for (const { personaId, trigger } of triggers) {
          if (normalized.includes(trigger.toLowerCase())) {
            onPersonaMatch?.(personaId);
            if (!continuous) {
              stopListening();
            }
            break;
          }
        }
      }
    };

    recognition.onerror = (event) => {
      onError?.(event.error || 'Speech recognition error');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [triggers, continuous, onPersonaMatch, onError]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || disabled) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript('');
      setInterimTranscript('');
    } catch {
      onError?.('Failed to start speech recognition');
    }
  }, [disabled, onError]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  if (!isSupported) {
    return (
      <div className={`voice-persona-trigger unsupported ${className}`}>
        <span className="error-icon">⚠️</span>
        <span className="error-text">Voice not supported</span>
      </div>
    );
  }

  return (
    <div className={`voice-persona-trigger ${isListening ? 'listening' : ''} ${className}`}>
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        aria-label={isListening ? 'Stop listening' : 'Start voice persona trigger'}
        aria-pressed={isListening}
        className="voice-trigger-button"
      >
        <span className="mic-icon" aria-hidden="true">
          {isListening ? '🔴' : '🎤'}
        </span>
        <span className="listening-status">
          {isListening ? 'Listening...' : 'Tap to speak'}
        </span>
      </button>

      {(transcript || interimTranscript) && (
        <div className="transcript-display">
          {transcript && <span className="final-transcript">{transcript}</span>}
          {interimTranscript && (
            <span className="interim-transcript">{interimTranscript}</span>
          )}
        </div>
      )}

      {!isListening && !transcript && (
        <div className="placeholder-text">{placeholderText}</div>
      )}
    </div>
  );
}
