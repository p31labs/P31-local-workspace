import React from 'react';

interface VagusBreathProps {
  active: boolean;
  onExit?: () => void;
  className?: string;
}

/**
 * VagusBreath — crisis mode breathing overlay.
 * Full-screen breathing circle with inhale→hold→exhale→hold phases (4s each).
 * Exit via Escape key or "I'm ready" button.
 */
export function VagusBreath({ active, onExit, className = '' }: VagusBreathProps) {
  if (!active) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center ${className}`}
      role="dialog"
      aria-label="Crisis breathing exercise"
      aria-modal="true"
    >
      {/* Breathing circle */}
      <div
        className="w-40 h-40 rounded-full border-2 border-quantum-cyan/30 animate-breathe"
        aria-hidden="true"
      />

      {/* Phase label (decorative, not functional) */}
      <p className="mt-8 text-sm text-white/30 font-sans tracking-wide">
        Breathe
      </p>

      {/* Exit control — always visible */}
      <button
        onClick={onExit}
        className="mt-8 px-6 py-3 min-h-[48px] text-sm text-white/60 hover:text-white/90 border border-white/10 hover:border-white/20 rounded-[12px] transition-all duration-300"
        aria-label="Exit crisis breathing exercise"
      >
        I&apos;m ready
      </button>
    </div>
  );
}
