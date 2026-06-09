// @ts-nocheck — CockpitStore type reconciliation deferred (WCD-L02 parking lot)
/**
 * Heartbeat Lockout — Somatic Regulation Pacer
 * 
 * Vertex 3 (Interface Node) — Fullscreen recovery mode
 * When spoons drop below 25%, strip away complex editors and 
 * render high-contrast breathing pacer to force physical recovery
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useCockpitStore, useHeartbeatLockout } from '../hooks/useCockpitStore';
import { COCKPIT_COLORS } from '../types/contracts';
import { BREATHING_PATTERN } from '../constants';

// ═══════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════

const PHASES = ['inhale', 'hold', 'exhale'] as const;
const PHASE_LABELS = {
  inhale: 'BREATHE IN',
  hold: 'HOLD',
  exhale: 'BREATHE OUT',
};
const PHASE_COLORS: Record<string, string> = {
  inhale: '#4ecdc4', // teal
  hold: '#F59E0B',   // amber
  exhale: '#7A27FF', // violet
};

// ═══════════════════════════════════════════════════════════════════
// Heartbeat Lockout Component
// ═══════════════════════════════════════════════════════════════════

interface HeartbeatLockoutProps {
  /** Callback when user dismisses early */
  onDismiss?: () => void;
  /** Allow dismiss before recovery */
  allowEarlyDismiss?: boolean;
}

/**
 * Heartbeat Lockout - Fullscreen breathing pacer
 * Activates when spoon count drops below 25%
 */
export default function HeartbeatLockout({ 
  onDismiss,
  allowEarlyDismiss = false 
}: HeartbeatLockoutProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();
  
  const { spoons, maxSpoons, setSpoons } = useCockpitStore();
  const isLocked = useHeartbeatLockout();
  
  const [phase, setPhase] = useState<typeof PHASES[number]>('inhale');
  const [countdown, setCountdown] = useState(BREATHING_PATTERN.inhale);
  const [canDismiss, setCanDismiss] = useState(allowEarlyDismiss);
  
  // Calculate recovery target (need 25% to dismiss)
  const recoveryTarget = maxSpoons * 0.25;
  
  // Phase timing
  useEffect(() => {
    if (!isLocked) return;
    
    let currentPhase: typeof PHASES[number] = 'inhale';
    setPhase(currentPhase);
    setCountdown(BREATHING_PATTERN.inhale);
    
    const interval = setInterval(() => {
      setCountdown((prev: number) => {
        if (prev <= 1) {
          // Move to next phase
          if (currentPhase === 'inhale') {
            currentPhase = 'hold';
            setPhase('hold');
            return BREATHING_PATTERN.hold;
          } else if (currentPhase === 'hold') {
            currentPhase = 'exhale';
            setPhase('exhale');
            return BREATHING_PATTERN.exhale;
          } else {
            currentPhase = 'inhale';
            setPhase('inhale');
            return BREATHING_PATTERN.inhale;
          }
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isLocked]);
  
  // Canvas animation
  useEffect(() => {
    if (!isLocked || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    
    let lastTime = performance.now();
    let breathProgress = 0;
    
    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      const baseR = Math.min(W, H) * 0.15;
      
      // Update breath progress
      breathProgress += dt / 12; // 12s full cycle
      if (breathProgress > 1) breathProgress = 0;
      
      // Determine radius based on phase
      let radius: number;
      const phaseProgress = (breathProgress * 12) % 12;
      
      if (phaseProgress < 4) {
        // Inhale - expand
        radius = baseR * (0.5 + 0.5 * (phaseProgress / 4));
      } else if (phaseProgress < 6) {
        // Hold - pulse
        radius = baseR * (1.0 + 0.02 * Math.sin(time * 0.003));
      } else {
        // Exhale - contract
        radius = baseR * (1.0 - 0.5 * ((phaseProgress - 6) / 6));
      }
      
      // Clear with void color
      ctx.fillStyle = COCKPIT_COLORS.void;
      ctx.fillRect(0, 0, W, H);
      
      // Draw central orb
      const phaseColor = PHASE_COLORS[phase];
      const rgb = hexToRgb(phaseColor);
      
      // Outer glow
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 2);
      glow.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
      glow.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 2, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
      
      // Inner orb
      const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.4);
      innerGrad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
      innerGrad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = innerGrad;
      ctx.fill();
      
      // Breathing ring particles
      const particleCount = 60;
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const wobble = Math.sin(time * 0.002 + i) * 0.05;
        const r = radius + radius * wobble;
        
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`;
        ctx.fill();
      }
      
      animRef.current = requestAnimationFrame(animate);
    };
    
    animRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [isLocked, phase]);
  
  // Auto-restore spoons slowly during lockout
  useEffect(() => {
    if (!isLocked) return;
    
    const restoreInterval = setInterval(() => {
      const { spoons } = useCockpitStore.getState();
      if (spoons < recoveryTarget) {
        setSpoons(spoons + 0.1);
      }
    }, 2000);
    
    return () => clearInterval(restoreInterval);
  }, [isLocked, recoveryTarget, setSpoons]);
  
  if (!isLocked) return null;
  
  const phaseColor = PHASE_COLORS[phase];
  const canUserDismiss = spoons >= recoveryTarget;
  
  return (
    <div className="heartbeat-lockout">
      <canvas ref={canvasRef} className="heartbeat-canvas" />
      
      <div className="heartbeat-content">
        <div className="heartbeat-status">
          <span 
            className="heartbeat-label"
            style={{ color: phaseColor }}
          >
            {PHASE_LABELS[phase]}
          </span>
          <span 
            className="heartbeat-countdown"
            style={{ color: phaseColor }}
          >
            {countdown}
          </span>
        </div>
        
        <div className="heartbeat-instruction">
          <p style={{ color: phaseColor }}>
            Focus on your breath. Your body needs recovery.
          </p>
          <p className="heartbeat-spoons">
            Current: {spoons.toFixed(1)} / {maxSpoons} spoons
          </p>
          <p className="heartbeat-target">
            Need {recoveryTarget.toFixed(1)} spoons to continue
          </p>
        </div>
        
        {(canUserDismiss || allowEarlyDismiss) && (
          <button 
            className="heartbeat-dismiss"
            onClick={onDismiss}
          >
            Return to Command
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Utility
// ═══════════════════════════════════════════════════════════════════

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 255, b: 136 };
}

// ═══════════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════════

export { PHASE_COLORS, PHASE_LABELS };
