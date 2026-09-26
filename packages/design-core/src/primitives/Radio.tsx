import { ReactNode, useId } from 'react';

export interface RadioOption {
  value: string;
  label: ReactNode;
  /** Optional supporting line under the label */
  description?: string;
}

export interface RadioGroupProps {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly RadioOption[];
  /** Group-level accessible label (visually hidden) */
  ariaLabel?: string;
  className?: string;
}

/**
 * Radiogroup rendered with the spoon-dial pattern: large touch targets,
 * visible focus rings, `role="radiogroup"` semantics.
 */
export function RadioGroup({ name, value, onChange, options, ariaLabel, className = '' }: RadioGroupProps) {
  const autoId = useId();
  const groupName = name ?? `p31-radio-${autoId}`;

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={className} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {options.map((opt) => {
        const checked = opt.value === value;
        const itemId = `${groupName}-${opt.value}`;
        return (
          <div key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <span
              role="radio"
              id={itemId}
              tabIndex={checked ? 0 : -1}
              aria-checked={checked}
              className="radio"
              onClick={() => onChange(opt.value)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  onChange(opt.value);
                }
              }}
            >
              <span className="radio-dot" aria-hidden="true" />
            </span>
            <label htmlFor={itemId} className="field-label">
              {opt.label}
              {opt.description && (
                <span style={{ display: 'block', color: 'var(--p31-text-tertiary)', fontSize: 'var(--p31-scale-xs)' }}>
                  {opt.description}
                </span>
              )}
            </label>
          </div>
        );
      })}
    </div>
  );
}
