import { useState, useEffect, useCallback, useMemo } from 'react';
import { VoiceTriggerMatcher } from '../phos-v2/phase2-bros/VoiceTriggerMatcher';

export interface BrosPersonaConfig {
  id: string;
  name: string;
  mode: string;
  color?: string;
  icon?: string;
  description?: string;
  features: string[];
  voiceTrigger: string[];
  uiDensity: 'low' | 'medium' | 'high';
  relationshipType?: string;
  customLabel?: string;
}

export interface UseBrosPersonaOptions {
  onPersonaChanged?: (personaId: string) => void;
  onError?: (error: string) => void;
  matcherOptions?: {
    fuzzyThreshold?: number;
    phoneticWeight?: number;
    recencyWeight?: number;
  };
}

export interface UseBrosPersonaResult {
  currentPersona: BrosPersonaConfig | null;
  personas: BrosPersonaConfig[];
  switchPersona: (personaId: string) => void;
  matchVoiceTrigger: (text: string) => string | null;
  disambiguate: (text: string) => Array<{ personaId: string; confidence: number; matchedTrigger: string }>;
  isLoading: boolean;
  error: string | null;
  switchCount: number;
  switchHistory: Array<{ from: string; to: string; timestamp: number }>;
}

export function useBrosPersona(options: UseBrosPersonaOptions = {}): UseBrosPersonaResult {
  const { onPersonaChanged, onError, matcherOptions } = options;

  const [currentPersonaId, setCurrentPersonaId] = useState<string | null>(null);
  const [personas, setPersonas] = useState<BrosPersonaConfig[]>([]);
  const [switchCount, setSwitchCount] = useState(0);
  const [switchHistory, setSwitchHistory] = useState<Array<{ from: string; to: string; timestamp: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const triggerMatcher = useMemo(() => {
    return new VoiceTriggerMatcher({
      fuzzyThreshold: matcherOptions?.fuzzyThreshold,
      phoneticWeight: matcherOptions?.phoneticWeight,
      recencyWeight: matcherOptions?.recencyWeight
    });
  }, [matcherOptions?.fuzzyThreshold, matcherOptions?.phoneticWeight, matcherOptions?.recencyWeight]);

  const currentPersona = useMemo(
    () => personas.find(p => p.id === currentPersonaId) ?? null,
    [personas, currentPersonaId]
  );

  const switchPersona = useCallback((personaId: string) => {
    setCurrentPersonaId(prev => {
      if (prev === personaId) return prev;
      const next = personaId;
      setSwitchCount(c => c + 1);
      setSwitchHistory(h => [...h.slice(-99), { from: prev ?? '', to: next, timestamp: Date.now() }]);
      triggerMatcher.recordMatch(next);
      onPersonaChanged?.(next);
      return next;
    });
  }, [onPersonaChanged, triggerMatcher]);

  const matchVoiceTrigger = useCallback((text: string): string | null => {
    const triggers = personas.flatMap(p =>
      p.voiceTrigger.map(trigger => ({ personaId: p.id, trigger }))
    );
    const best = triggerMatcher.bestMatch(text, triggers);
    if (best) {
      triggerMatcher.recordMatch(best.personaId);
    }
    return best?.personaId ?? null;
  }, [personas, triggerMatcher]);

  const disambiguate = useCallback((text: string) => {
    const triggers = personas.flatMap(p =>
      p.voiceTrigger.map(trigger => ({ personaId: p.id, trigger }))
    );
    return triggerMatcher.match(text, triggers).map(m => ({
      personaId: m.personaId,
      confidence: m.confidence,
      matchedTrigger: m.matchedTrigger
    }));
  }, [personas, triggerMatcher]);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        setIsLoading(true);
        setError(null);

        const { BrosPhase } = await import('./phos-v2/phase2-bros/BrosPhase');
        const { getPHOSConfig } = await import('./phos-v2/master/PHOSConfig');
        const { getPHOSMaster } = await import('./phos-v2/master/PHOSMasterRuntime');

        const config = getPHOSConfig();
        const master = getPHOSMaster(config);
        const phase = new BrosPhase();
        await phase.initialize(config);
        phase.setEmitDelegate((event) => master.emit?.(event));
        phase.setOnDelegate((event, handler) => master.on?.(event, handler));
        phase.activate();

        if (cancelled) return;

        const personaList = phase.getAllPersonas().map(({ config }) => config);
        const initial = phase.getCurrentPersona();

        setPersonas(personaList);
        setCurrentPersonaId(initial);

        const interval = setInterval(() => {
          setPersonas(phase.getAllPersonas().map(({ config }) => config));
          setCurrentPersonaId(phase.getCurrentPersona());
        }, 1000);

        return () => clearInterval(interval);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to initialize Bros persona system';
          setError(message);
          onError?.(message);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    const cleanup = initialize();

    return () => {
      cancelled = true;
      cleanup.then(fn => fn?.());
    };
  }, [onError]);

  return {
    currentPersona,
    personas,
    switchPersona,
    matchVoiceTrigger,
    disambiguate,
    isLoading,
    error,
    switchCount,
    switchHistory
  };
}
