import { useState, useEffect, useCallback } from 'react';
import { whisper, type WhisperStatus, type WhisperTier, type WhisperSegment } from '../lib/whisper';

export function useWhisper() {
  const [status, setStatus] = useState<WhisperStatus>('idle');
  const [tier, setTier] = useState<WhisperTier>('local');
  const [transcript, setTranscript] = useState('');
  const [segments, setSegments] = useState<WhisperSegment[]>([]);
  const [error, setError] = useState<string | undefined>();
  const isListening = status === 'listening' || status === 'transcribing';

  useEffect(() => {
    const unsub = whisper.subscribe((state) => {
      setStatus(state.status);
      setTier(state.tier);
      setTranscript(state.transcript);
      setSegments(state.segments);
      setError(state.error);
    });
    return unsub;
  }, []);

  const startListening = useCallback(async () => {
    if (isListening) return;
    await whisper.startRecording();
  }, [isListening]);

  const stopListening = useCallback(() => {
    whisper.stopRecording();
  }, []);

  const resetTranscript = useCallback(() => {
    whisper.resetTranscript();
  }, []);

  const isSupported = status !== 'unsupported';

  return {
    status,
    tier,
    transcript,
    segments,
    error,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
