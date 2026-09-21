/**
 * The music maker — useInstrumentSound.
 *
 * Extends the Loom's opt-in sound discipline (useLoomSound.ts) to a live
 * instrument. Same three rules, different playback shape:
 *
 *   1. Sound is OFF by default, every session, every device. A shared session
 *      where one family member enabled sound does NOT turn sound on for
 *      another family member's device. The only thing that turns it on is a
 *      tap on the toggle IN THIS SESSION on THIS device.
 *   2. Every triggered sound has a visual echo — callers must render the
 *      zone glow regardless of whether sound fired.
 *   3. The preference persists per-device (localStorage), so a family member
 *      who turns sound on keeps it on for their next session.
 *
 * This hook owns NO AudioContext. The SpatialInstrumentEngine is the single
 * context owner and creates it inside enable() — the user gesture. The hook
 * only tracks the opt-in state; the App's toggle handler calls engine.enable()
 * in the same tap. (Previously the hook created its own context, so a session
 * had two — one of them dead and never closed.)
 */
import { useCallback, useState } from 'react';

const STORAGE_KEY = 'music-maker:sound';

function readInitialEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'on') return true;
    if (stored === 'off') return false;
  } catch {
    // localStorage can throw in private mode / sandboxed iframes. Fall through.
  }
  return false;
}

export interface UseInstrumentSoundResult {
  /** Whether sound is enabled in this session on this device. */
  enabled: boolean;
  /** Flip the preference. The caller must call engine.enable()/disable() in
   *  the same gesture handler — the engine owns the single AudioContext. */
  toggle: () => void;
}

export function useInstrumentSound(): UseInstrumentSoundResult {
  const [enabled, setEnabled] = useState<boolean>(readInitialEnabled);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
      } catch {
        // Non-fatal: the preference just won't survive a reload.
      }
      return next;
    });
  }, []);

  return { enabled, toggle };
}