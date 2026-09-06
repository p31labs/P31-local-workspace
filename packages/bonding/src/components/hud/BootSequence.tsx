/**
 * WCD-29: BootSequence — Genesis Fire birthday overlay.
 *
 * Deterministic one-time initialization sequence that fires exclusively
 * on or after March 10, 2026 (Bash's 10th birthday).
 *
 * Full-screen z-[100] terminal printout:
 *   > INITIALIZING COGNITIVE PROSTHETIC...
 *   > AUTHENTICATING OPERATOR...
 *   > WELCOME, BASH.
 *   > LEVEL 10 UNLOCKED.
 *
 * Requires tap on Phosphor Green "ACKNOWLEDGE" button to dismiss.
 * Persists hasSeenBirthdayBoot to IDB so it only fires once.
 */

import { useState, useEffect, useRef } from 'react';
import { get as idbGet, set as idbSet } from 'idb-keyval';

const IDB_KEY = 'p31-birthday-boot';
const BIRTHDAY = new Date('2026-03-10T00:00:00');

const LINES = [
  { text: '> INITIALIZING COGNITIVE PROSTHETIC...', delay: 0 },
  { text: '> LOADING MOLECULE ENGINE...', delay: 1200 },
  { text: '> AUTHENTICATING OPERATOR...', delay: 2400 },
  { text: '> WELCOME, BASH.', delay: 3800 },
  { text: '> LEVEL 10 UNLOCKED.', delay: 5200 },
];

const TOTAL_LINE_TIME = 5200;
const BUTTON_DELAY = TOTAL_LINE_TIME + 1200; // button appears after last line

interface BootSequenceProps {
  onAcknowledge: () => void;
}

export function BootSequence({ onAcknowledge }: BootSequenceProps) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Staggered line reveal
    for (let i = 0; i < LINES.length; i++) {
      const t = setTimeout(() => setVisibleLines(i + 1), LINES[i].delay);
      timersRef.current.push(t);
    }
    // Show acknowledge button
    const btnTimer = setTimeout(() => setShowButton(true), BUTTON_DELAY);
    timersRef.current.push(btnTimer);

    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  const handleAcknowledge = async () => {
    setFadeOut(true);
    try {
      await idbSet(IDB_KEY, true);
    } catch {
      // IDB failure — still dismiss, it just might show again next session
    }
    setTimeout(onAcknowledge, 600);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center px-8 transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Terminal output */}
      <div className="w-full max-w-md space-y-3">
        {LINES.slice(0, visibleLines).map((line, i) => (
          <p
            key={i}
            className={`font-mono text-sm tracking-wider transition-opacity duration-700 ${
              line.text.includes('WELCOME') || line.text.includes('LEVEL 10')
                ? 'text-[#00FF88]'
                : 'text-white/40'
            }`}
            style={{
              animation: 'bootLineIn 0.5s ease-out',
            }}
          >
            {line.text}
          </p>
        ))}

        {/* Blinking cursor */}
        {visibleLines < LINES.length && (
          <span className="inline-block w-2 h-4 bg-white/30 animate-pulse" />
        )}
      </div>

      {/* Acknowledge button */}
      {showButton && (
        <button
          onClick={handleAcknowledge}
          className="mt-12 px-8 py-3 rounded-xl border border-[#00FF88]/30 bg-[#00FF88]/[0.08]
                     text-[#00FF88] font-mono text-sm tracking-wider
                     hover:bg-[#00FF88]/15 active:scale-95
                     transition-all duration-200
                     animate-pulse"
          style={{
            animation: 'bootButtonIn 0.8s ease-out, pulse 2s ease-in-out infinite 0.8s',
          }}
        >
          ACKNOWLEDGE
        </button>
      )}
    </div>
  );
}

// ── Static helpers for App.tsx ──

export function isBirthdayOrAfter(): boolean {
  return new Date() >= BIRTHDAY;
}

export async function hasSeenBoot(): Promise<boolean> {
  try {
    const seen = await idbGet<boolean>(IDB_KEY);
    return seen === true;
  } catch {
    return false;
  }
}
