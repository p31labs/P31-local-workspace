/**
 * The music maker — useInstrumentSound.
 *
 * Extends the Loom's opt-in sound discipline (useLoomSound.ts) to a live
 * instrument. Same three rules, different playback shape:
 *
 *   1. Sound is OFF by default, EVERY session, every device. The build prompt's
 *      rule is literal: "silent until opted in, every session, every device" —
 *      there is NO localStorage persistence here. A fresh session always starts
 *      silent; a tap on the toggle in THIS session is the only thing that turns
 *      it on. (Persisting the preference would make the toggle lie: it would
 *      show "on" while the engine is still silent until a gesture.)
 *   2. Every triggered sound has a visual echo — callers must render the
 *      zone glow regardless of whether sound fired.
 *   3. A shared session where one family member enabled sound does NOT turn
 *      sound on for another family member's device (each device has its own
 *      toggle and its own AudioContext).
 *
 * This hook owns NO AudioContext. The SpatialInstrumentEngine is the single
 * context owner and creates it inside enable() — the user gesture. The hook
 * only tracks the session's opt-in flag; the App's toggle handler calls
 * engine.enable() in the same tap.
 */
import { useCallback, useState } from 'react';

export interface UseInstrumentSoundResult {
  /** Whether sound is enabled in THIS session on THIS device. Always starts
   *  false; only a tap on the toggle flips it. */
  enabled: boolean;
  /** Flip the preference. The caller must call engine.enable()/disable() in
   *  the same gesture handler — the engine owns the single AudioContext. */
  toggle: () => void;
}

export function useInstrumentSound(): UseInstrumentSoundResult {
  const [enabled, setEnabled] = useState<boolean>(false);

  const toggle = useCallback(() => {
    setEnabled((prev) => !prev);
  }, []);

  return { enabled, toggle };
}