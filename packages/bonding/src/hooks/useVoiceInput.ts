// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Voice Recognition Hook: Web Speech API for pre-readers
// Phase 5: Voice Companion
// ═══════════════════════════════════════════════════════

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ElementSymbol } from '../types';

// Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: 'aborted' | 'audio-capture' | 'bad-grammar' | 'language-not-supported' | 'network' | 'no-speech' | 'not-allowed' | 'service-not-allowed';
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface VoiceCommand {
  type: 'select_element' | 'build' | 'bond' | 'help' | 'celebrate' | 'target_molecule';
  payload?: string | ElementSymbol;
}

interface VoiceInputOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onCommand?: (command: VoiceCommand) => void;
  onListeningChange?: (listening: boolean) => void;
  onError?: (error: string) => void;
}

interface VoiceInputState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  lastCommand: VoiceCommand | null;
  error: string | null;
}

interface VoiceInputActions {
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
}

export type VoiceInputReturn = VoiceInputState & VoiceInputActions;

const ELEMENT_COMMANDS: Record<string, ElementSymbol> = {
  hydrogen: 'H',
  h: 'H',
  carbon: 'C',
  c: 'C',
  nitrogen: 'N',
  n: 'N',
  oxygen: 'O',
  o: 'O',
  sodium: 'Na',
  na: 'Na',
  's o d i u m': 'Na',
  phosphorus: 'P',
  p: 'P',
  calcium: 'Ca',
  ca: 'Ca',
  chlorine: 'Cl',
  cl: 'Cl',
  sulfur: 'S',
  s: 'S',
  iron: 'Fe',
  fe: 'Fe',
  manganese: 'Mn',
  mn: 'Mn',
  bashium: 'Ba',
  ba: 'Ba',
  willium: 'Wi',
  wi: 'Wi',
};

const MOLECULE_TARGETS: Record<string, string> = {
  water: 'H2O',
  'h two o': 'H2O',
  'h 2 o': 'H2O',
  methane: 'CH4',
  'c h four': 'CH4',
  'c h 4': 'CH4',
  ammonia: 'NH3',
  'n h three': 'NH3',
  'n h 3': 'NH3',
  'carbon dioxide': 'CO2',
  'c o two': 'CO2',
  'c o 2': 'CO2',
  'carbon monoxide': 'CO',
  oxygen: 'O2',
  'o two': 'O2',
  'o 2': 'O2',
  nitrogen: 'N2',
  'n two': 'N2',
  'n 2': 'N2',
  glucose: 'C6H12O6',
  salt: 'NaCl',
  'table salt': 'NaCl',
  'sodium chloride': 'NaCl',
};

export function useVoiceInput(options: VoiceInputOptions = {}): VoiceInputReturn {
  const {
    continuous = true,
    interimResults = true,
    lang = 'en-US',
    onCommand,
    onListeningChange,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const parseCommand = useCallback((text: string): VoiceCommand | null => {
    const normalized = text.toLowerCase().trim();
    
    // Check element commands
    if (normalized in ELEMENT_COMMANDS) {
      return {
        type: 'select_element',
        payload: ELEMENT_COMMANDS[normalized],
      };
    }

    // Check action commands
    if (normalized === 'build' || normalized === 'place' || normalized === 'add') {
      return { type: 'build' };
    }

    if (normalized === 'bond' || normalized === 'connect' || normalized === 'link') {
      return { type: 'bond' };
    }

    if (normalized === 'help' || normalized === 'help me' || normalized === 'what do i do') {
      return { type: 'help' };
    }

    if (normalized === 'celebrate' || normalized === 'yay' || normalized === 'woohoo' || normalized === 'awesome') {
      return { type: 'celebrate' };
    }

    // Check molecule targets
    for (const [key, formula] of Object.entries(MOLECULE_TARGETS)) {
      if (normalized.includes(key)) {
        return {
          type: 'target_molecule',
          payload: formula,
        };
      }
    }

    return null;
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();

    const recognition = recognitionRef.current;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      onListeningChange?.(true);
    };

    recognition.onend = () => {
      setIsListening(false);
      onListeningChange?.(false);
      // Auto-restart if continuous mode
      if (continuous && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Ignore restart errors
        }
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);

      if (finalTranscript) {
        const command = parseCommand(finalTranscript);
        if (command) {
          setLastCommand(command);
          onCommand?.(command);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMsg = event.error === 'no-speech' ? 'No speech detected' : 
                       event.error === 'not-allowed' ? 'Microphone access denied' :
                       `Speech error: ${event.error}`;
      setError(errorMsg);
      onError?.(errorMsg);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isSupported, continuous, interimResults, lang, parseCommand, onCommand, onListeningChange, onError]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Already started
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    transcript,
    lastCommand,
    error,
    startListening,
    stopListening,
    toggleListening,
  };
}