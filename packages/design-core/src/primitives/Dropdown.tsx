import { ReactNode, useEffect, useRef, useState } from 'react';

export interface DropdownItem {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface DropdownProps {
  /** Render your own trigger; receives open state for chevrons/aria */
  trigger: (props: { open: boolean }) => ReactNode;
  items: readonly DropdownItem[];
  onSelect: (value: string) => void;
  /** Right-align the menu to the trigger */
  align?: 'left' | 'right';
  /** Accessible name for the menu */
  ariaLabel?: string;
  className?: string;
}

/**
 * Menu with click-outside dismissal and Escape handling.
 * Items are buttons — keyboard focus works without a custom trap.
 */
export function Dropdown({ trigger, items, onSelect, align = 'left', ariaLabel = 'Menu', className = '' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`dropdown ${className}`.trim()}>
      <div
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{ display: 'inline-flex' }}
      >
        {trigger({ open })}
      </div>
      {open && (
        <div role="menu" aria-label={ariaLabel} className={`dropdown-menu ${align === 'right' ? 'dropdown-menu-right' : ''}`}>
          {items.map((item) => (
            <button
              key={item.value}
              role="menuitem"
              className="dropdown-item"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                onSelect(item.value);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
