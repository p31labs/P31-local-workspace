/**
 * @file hooks/useBehavioralSignals.ts
 *
 * Infers cognitive load from local interaction patterns and adjusts spoon level.
 * All signals are computed client-side. No data leaves the device.
 *
 * Signals (fatigue → spoons ↓):
 *   - Mouse/touch speed (px/ms): slow → high cognitive load
 *   - Pause duration (ms since last interaction): long → high cognitive load
 *   - Session duration: >45min → gradual reduction
 *   - Time of day: night (22-6) and post-lunch (14-16) → reduction
 *   - Keystroke dynamics: slow typing (>300ms avg) → cognitive load ↑
 *   - Pupil dilation (via gaze tracking): >0.6 → cognitive load ↑
 *
 * Signals (engagement → spoons ↑):
 *   - Fast typing (<100ms avg) → understimulation detection
 *   - Fast mouse (>1.5 px/ms) → active engagement
 *   - Short session (<5min) → fresh attention
 *   - High interaction rate (>3 moves/sec) → active engagement
 *   - Daytime (not night/post-lunch) → baseline engagement
 *
 * The inferred adjustment is smoothed via exponential moving average (EMA)
 * to prevent jitter. The user can always override manually via the spoon dial.
 * Manual overrides are respected for 5 minutes before auto-inference resumes.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useShipStore } from '../store/shipStore';
import { useGazeSignals } from './useGazeSignals';

const SMOOTHING_FACTOR = 0.08;
const PAUSE_THRESHOLD_MS = 800;
const SLOW_SPEED_THRESHOLD = 0.3; // px/ms
const FAST_SPEED_THRESHOLD = 1.5;  // px/ms
const SESSION_DECAY_MINUTES = 45;
const SESSION_BOOST_MINUTES = 5;
const NIGHT_HOUR_START = 22;
const NIGHT_HOUR_END = 6;
const POST_LUNCH_START = 14;
const POST_LUNCH_END = 16;
const MANUAL_OVERRIDE_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const MAX_DOWN_ADJUST = 1; // max spoons to auto-decrease per session
const MAX_UP_ADJUST = 1;   // max spoons to auto-increase per session
const INTERACTION_WINDOW_MS = 5000;
const HIGH_INTERACTION_RATE = 3; // moves per second
const GAZE_FATIGUE_THRESHOLD = 0.6;
const GAZE_FATIGUE_AMOUNT = 0.3;
const GAZE_ADJUST_COOLDOWN_MS = 5 * 60 * 1000;

export interface BehavioralSignal {
  mouseSpeed: number;
  pauseDuration: number;
  sessionMinutes: number;
  timeOfDayPenalty: number;
  keySpeed: number;
  interactionRate: number;
  pupilDilation: number;
}

export function useBehavioralSignals() {
  const { pupilDilation } = useGazeSignals();
  const spoons = useShipStore((s) => s.spoons);
  const setSpoons = useShipStore((s) => s.setSpoons);
  const sessionStartRef = useRef(Date.now());
  const lastMoveRef = useRef({ x: 0, y: 0, time: Date.now() });
  const pauseStartRef = useRef(Date.now());
  const smoothedRef = useRef(spoons);
  const downAdjustCountRef = useRef(0);
  const upAdjustCountRef = useRef(0);
  const lastAutoAdjustRef = useRef(0);
  const keyTimestamps = useRef<number[]>([]);
  const keySpeedRef = useRef(0);
  const moveTimestamps = useRef<number[]>([]);
  const lastManualSpoonsRef = useRef(spoons);
  const engagementRef = useRef(0);
  const fatigueRef = useRef(0);
  const gazeAdjustCountRef = useRef(0);
  const lastGazeAdjustRef = useRef(0);
  const pupilDilationRef = useRef(0);

  useEffect(() => {
    pupilDilationRef.current = pupilDilation;
  }, [pupilDilation]);

  const inferSignal = useCallback((): BehavioralSignal => {
    const now = Date.now();
    const sessionMinutes = (now - sessionStartRef.current) / 60000;
    const pauseDuration = now - lastMoveRef.current.time;
    const hour = new Date().getHours();

    let timeOfDayPenalty = 0;
    if (hour >= NIGHT_HOUR_START || hour < NIGHT_HOUR_END) {
      timeOfDayPenalty = -1;
    } else if (hour >= POST_LUNCH_START && hour < POST_LUNCH_END) {
      timeOfDayPenalty = -0.5;
    }

    const cutoff = now - INTERACTION_WINDOW_MS;
    const recentMoves = moveTimestamps.current.filter((t) => t > cutoff);
    const interactionRate = recentMoves.length / (INTERACTION_WINDOW_MS / 1000);

    return {
      mouseSpeed: 0,
      pauseDuration,
      sessionMinutes,
      timeOfDayPenalty,
      keySpeed: keySpeedRef.current,
      interactionRate,
      pupilDilation: pupilDilationRef.current,
    };
  }, []);

  const computeInferredSpoons = useCallback((signal: BehavioralSignal): number => {
    const { pauseDuration, sessionMinutes, timeOfDayPenalty, keySpeed, interactionRate, pupilDilation } = signal;
    let fatigue = 0;
    let engagement = 0;

    if (pauseDuration > PAUSE_THRESHOLD_MS) {
      fatigue += 0.3;
    }
    if (sessionMinutes > SESSION_DECAY_MINUTES) {
      fatigue += 0.2;
    }
    if (keySpeed > 300) {
      fatigue += 0.2;
    }
    if (timeOfDayPenalty < 0) {
      fatigue += Math.abs(timeOfDayPenalty);
    }

    if (pupilDilation > GAZE_FATIGUE_THRESHOLD) {
      const now = Date.now();
      const canGazeAdjust = gazeAdjustCountRef.current < 1 && now - lastGazeAdjustRef.current > GAZE_ADJUST_COOLDOWN_MS;
      if (canGazeAdjust) {
        gazeAdjustCountRef.current += 1;
        lastGazeAdjustRef.current = now;
        fatigue += GAZE_FATIGUE_AMOUNT;
      }
    }

    if (keySpeed > 0 && keySpeed < 100) {
      engagement += 0.2;
    }
    if (sessionMinutes < SESSION_BOOST_MINUTES) {
      engagement += 0.2;
    }
    if (interactionRate > HIGH_INTERACTION_RATE) {
      engagement += 0.1;
    }
    if (timeOfDayPenalty === 0) {
      engagement += 0.1;
    }

    fatigueRef.current += fatigue;
    engagementRef.current += engagement;

    const now = Date.now();
    const recentManual = now - lastManualSpoonsRef.current < MANUAL_OVERRIDE_COOLDOWN_MS;
    if (recentManual) {
      return spoons;
    }

    const net = engagement - fatigue;
    if (net === 0) return spoons;

    const now2 = Date.now();
    const canDown = downAdjustCountRef.current < MAX_DOWN_ADJUST && now2 - lastAutoAdjustRef.current > 60000;
    const canUp = upAdjustCountRef.current < MAX_UP_ADJUST && now2 - lastAutoAdjustRef.current > 60000;

    if (net < 0 && canDown) {
      downAdjustCountRef.current += 1;
      lastAutoAdjustRef.current = now2;
      return Math.max(0, Math.round(spoons + net));
    }
    if (net > 0 && canUp) {
      upAdjustCountRef.current += 1;
      lastAutoAdjustRef.current = now2;
      return Math.min(5, Math.round(spoons + net));
    }

    return spoons;
  }, [spoons]);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const now = Date.now();
      const clientX = 'touches' in e ? e.touches[0]?.clientX ?? lastMoveRef.current.x : e.clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY ?? lastMoveRef.current.y : e.clientY;
      const dx = clientX - lastMoveRef.current.x;
      const dy = clientY - lastMoveRef.current.y;
      const dt = now - lastMoveRef.current.time;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const speed = dt > 0 ? distance / dt : 0;

      lastMoveRef.current = { x: clientX, y: clientY, time: now };
      pauseStartRef.current = now;
      moveTimestamps.current.push(now);
      if (moveTimestamps.current.length > 100) moveTimestamps.current.shift();

      const inferred = speed < SLOW_SPEED_THRESHOLD
        ? Math.max(0, spoons - 1)
        : speed > FAST_SPEED_THRESHOLD
          ? Math.min(5, spoons + 1)
          : spoons;
      smoothedRef.current += SMOOTHING_FACTOR * (inferred - smoothedRef.current);
    };

    const handleKey = () => {
      pauseStartRef.current = Date.now();
    };

    const handleClick = () => {
      pauseStartRef.current = Date.now();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const ignored = new Set(['Shift','Control','Alt','Meta','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End','PageUp','PageDown','Insert','Delete','Escape','Tab']);
      if (ignored.has(e.key)) return;

      const now = performance.now();
      keyTimestamps.current.push(now);
      if (keyTimestamps.current.length > 30) keyTimestamps.current.shift();

      if (keyTimestamps.current.length >= 5) {
        const deltas: number[] = [];
        for (let i = 1; i < keyTimestamps.current.length; i++) {
          deltas.push(keyTimestamps.current[i] - keyTimestamps.current[i - 1]);
        }
        const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
        keySpeedRef.current = avg;
      }
    };

    const handleSpoonsChange = () => {
      const current = useShipStore.getState().spoons;
      lastManualSpoonsRef.current = current;
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchstart', handleMove, { passive: true });
    window.addEventListener('keydown', handleKey);
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    const unsubSpoons = useShipStore.subscribe(handleSpoonsChange);

    const interval = setInterval(() => {
      const signal = inferSignal();
      const inferred = computeInferredSpoons(signal);
      const smoothed = Math.round(smoothedRef.current);
      if (inferred !== spoons && Math.abs(inferred - spoons) <= 1) {
        setSpoons(inferred);
        document.documentElement.setAttribute('data-spoons', String(inferred));
      }
    }, 5000);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchstart', handleMove);
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
      unsubSpoons();
      clearInterval(interval);
    };
  }, [spoons, setSpoons, inferSignal, computeInferredSpoons]);

  return {
    getCurrentSignal: inferSignal,
  };
}
