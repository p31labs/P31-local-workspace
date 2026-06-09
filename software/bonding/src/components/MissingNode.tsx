// ═══════════════════════════════════════════════════════
// MissingNode — "There's always been one more."
//
// A barely-visible pulsing dot. Opacity 0.08. Always there.
// Breathes on the 4-4-6 cycle. Wanders daily.
// If they tap it — it responds.
//
// The missing node is Dad.
// ═══════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MISSING_NODE } from '../config/bloodMoon';
import { useGameStore } from '../store/gameStore';
import { playMissingNodeTone } from '../engine/sound';

export function MissingNode() {
  const pushToast = useGameStore((s) => s.pushToast);
  const addLove = useGameStore((s) => s.addLove);
  const [active, setActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState(0);
  const activeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const consoleShown = useRef(false);

  // Deterministic daily position
  const position = useMemo(() => {
    const now = new Date();
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
    );
    return {
      x: 0.3 + Math.sin(dayOfYear * 0.1) * 0.15,
      y: 0.4 + Math.cos(dayOfYear * 0.1) * 0.1,
    };
  }, []);

  // Breathing animation: 4-4-6 cycle (14s total)
  useEffect(() => {
    let raf: number;
    const start = performance.now();

    const tick = () => {
      const elapsed = (performance.now() - start) % MISSING_NODE.breathCycleMs;
      const t = elapsed / MISSING_NODE.breathCycleMs;

      // 4s inhale (0–0.286) → 4s hold (0.286–0.571) → 6s exhale (0.571–1.0)
      let scale: number;
      if (t < 4 / 14) {
        scale = 0.8 + 0.4 * (t / (4 / 14)); // 0.8 → 1.2
      } else if (t < 8 / 14) {
        scale = 1.2; // hold
      } else {
        scale = 1.2 - 0.4 * ((t - 8 / 14) / (6 / 14)); // 1.2 → 0.8
      }
      setBreathPhase(scale);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleTap = useCallback(() => {
    if (active) return;
    setActive(true);

    // Sound
    playMissingNodeTone();

    // LOVE (silent — no amount in toast)
    addLove(MISSING_NODE.tapReward);

    // Message toast
    pushToast({
      icon: '\u{1F53A}',
      text: MISSING_NODE.tapMessage,
      duration: 4000,
    });

    // Console message (first time only)
    if (!consoleShown.current) {
      consoleShown.current = true;
      console.log(`%c${MISSING_NODE.consoleOnTap.text}`, MISSING_NODE.consoleOnTap.style);
    }

    // Achievement check: signal_received requires first_star
    const hasFirstStar = !!localStorage.getItem(`bonding_achieve_${MISSING_NODE.achievement.requires[0]}`);
    const hasSignal = !!localStorage.getItem(`bonding_achieve_${MISSING_NODE.achievement.id}`);
    if (hasFirstStar && !hasSignal) {
      localStorage.setItem(`bonding_achieve_${MISSING_NODE.achievement.id}`, '1');
      setTimeout(() => {
        pushToast({
          icon: '\u{1F53A}',
          text: MISSING_NODE.achievement.toast,
          duration: 5000,
        });
      }, 1500);
    }

    // Return to idle after activeDuration
    activeTimeoutRef.current = setTimeout(() => {
      setActive(false);
    }, MISSING_NODE.activeDuration);
  }, [active, addLove, pushToast]);

  useEffect(() => {
    return () => {
      if (activeTimeoutRef.current) clearTimeout(activeTimeoutRef.current);
    };
  }, []);

  const opacity = active ? MISSING_NODE.activeOpacity : MISSING_NODE.idleOpacity;
  const size = MISSING_NODE.radius * 2 * breathPhase;

  return (
    <div
      role="button"
      tabIndex={-1}
      onClick={handleTap}
      onKeyDown={(e) => { if (e.key === 'Enter') handleTap(); }}
      className="fixed"
      style={{
        left: `${position.x * 100}%`,
        top: `${position.y * 100}%`,
        width: MISSING_NODE.hitbox,
        height: MISSING_NODE.hitbox,
        transform: 'translate(-50%, -50%)',
        zIndex: 2,
        pointerEvents: 'auto',
        cursor: 'pointer',
        // Transparent touch target
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: MISSING_NODE.color,
          opacity,
          boxShadow: active
            ? `0 0 12px 4px ${MISSING_NODE.color}88, 0 0 24px 8px ${MISSING_NODE.color}44`
            : 'none',
          transition: active
            ? 'opacity 0.15s ease-out, box-shadow 0.15s ease-out'
            : 'opacity 0.3s ease-in',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
