/**
 * @file CommandPalette — Keyboard-friendly command palette.
 * Auto-generated from components.yml. Controlled open state; shell owns item actions.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  keywords?: string;
}

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
  onSelect: (id: string) => void;
  placeholder?: string;
  leadingIcon?: ReactNode;
}

export function CommandPalette({ open, onClose, items, onSelect, placeholder = 'Search…', leadingIcon }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((s) => {
      if (!q) return true;
      return `${s.label} ${s.description ?? ''} ${s.keywords ?? ''}`.toLowerCase().includes(q);
    });
  }, [items, query]);

  const run = (id: string) => { onSelect(id); onClose(); };

  if (!open) return null;

  return (
    <div className="cmdk-overlay" onClick={onClose} role="presentation">
      <div className="cmdk-panel" role="dialog" aria-label="Command palette" aria-modal="true"
        onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-input-row">
          {leadingIcon}
          <input ref={inputRef} className="cmdk-input" value={query}
            onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
          <kbd className="cmdk-kbd">esc</kbd>
        </div>
        <ul className="cmdk-list" role="listbox" aria-label="Results">
          {results.map((s, i) => (
            <li key={s.id}>
              <button className={`cmdk-item${i === active ? ' is-active' : ''}`}
                onMouseEnter={() => setActive(i)} onClick={() => run(s.id)}
                role="option" aria-selected={i === active}>
                {s.icon}
                <span className="cmdk-label">{s.label}</span>
                {s.description && <span className="cmdk-path">{s.description}</span>}
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="cmdk-empty">No matches.</li>}
        </ul>
      </div>
    </div>
  );
}

export default CommandPalette;
