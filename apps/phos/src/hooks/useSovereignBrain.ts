import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { brain, type BrainState, type BrainStatus, type RoutingOverride } from '../lib/llm';
import { endpoints } from '../config/endpoints';

const BRAIN_STORAGE_KEY = 'phos:brain:local_enabled';

function getStoredPreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(BRAIN_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function storePreference(enabled: boolean) {
  try {
    if (enabled) {
      localStorage.setItem(BRAIN_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(BRAIN_STORAGE_KEY);
    }
  } catch { /* storage unavailable */ }
}

export function useSovereignBrain() {
  const [brainState, setBrainState] = useState<BrainState>(brain.state);

  useEffect(() => {
    const unsub = brain.subscribe(setBrainState);
    return unsub;
  }, []);

  useEffect(() => {
    brain.init().then(() => {
      const enabled = getStoredPreference();
      if (enabled && brain.state.status === 'off') {
        brain.enableLocal();
      }
    });
  }, []);

  const toggleLocalBrain = useCallback(async () => {
    if (brain.state.status === 'downloading') return;

    if (brain.state.status === 'ready' && brain.state.tier === 'local') {
      await brain.disableLocal();
      storePreference(false);
    } else if (brain.state.status === 'unsupported') {
      return;
    } else {
      storePreference(true);
      await brain.enableLocal();
    }
  }, []);

  // CVE-2026-29779: Auth token is injected by the proxy worker, not the client.
  const generateResponse = useCallback(async (
    prompt: string,
    contextLength = 0,
    opts: { override?: RoutingOverride; model?: string; spoonLevel?: number } = {},
  ): Promise<string> => {
    try {
      return await brain.generateResponse(prompt, contextLength, {
        edgeEndpoint: `${endpoints.aiProxy}/ai/chat`,
        override: opts.override,
        model: opts.model,
        spoonLevel: opts.spoonLevel,
      });
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    status: brainState.status,
    progress: brainState.progress,
    tier: brainState.tier,
    currentRoute: brainState.currentRoute,
    error: brainState.error,
    isLocalSupported: brainState.status !== 'unsupported',
    isLocalReady: brainState.status === 'ready' && brainState.tier === 'local',
    toggleLocalBrain,
    generateResponse,
    canUseEdge: true,
  };
}
