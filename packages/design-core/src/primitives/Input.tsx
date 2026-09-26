import { InputHTMLAttributes, ReactNode, useId } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  /** Visible label — always render it; use `hideLabel` for icon-only fields */
  label?: ReactNode;
  hideLabel?: boolean;
  /** Validation message; sets aria-invalid + aria-describedby */
  error?: string;
  /** Non-blocking helper text */
  hint?: string;
  id?: string;
}

/** Text input with label/error/hint wiring done right by default. */
export function Input({ label, hideLabel, error, hint, id, className = '', ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? `p31-input-${autoId}`;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className={`field-label ${hideLabel ? 'sr-only' : ''}`} style={{ display: 'block', marginBottom: 6 }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="field-error" role="alert">{error}</p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="field-hint">{hint}</p>
      )}
    </div>
  );
}
