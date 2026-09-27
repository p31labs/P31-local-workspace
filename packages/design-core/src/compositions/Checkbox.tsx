import React from 'react';
import type { CSSProperties } from 'react';

export interface CheckboxProps {
  label?: string;
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  style?: CSSProperties;
}

const CHECK_SVG =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';
const MIXED_SVG =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12"/></svg>';

/**
 * Checkbox — accessible checkbox on the canon `.checkbox` form recipe.
 * Renders a `<button aria-checked>` (tri-state: true/false/mixed) with a
 * check/dash glyph. The 44px touch target comes from the form recipe.
 */
export function Checkbox({ label, checked = false, indeterminate = false, disabled = false, onChange, className = '', style }: CheckboxProps) {
  const state = indeterminate ? 'mixed' : checked ? 'true' : 'false';
  const glyph = indeterminate ? MIXED_SVG : checked ? CHECK_SVG : '';
  return (
    <label className={`checkbox-field ${className}`.trim()} style={style}>
      <button
        type="button"
        role="checkbox"
        className="checkbox"
        aria-checked={state}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
      >
        <span className="checkbox-box" dangerouslySetInnerHTML={{ __html: glyph }} />
      </button>
      {label && <span className="checkbox-field__label">{label}</span>}
    </label>
  );
}

export default Checkbox;