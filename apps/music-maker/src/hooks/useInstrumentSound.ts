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
 *      zone glow regardless of whether `play` returned true.
 *   3. The preference persists per-device (localStorage), so a family member
 *      who turns sound on keeps it on for their next session.
 *
 * The mute-state/localStorage logic is extracted so the Loom's useLoomSound
 * and this hook could share a primitive; here it's self-contained to keep the
 * standalone app independent of the Loom's chapter context.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

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
  /** The user gesture — the toggle tap. */
  toggle: () => void;
  /** Ensure the AudioContext exists/resumes. Returns the context or null.
   *  Only ever called from a user-gesture handler. */
  resume: () => AudioContext | null;
}

export function useInstrumentSound(): UseInstrumentSoundResult {
  const [enabled, setEnabled] = useState<boolean>(readInitialEnabled);
  const ctxRef = useRef<AudioContext | null>(null);

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

  const resume = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    try {
      if (!ctxRef.current) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return null;
        ctxRef.current = new Ctor();
      }
      const ctx = ctxRef.current;
      if (ctx.state === 'suspended') void ctx.resume();
      return ctx;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    return () => {
      void ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
    };
  }, []);

  return { enabled, toggle, resume };
}