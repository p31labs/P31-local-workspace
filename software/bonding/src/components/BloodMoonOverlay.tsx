// ═══════════════════════════════════════════════════════
// BloodMoonOverlay — March 3 effects (no visuals)
//
// One-time toast + console message on mount.
// All visual rendering removed — the Blood Moon is now
// an opt-in Easter egg toggled by the BloodMoonNode ember.
// Haze lives in CockpitLayout, gated by store toggle.
// ═══════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import { BLOOD_MOON, isBloodMoon } from '../config/bloodMoon';
import { useGameStore } from '../store/gameStore';

export function BloodMoonOverlay() {
  const pushToast = useGameStore((s) => s.pushToast);
  const toastShown = useRef(false);

  useEffect(() => {
    if (!isBloodMoon()) return;

    console.log(`%c${BLOOD_MOON.consoleMessage.text}`, BLOOD_MOON.consoleMessage.style);

    if (!localStorage.getItem(BLOOD_MOON.toast.storageKey) && !toastShown.current) {
      toastShown.current = true;
      localStorage.setItem(BLOOD_MOON.toast.storageKey, '1');
      pushToast({
        icon: '\u{1F311}',
        text: BLOOD_MOON.toast.line1,
        subtext: BLOOD_MOON.toast.line2,
        duration: 6000,
      });
    }
  }, [pushToast]);

  return null;
}
