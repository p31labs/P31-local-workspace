import { persistentMap } from '@nanostores/persistent';

export type AccessibilityState = {
  dyslexiaMode: boolean;
  dyslexiaFont: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
};

// @ts-ignore — persistentMap constraint is string-only but we use booleans (fine at runtime)
export const accessibilityStore = persistentMap<AccessibilityState>('phos:accessibility:', {
  dyslexiaMode: false,
  dyslexiaFont: false,
  reducedMotion: false,
  highContrast: false,
  fontSize: 'medium',
});

accessibilityStore.subscribe((value: AccessibilityState) => {
  document.documentElement.dataset.dyslexia = value.dyslexiaMode ? 'true' : 'false';
  document.documentElement.dataset.dyslexiaFont = value.dyslexiaFont ? 'opendyslexic' : 'none';
  document.documentElement.dataset.reducedMotion = value.reducedMotion ? 'true' : 'false';

  if (value.fontSize === 'large') {
    document.documentElement.style.fontSize = '1.25rem';
  } else if (value.fontSize === 'small') {
    document.documentElement.style.fontSize = '0.875rem';
  } else {
    document.documentElement.style.fontSize = '1rem';
  }
});
