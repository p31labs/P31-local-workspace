/**
 * @file PWAInstallPrompt.tsx — WILLOW P0 mitigation #1 (Safari ITP exemption).
 *
 * Standalone PWA installs are EXEMPT from Safari's 7-day ITP local-storage wipe.
 * On iOS Safari (not yet installed) we surface step-by-step "Add to Home Screen"
 * guidance; on Android/Desktop we capture the native beforeinstallprompt event.
 * Children cannot proceed to Data Locker until the app is installed or the user
 * acknowledges the data-retention risk.
 */

import { useEffect, useState, useCallback } from 'react';
import { GlassCard, GlowButton } from '@p31/ui/chrome';

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOS = /iP(ad|hone|od)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return iOS && webkit;
}

function isStandalone(): boolean {
  return typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true);
}

interface PWAInstallPromptProps {
  /** Called when the user has a durable install path (installed, or acknowledged risk). */
  onResolved: () => void;
}

export function PWAInstallPrompt({ onResolved }: PWAInstallPromptProps) {
  const [deferred, setDeferred] = useState<any>(null);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setIos(isIosSafari());
    setStandalone(isStandalone());
    const handler = (e: any) => { e.preventDefault(); setDeferred(e); };
    window.addEventListener('beforeinstallprompt', handler as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setStandalone(true);
    onResolved();
  }, [deferred, onResolved]);

  // Already installed (or resolved in a prior session).
  useEffect(() => {
    if (standalone) onResolved();
  }, [standalone, onResolved]);

  const dismissable = !ios; // iOS has no programmatic install → must use share sheet

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-void-deep/90 backdrop-blur-md">
      <GlassCard className="p-6 max-w-sm w-full text-center" strong>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📲</div>
        <h2 className="text-lg font-bold text-quantum-green mb-2">Add Willow to your Home Screen</h2>
        <p className="text-cloud/70 text-sm mb-4">
          Willow keeps your garden safe on this device. Installing it means your drawings, quests, and
          buddy chats stay put — even after a week away.
        </p>

        {ios && (
          <ol className="text-left text-cloud/80 text-[13px] leading-relaxed mb-4 space-y-1 list-decimal list-inside">
            <li>Tap the <span aria-hidden>Ⓐ</span> <strong>Share</strong> button at the bottom of Safari.</li>
            <li>Scroll down and tap <strong>“Add to Home Screen”</strong>.</li>
            <li>Tap <strong>Add</strong> in the top-right, then open Willow from your Home Screen.</li>
          </ol>
        )}

        {!ios && deferred && (
          <div className="mb-4">
            <GlowButton color="green" size="md" onClick={install}>Install Willow</GlowButton>
          </div>
        )}

        {(!ios || standalone) && (
          <GlowButton color="violet" size="sm" onClick={onResolved}>Continue in browser</GlowButton>
        )}

        {dismissable && (
          <button
            onClick={onResolved}
            className="block mx-auto mt-3 text-[11px] text-mist/60 underline"
          >
            I understand data may be cleared if I don’t install
          </button>
        )}
      </GlassCard>
    </div>
  );
}
