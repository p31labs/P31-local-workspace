import React from 'react';

interface SpoonSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

const spoonLabels = [
  'Crisis',   // 0
  'Bare',     // 1
  'Low',      // 2
  'Stressed', // 3
  'Mild',     // 4
  'Optimal',  // 5
];

const spoonColors = [
  'var(--p31-quantum-red)',    // 0
  'var(--p31-quantum-red)',    // 1
  'var(--p31-quantum-gold)',   // 2
  'var(--p31-quantum-iris)',   // 3
  'var(--p31-quantum-violet)', // 4
  'var(--p31-quantum-cyan)',   // 5
];

/**
 * SpoonSlider — cognitive load control (0-5).
 * Visual slider with label and colour-coded indicator.
 */
export function SpoonSlider({
  value,
  onChange,
  min = 0,
  max = 5,
  disabled = false,
  className = '',
}: SpoonSliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const color = spoonColors[value] ?? spoonColors[3];

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-[12px] uppercase tracking-[0.05em] text-white/40 font-sans">
          Cognitive load
        </span>
        <span
          className="text-[12px] font-mono font-bold"
          style={{ color }}
        >
          {spoonLabels[value] ?? 'Unknown'} ({value})
        </span>
      </div>
      <div className="relative h-8 flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          aria-label={`Cognitive load: ${spoonLabels[value]}`}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10"
          style={{
            background: `linear-gradient(to right, ${color} ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
          }}
        />
        <div className="absolute inset-x-0 top-0 flex justify-between pointer-events-none px-[2px]">
          {Array.from({ length: max - min + 1 }, (_, i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full transition-colors duration-200"
              style={{
                backgroundColor: i <= value ? color : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
