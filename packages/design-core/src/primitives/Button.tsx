import { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  /** Size ladder — md/lg meet WCAG touch-target minimums */
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  /** Shows inline spinner + aria-busy, suppresses clicks */
  isLoading?: boolean;
  children: ReactNode;
  className?: string;
}

const VARIANT = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
} as const;

const SIZE = { sm: 'btn-sm', md: 'btn-md', lg: 'btn-lg' } as const;

/** Canonical action button. Crisis mode strips transform/shadow automatically. */
export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  isLoading = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn ${VARIANT[variant]} ${SIZE[size]} ${className}`.trim()}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="spinner-inline" aria-hidden="true" />
          <span className="sr-only">Loading…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
