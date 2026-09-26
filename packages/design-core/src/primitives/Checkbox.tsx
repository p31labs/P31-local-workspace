import { InputHTMLAttributes, ReactNode, useId } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  label: ReactNode;
  /** Indeterminate state renders a dash; sets aria-checked="mixed" */
  indeterminate?: boolean;
  id?: string;
}

/**
 * Glass-styled checkbox. Native `<input type="checkbox">` underneath —
 * forms, labels and assistive tech behave exactly like the platform.
 */
export function Checkbox({ label, indeterminate = false, id, className = '', ...props }: CheckboxProps) {
  const autoId = useId();
  const cbxId = id ?? `p31-cbx-${autoId}`;

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <span
        className="checkbox"
        {...(!('id' in props) ? {} : {})}
        data-indeterminate={indeterminate || undefined}
      >
        <input
          id={cbxId}
          type="checkbox"
          className="sr-only"
          ref={(el) => {
            if (el) el.indeterminate = indeterminate;
          }}
          {...props}
        />
        <span className="checkbox-box" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            {indeterminate ? <path d="M5 12h14" /> : <path d="M20 6L9 17l-5-5" />}
          </svg>
        </span>
      </span>
      <label htmlFor={cbxId} className="field-label">{label}</label>
    </div>
  );
}
