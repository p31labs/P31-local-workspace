import { ReactNode } from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  /** Accessible loading label; rendered visually hidden */
  label?: string;
  className?: string;
}

const SIZE = { sm: 'spinner-sm', md: 'spinner-md', lg: 'spinner-lg' } as const;

/** Loading indicator. Animation is disabled under reduced-motion and crisis mode. */
export function Spinner({ size = 'md', label = 'Loading', className = '' }: SpinnerProps) {
  return (
    <span className={className} style={{ display: 'inline-flex' }} role="status">
      <span className={`spinner ${SIZE[size]}`} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export type { ReactNode };
