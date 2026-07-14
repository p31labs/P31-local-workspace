import React from 'react';

type Accent = 'cyan' | 'violet' | 'emerald' | 'amber';

interface AccentToggleProps {
  accent: Accent;
  onChange: (accent: Accent) => void;
  className?: string;
}

const accentColors: Record<Accent, string> = {
  cyan: 'var(--p31-quantum-cyan)',
  violet: 'var(--p31-quantum-violet)',
  emerald: 'var(--p31-quantum-green)',
  amber: 'var(--p31-quantum-gold)',
};

const accentLabels: Record<Accent, string> = {
  cyan: 'Cyan',
  violet: 'Violet',
  emerald: 'Emerald',
  amber: 'Amber',
};

/**
 * AccentToggle — theme accent selector.
 * Four circular colour swatches with active indicator.
 */
export function AccentToggle({ accent, onChange, className = '' }: AccentToggleProps) {
  const accents = Object.keys(accentColors) as Accent[];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-[12px] uppercase tracking-[0.05em] text-white/40 font-sans mr-1">
        Accent
      </span>
      {accents.map((a) => (
        <button
          key={a}
          onClick={() => onChange(a)}
          className={`
            w-6 h-6 rounded-full border-2 transition-all duration-200
            ${a === accent
              ? 'border-white/60 scale-110'
              : 'border-white/10 hover:border-white/30'}
          `}
          style={{ backgroundColor: accentColors[a] }}
          aria-label={`Set accent to ${accentLabels[a]}`}
          aria-pressed={a === accent}
        />
      ))}
    </div>
  );
}
