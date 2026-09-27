import React from 'react';
import type { CSSProperties } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownProps {
  label?: string;
  options?: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  /** Accessible name for the control (defaults to `label`). */
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Dropdown — a native `<select>` on the canon `.select` recipe
 * (appearance:none + chevron). Native select is the accessible equivalent of
 * a custom trigger+menu: keyboard navigation and option semantics come free.
 */
export function Dropdown({ label, options = [], value, onChange, ariaLabel, disabled = false, className = '', style }: DropdownProps) {
  return (
    <label className={`dropdown-field ${className}`.trim()} style={style}>
      {label && <span className="dropdown-field__label">{label}</span>}
      <select
        className="select"
        aria-label={ariaLabel || label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default Dropdown;