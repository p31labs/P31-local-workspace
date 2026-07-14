import React from 'react';
import { LANGS, type Lang } from '../lib/i18n';

export function LangSwitcher({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex gap-2 text-sm" aria-label="Language">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          aria-pressed={lang === l.code}
          onClick={() => onChange(l.code)}
          className={`px-2 py-1 rounded ${lang === l.code ? 'bg-quantum-cyan/20 text-quantum-cyan' : 'text-white/60'}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
