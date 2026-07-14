import { useEffect, useState, useCallback } from 'react';

export type Lang = 'en' | 'es' | 'fr' | 'de';

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
];

type Dict = Record<string, string>;

const en: Dict = {
  'portal.title': 'P31 Care Mesh — Join',
  'portal.subtitle': 'Self-service onboarding for your family.',
  'portal.enterDid': 'Enter your family DID',
  'portal.check': 'Check status',
  'portal.invalidDid': 'Please enter a valid DID (e.g. did:web:family.example).',
  'portal.loading': 'Checking…',
  'portal.notFound': 'We could not find that DID. Ask your community steward for an invite.',
  'portal.step': 'Step',
  'portal.invited': 'Invited',
  'portal.onboarded': 'Onboarded',
  'portal.registered': 'Registered',
  'portal.lang': 'Language',
  'portal.start': 'Begin onboarding',
  'portal.done': 'You are all set. Welcome to the mesh.',
};

const es: Dict = {
  'portal.title': 'Malla de Cuidado P31 — Únete',
  'portal.subtitle': 'Alta autogestionada para tu familia.',
  'portal.enterDid': 'Introduce el DID de tu familia',
  'portal.check': 'Comprobar estado',
  'portal.invalidDid': 'Introduce un DID válido (p. ej. did:web:family.example).',
  'portal.loading': 'Comprobando…',
  'portal.notFound': 'No encontramos ese DID. Pide una invitación a tu guía comunitario.',
  'portal.step': 'Paso',
  'portal.invited': 'Invitado',
  'portal.onboarded': 'Dado de alta',
  'portal.registered': 'Registrado',
  'portal.lang': 'Idioma',
  'portal.start': 'Empezar alta',
  'portal.done': 'Todo listo. Bienvenido/a a la malla.',
};

const fr: Dict = {
  'portal.title': 'Maillage de Soin P31 — Rejoignez',
  'portal.subtitle': 'Intégration autonome pour votre famille.',
  'portal.enterDid': 'Saisissez le DID de votre famille',
  'portal.check': 'Vérifier l’état',
  'portal.invalidDid': 'Saisissez un DID valide (ex. did:web:family.example).',
  'portal.loading': 'Vérification…',
  'portal.notFound': 'DID introuvable. Demandez une invitation à votre référent·e.',
  'portal.step': 'Étape',
  'portal.invited': 'Invité',
  'portal.onboarded': 'Intégré',
  'portal.registered': 'Inscrit',
  'portal.lang': 'Langue',
  'portal.start': 'Commencer',
  'portal.done': 'C’est fait. Bienvenue dans le maillage.',
};

const de: Dict = {
  'portal.title': 'P31-Fürsorgenetz — Mitmachen',
  'portal.subtitle': 'Selbstbediente Aufnahme für deine Familie.',
  'portal.enterDid': 'Familien-DID eingeben',
  'portal.check': 'Status prüfen',
  'portal.invalidDid': 'Bitte gültigen DID eingeben (z. B. did:web:family.example).',
  'portal.loading': 'Prüfe…',
  'portal.notFound': 'DID nicht gefunden. Bitte um eine Einladung bei deiner/m Mentor/in.',
  'portal.step': 'Schritt',
  'portal.invited': 'Eingeladen',
  'portal.onboarded': 'Aufgenommen',
  'portal.registered': 'Registriert',
  'portal.lang': 'Sprache',
  'portal.start': 'Aufnahme starten',
  'portal.done': 'Fertig. Willkommen im Netz.',
};

const DICTS: Record<Lang, Dict> = { en, es, fr, de };

const STORAGE_KEY = 'p31.lang';

export function useI18n() {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)) as Lang | null;
    if (stored && DICTS[stored]) setLangState(stored);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, l);
    if (typeof document !== 'undefined') document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: string) => DICTS[lang][key] ?? DICTS.en[key] ?? key,
    [lang],
  );

  return { lang, setLang, t };
}
