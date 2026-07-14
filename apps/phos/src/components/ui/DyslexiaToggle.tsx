import React, { useEffect, useState } from 'react';

interface DyslexiaToggleProps {
  className?: string;
}

/**
 * DyslexiaToggle — dyslexia-friendly typography toggle.
 * Increases line-height and letter-spacing. Optionally swaps to OpenDyslexic.
 * Persisted to localStorage.
 */
export function DyslexiaToggle({ className = '' }: DyslexiaToggleProps) {
  const [active, setActive] = useState(false);
  const [useOpenDyslexic, setUseOpenDyslexic] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('p31-dyslexia');
    if (stored === 'true') setActive(true);
    const fontStored = localStorage.getItem('p31-dyslexia-font');
    if (fontStored === 'opendyslexic') setUseOpenDyslexic(true);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-dyslexia', String(active));
    localStorage.setItem('p31-dyslexia', String(active));
  }, [active]);

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-dyslexia-font',
      useOpenDyslexic ? 'opendyslexic' : 'default'
    );
    localStorage.setItem('p31-dyslexia-font', useOpenDyslexic ? 'opendyslexic' : 'default');
  }, [useOpenDyslexic]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="sr-only peer"
          aria-label="Toggle dyslexia-friendly typography"
        />
        <span className="w-10 h-6 rounded-full bg-white/10 peer-checked:bg-quantum-violet/40 transition-colors relative">
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white/60 transition-transform ${
              active ? 'translate-x-4' : ''
            }`}
          />
        </span>
        <span className="text-[12px] text-white/60 font-sans">Dyslexia mode</span>
      </label>

      {active && (
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={useOpenDyslexic}
            onChange={(e) => setUseOpenDyslexic(e.target.checked)}
            className="sr-only peer"
            aria-label="Use OpenDyslexic font"
          />
          <span className="w-8 h-4 rounded-full bg-white/10 peer-checked:bg-quantum-violet/40 transition-colors relative">
            <span
              className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white/60 transition-transform ${
                useOpenDyslexic ? 'translate-x-4' : ''
              }`}
            />
          </span>
          <span className="text-[10px] text-white/40 font-sans">OpenDyslexic</span>
        </label>
      )}
    </div>
  );
}
