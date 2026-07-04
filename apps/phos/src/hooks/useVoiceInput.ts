import { useState, useCallback, useRef, useEffect } from 'react';

type SpeechRecognitionStatus = 'idle' | 'listening' | 'error' | 'unsupported';

export function useVoiceInput() {
  const [status, setStatus] = useState<SpeechRecognitionStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [isFinal, setIsFinal] = useState(false);
  const recognitionRef = useRef<any>(null);

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) &&
    window.isSecureContext;

  useEffect(() => {
    if (!isSupported) return;
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let current = '';
      let final = false;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final = true;
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
      setIsFinal(final);
    };

    recognition.onerror = () => {
      setStatus('error');
      setTranscript('');
    };

    recognition.onend = () => {
      setStatus('idle');
    };

    recognitionRef.current = recognition;

    return () => {
      try { recognition.stop(); } catch { /* already stopped */ }
    };
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || status === 'listening') return;
    setTranscript('');
    setIsFinal(false);
    setStatus('listening');
    try {
      recognitionRef.current.start();
    } catch {
      setStatus('error');
    }
  }, [status]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setStatus('idle');
    try {
      recognitionRef.current.stop();
    } catch { /* already stopped */ }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setIsFinal(false);
  }, []);

  return {
    status,
    transcript,
    isFinal,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
