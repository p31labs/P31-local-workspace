import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The Loom — opt-in sound for the child-facing chapters.
 *
 * Three rules, all from the accessibility research, none optional:
 *   1. Sound is OFF by default. A child who has not asked for sound never
 *      hears it. This sidesteps WCAG 1.4.2 (Audio Control) entirely rather
 *      than satisfying it — no auto-play means no pause/stop mechanism.
 *   2. Every cue has a visual equivalent. `play()` returns whether sound
 *      actually fired; callers must NOT gate their visual feedback on it.
 *      Sound never replaces visual feedback.
 *   3. The preference persists (localStorage, per-device), so a child who
 *      turns sound on for one chapter keeps it on for the next.
 *
 * `prefers-reduced-motion` is deliberately NOT used to decide the default:
 * sound is off until the child opts in, so a reduced-motion user is silent by
 * construction (the strictest interpretation), and the toggle remains fully
 * independent — motion preference and sound preference are not the same thing.
 *
 * Cues are synthesized with the Web Audio API (oscillators). No audio files,
 * no network, no CORS. The AudioContext is created lazily on the first
 * play(), which is always called from a user-gesture handler, satisfying the
 * browser's autoplay policy.
 */

const STORAGE_KEY = 'loom:sound';

type Cue = 'tap' | 'celebrate' | 'defer';

interface CueSpec {
  freqs: number[];
  duration: number;
  gain: number;
}

const CUES: Record<Cue, CueSpec> = {
  tap: { freqs: [660], duration: 0.08, gain: 0.05 },
  celebrate: { freqs: [523, 659, 784], duration: 0.28, gain: 0.07 },
  // "Not yet" is a valid decision, not a failure — a soft descending settle,
  // never a minor chord. The two answers sound different but equally warm.
  defer: { freqs: [440, 392], duration: 0.22, gain: 0.05 },
};

function readInitialEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'on') return true;
    if (stored === 'off') return false;
  } catch {
    // localStorage can throw in private mode / sandboxed iframes. Fall through.
  }
  // First visit: sound is OFF. The master prompt says opt-in, muted by
  // default — a child who has not asked for sound never hears it. A stored
  // 'on' from a previous session is the only thing that turns it on.
  return false;
}

export interface UseLoomSoundResult {
  enabled: boolean;
  toggle: () => void;
  /** Returns true if sound actually played, false otherwise. Callers must
   *  render the visual feedback regardless — sound never replaces it. */
  play: (cue: Cue) => boolean;
}

export function useLoomSound(): UseLoomSoundResult {
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

  const play = useCallback(
    (cue: Cue): boolean => {
      if (!enabled) return false;
      try {
        if (!ctxRef.current) {
          const Ctor =
            window.AudioContext ??
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (!Ctor) return false;
          ctxRef.current = new Ctor();
        }
        const ctx = ctxRef.current;
        // Browsers suspend the context until a gesture resumes it. play() is
        // always called from a click/tap handler, so this is safe.
        if (ctx.state === 'suspended') void ctx.resume();

        const { freqs, duration, gain } = CUES[cue];
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const amp = ctx.createGain();
        osc.type = 'sine';
        osc.connect(amp).connect(ctx.destination);
        amp.gain.setValueAtTime(0, now);
        amp.gain.linearRampToValueAtTime(gain, now + 0.01);
        amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        freqs.forEach((f, i) => osc.frequency.setValueAtTime(f, now + i * (duration / freqs.length)));
        osc.start(now);
        osc.stop(now + duration + 0.02);
        return true;
      } catch {
        return false;
      }
    },
    [enabled],
  );

  // Tear down the context on unmount so a long session doesn't leak audio nodes.
  useEffect(() => {
    return () => {
      void ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
    };
  }, []);

  return { enabled, toggle, play };
}