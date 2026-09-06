/**
 * @file SovereigntyStrip — Persistent sovereign identity strip shown across
 * all apps. Reads the Cognitive Passport and shows a personalized, private,
 * non-judgmental message + a privacy status indicator. Part of `.ui-chrome`
 * so it hides during Crisis Mode (spoons = 0).
 */

import { useState, useEffect } from 'react';
import { usePassport } from '../passport';

export interface SovereigntyStripProps {
  appName: string;
  /** Optional custom message when no passport exists. */
  noPassportMessage?: string;
}

export function SovereigntyStrip({ appName, noPassportMessage }: SovereigntyStripProps) {
  const { status, passport } = usePassport();
  const [loveBalance, setLoveBalance] = useState<number | null>(null);
  const name = passport?.identity?.displayName;
  const pronouns = passport?.identity?.pronouns;

  useEffect(() => {
    if (!passport?.did) return;
    fetch(`https://love-ledger.p31ca.org/api/love/balance/${encodeURIComponent(passport.did)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setLoveBalance(d?.availableBalance ?? null))
      .catch(() => {});
  }, [passport?.did]);

  let message: string;
  if (status === 'loading') {
    message = '⋯';
  } else if (passport) {
    message = name
      ? `${name}${pronouns ? ` (${pronouns})` : ''}, you're sovereign here.`
      : 'Your identity stays on this device.';
  } else {
    message = noPassportMessage || 'No passport yet — your identity stays yours.';
  }

  return (
    <div
      className="ui-chrome fixed bottom-0 left-0 right-0 z-20 h-[22px] flex items-center px-3 gap-3 border-t border-white/[0.06] bg-void/90 font-mono-tech text-[9px] text-mist"
      role="contentinfo"
      aria-label="Sovereignty status"
    >
      <span className="text-quantum-cyan">{appName}</span>
      <span className="text-white/15">|</span>
      <span className="truncate">{message}</span>
      {loveBalance !== null && (
        <span className="text-quantum-gold flex items-center gap-1">
          ♥ {loveBalance.toFixed(1)}
        </span>
      )}
      <span className="ml-auto text-quantum-green flex items-center gap-1">
        <span aria-hidden="true">🔒</span> sovereign
      </span>
    </div>
  );
}
