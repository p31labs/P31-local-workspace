/**
 * @file ThemeToggle — Dark/light theme toggle button. Persists to localStorage.
 * Auto-generated from components.yml.
 *
 * @a2ui-component ThemeToggle
 * @a2ui-props onChange string - Action ID to call on toggle
 * @a2ui-example {"component":"ThemeToggle","onChange":"toggle-theme"}
 */

import { useEffect, useState } from 'react';

export interface ThemeToggleProps {
  className?: string;
  style?: React.CSSProperties;
}

export function ThemeToggle({ className, style }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('p31:theme');
    if (stored) setIsDark(stored === 'dark');
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('p31:theme', next ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-full bg-white/5 border border-white/10 hover:border-white/20 transition-colors ${className || ''}`}
      style={style}
      aria-label="Toggle theme"
    >
      {isDark ? '🌙' : '☀️'}
    </button>
  );
}

export default ThemeToggle;
