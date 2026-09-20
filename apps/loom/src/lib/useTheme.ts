/**
 * The Loom — theme selection.
 *
 * Presentation-layer state, like the profile store: lives in localStorage, not
 * the log. Cycles through the canon themes (cipher … family); the active id is
 * written as data-theme on .loom-shell so the canon token blocks apply.
 */
import { useCallback, useState } from 'react';
import { THEMES, THEME_IDS, type ThemeId } from '@p31/canon/theming/theme-store';

const STORAGE_KEY = 'loom:theme';

function initialTheme(): ThemeId {
  if (typeof localStorage === 'undefined') return 'family';
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && (THEME_IDS as readonly string[]).includes(saved)) return saved as ThemeId;
  return 'family';
}

export interface ThemeEntry {
  id: ThemeId;
  label: string;
  emoji: string;
}

export interface UseTheme {
  theme: ThemeId;
  current: ThemeEntry;
  setTheme: (t: ThemeId) => void;
  cycleTheme: () => void;
  themes: readonly ThemeEntry[];
}

export function useTheme(): UseTheme {
  const [theme, setThemeState] = useState<ThemeId>(initialTheme);

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t);
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, t);
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = THEME_IDS[(THEME_IDS.indexOf(prev) + 1) % THEME_IDS.length];
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const themes: readonly ThemeEntry[] = THEME_IDS.map((id) => ({
    id,
    label: THEMES[id].label,
    emoji: THEMES[id].emoji,
  }));

  return { theme, current: themes.find((t) => t.id === theme) ?? themes[0], setTheme, cycleTheme, themes };
}
