/**
 * @file hooks/useOverworkPrompt.ts
 *
 * Pattern 6 of the ethical friction framework: a soft, non-coercive reminder
 * after a sustained focus session. It never blocks and never nags — it resets
 * on rest (spoons <= 1) and on dismissal, and renders nothing during crisis.
 */

import { useEffect, useRef, useState } from 'react';
import { domeConfig } from '../config/domeConfig';

const CHECK_INTERVAL_MS = 30_000;

export interface OverworkPromptState {
  showPrompt: boolean;
  elapsedMinutes: number;
  onDismiss: () => void;
}

export function useOverworkPrompt(spoons: number): OverworkPromptState {
  const thresholdMinutes = domeConfig.data.focusReminderMinutes ?? 45;
  const sessionStartRef = useRef(Date.now());
  const [showPrompt, setShowPrompt] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    if (spoons <= 1) {
      sessionStartRef.current = Date.now();
      setShowPrompt(false);
      return;
    }
    if (thresholdMinutes <= 0) return;

    const check = () => {
      const minutes = (Date.now() - sessionStartRef.current) / 60_000;
      setElapsedMinutes(Math.floor(minutes));
      if (minutes >= thresholdMinutes) setShowPrompt(true);
    };

    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [spoons, thresholdMinutes]);

  const onDismiss = () => {
    sessionStartRef.current = Date.now();
    setShowPrompt(false);
  };

  return { showPrompt, elapsedMinutes, onDismiss };
}
