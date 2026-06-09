import { useEffect, useState, useRef } from 'react';

interface FreezeBreakerOverlayProps {
  onComplete?: () => void;
  thresholdTime?: number; // seconds to hold
}

/**
 * FreezeBreakerOverlay: Wave Function Collapse mechanic.
 * Full-screen overlay appears during executive freeze.
 * User holds spacebar → rising sine tone → snap → crystal alignment.
 */
export function FreezeBreakerOverlay({ onComplete, thresholdTime = 3 }: FreezeBreakerOverlayProps) {
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [soundPlaying, setSoundPlaying] = useState(false);
  const startTime = useRef<number | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !active && !e.repeat) {
        startFreezeBreak();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && active) {
        cancelFreezeBreak();
      }
    };
    const handleCustomTrigger = () => {
      if (!active) startFreezeBreak();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('p31:triggerFreezeBreak', handleCustomTrigger);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('p31:triggerFreezeBreak', handleCustomTrigger);
    };
  }, [active]);

  const startFreezeBreak = () => {
    setActive(true);
    setProgress(0);
    startTime.current = performance.now();
    // Initialize Web Audio API context on user gesture
    if (!audioCtx.current) {
      audioCtx.current = new AudioContext();
    }
    playRisingTone();
  };

  const playRisingTone = () => {
    if (!audioCtx.current) return;
    const ctx = audioCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + thresholdTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + thresholdTime * 0.8);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + thresholdTime);
    osc.start();
    setSoundPlaying(true);
    osc.stop(ctx.currentTime + thresholdTime);
  };

  const cancelFreezeBreak = () => {
    setActive(false);
    setProgress(0);
    startTime.current = null;
    if (audioCtx.current) {
      audioCtx.current.suspend();
    }
  };

  useEffect(() => {
    if (!active) return;
    const frame = requestAnimationFrame(function tick() {
      if (startTime.current === null) return;
      const elapsed = (performance.now() - startTime.current) / 1000;
      const p = Math.min(elapsed / thresholdTime, 1);
      setProgress(p);
      if (p >= 1) {
        // Freeze breaker complete
        setActive(false);
        setSoundPlaying(false);
        if (audioCtx.current) {
          audioCtx.current.close();
          audioCtx.current = null;
        }
        // Trigger wave function collapse (emit event for parent component)
        window.dispatchEvent(new CustomEvent('p31:freezeBreakComplete'));
        onComplete?.();
      } else {
        requestAnimationFrame(tick);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [active, thresholdTime, onComplete]);

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      style={{ WebkitBackdropFilter: 'blur(8px)' }}
    >
      {/* Concentric rings breathing */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="rounded-full border-4 border-p31-cyan"
          style={{
            width: '40%',
            height: '40%',
            opacity: 0.3 + progress * 0.4,
            transform: `scale(${1 + progress * 0.2})`,
            transition: 'transform 0.1s linear',
          }}
        />
        <div
          className="absolute rounded-full border-4 border-p31-teal"
          style={{
            width: '60%',
            height: '60%',
            opacity: 0.2 + progress * 0.3,
            transform: `scale(${1 + progress * 0.15})`,
            transition: 'transform 0.1s linear',
          }}
        />
        <div
          className="absolute rounded-full border-4 border-p31-cyan"
          style={{
            width: '80%',
            height: '80%',
            opacity: 0.1 + progress * 0.2,
            transform: `scale(${1 + progress * 0.1})`,
            transition: 'transform 0.1s linear',
          }}
        />
      </div>
      
      {/* Central instruction */}
      <div className="relative z-10 text-center">
        <p className="text-p31-cyan text-2xl font-bold mb-2">HOLD SPACE</p>
        <div className="w-48 h-2 bg-p31-void-50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-p31-teal to-p31-cyan"
            style={{ width: `${progress * 100}%`, transition: 'width 0.05s linear' }}
          />
        </div>
        <p className="text-p31-cloud-60 text-xs mt-2 font-mono">
          {Math.round(progress * 100)}% complete
        </p>
      </div>
    </div>
  );
}

export default FreezeBreakerOverlay;