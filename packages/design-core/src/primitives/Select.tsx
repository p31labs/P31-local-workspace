import { ReactNode, SelectHTMLAttributes, useId } from 'react';

export interface SelectOption {
  value: string;
  label: ReactNode;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'children'> {
  label?: ReactNode;
  hideLabel?: boolean;
  options: readonly SelectOption[];
  /** Validation message */
  error?: string;
  id?: string;
}

/** Native select styled with the glass recipe — keyboard/mobile behavior intact. */
export function Select({ label, hideLabel, options, error, id, className = '', ...props }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? `p31-select-${autoId}`;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className={`field-label ${hideLabel ? 'sr-only' : ''}`} style={{ display: 'block', marginBottom: 6 }}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        className="select"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${selectId}-error` : undefined}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && (
        <p id={`${selectId}-error`} className="field-error" role="alert">{error}</p>
      )}
    </div>
  );
}
