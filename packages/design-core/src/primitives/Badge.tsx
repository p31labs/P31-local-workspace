import { ReactNode } from 'react';

export type BadgeTone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

const TONE = {
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  info: 'badge-info',
  neutral: '',
} as const;

/** Compact status label. Crisis mode keeps colors but forces opaque surfaces. */
export function Badge({ tone = 'neutral', children, className = '' }: BadgeProps) {
  return <span className={`badge ${TONE[tone]} ${className}`.trim()}>{children}</span>;
}
