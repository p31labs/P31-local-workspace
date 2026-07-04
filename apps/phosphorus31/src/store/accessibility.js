import { atom } from 'nanostores';

const STORAGE_KEY = 'p31_dyslexia_mode';

function applyDyslexiaClass(on) {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle('dyslexia-mode', on);
}

export const isDyslexic = atom(false);

export function initDyslexiaState() {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const on = stored === '1';
    isDyslexic.set(on);
    applyDyslexiaClass(on);
  } catch {
    /* no localStorage in private mode, etc. */
  }
}

export function toggleDyslexia() {
  if (typeof window === 'undefined') return;
  const next = !isDyslexic.get();
  isDyslexic.set(next);
  try {
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
  } catch {
    /* ignore */
  }
  applyDyslexiaClass(next);
}
