import { useEffect, useState, useCallback } from 'react';

export type Lang = 'en' | 'es' | 'fr' | 'de';

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
];

type Dict = Record<string, string>;

// Inline fallbacks for fast first render — JSON files load async
import enInline from './i18n/en.json';
import esInline from './i18n/es.json';
import frInline from './i18n/fr.json';
import deInline from './i18n/de.json';

const DICTS: Record<Lang, Dict> = {
  en: enInline as Dict,
  es: esInline as Dict,
  fr: frInline as Dict,
  de: deInline as Dict,
};

const STORAGE_KEY = 'p31.lang';

function detectLang(): Lang {
  if (typeof navigator === 'undefined') return 'en';
  const navLang = (navigator.language || '').split('-')[0];
  if (navLang === 'es') return 'es';
  if (navLang === 'fr') return 'fr';
  if (navLang === 'de') return 'de';
  return 'en';
}

export function useI18n() {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)) as Lang | null;
    if (stored && DICTS[stored]) {
      setLangState(stored);
    } else {
      const detected = detectLang();
      setLangState(detected);
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, detected);
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, l);
    if (typeof document !== 'undefined') document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const raw = DICTS[lang][key] ?? DICTS.en[key] ?? key;
      if (!vars) return raw;
      return raw.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`));
    },
    [lang],
  );

  return { lang, setLang, t };
}
