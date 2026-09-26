import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  /** Called with the selected item id. The shell owns navigation. */
  onSelect: (id: string) => void;
  placeholder?: string;
  leadingIcon?: ReactNode;
}

/**
 * Router-agnostic command palette. Filters + keyboard nav included;
 * the shell supplies items and decides what selecting means.
 */
export function CommandPalette({
  open,
  onClose,
  items,
  onSelect,
  placeholder = 'Search…',
  leadingIcon,
}: CommandPaletteProps) {
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
      const haystack = `${s.label} ${s.description ?? ''} ${s.keywords ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [items, query]);

  const run = (id: string) => {
    onSelect(id);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = results[active];
      if (target) run(target.id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="cmdk-overlay" onClick={onClose} role="presentation">
      <div
        className="cmdk-panel"
        role="dialog"
        aria-label="Command palette"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cmdk-input-row">
          {leadingIcon}
          <input
            ref={inputRef}
            className="cmdk-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            aria-label={placeholder}
          />
          <kbd className="cmdk-kbd">esc</kbd>
        </div>
        <ul className="cmdk-list" role="listbox" aria-label="Results">
          {results.map((s, i) => (
            <li key={s.id}>
              <button
                className={`cmdk-item${i === active ? ' is-active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => run(s.id)}
                role="option"
                aria-selected={i === active}
              >
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