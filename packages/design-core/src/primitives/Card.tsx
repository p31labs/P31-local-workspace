import { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  /** Padding scale token suffix (sm | md | lg | xl) */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Interactive cards get hover elevation */
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}

const PAD = { none: '0', sm: 'var(--p31-space-sm)', md: 'var(--p31-space-md)', lg: 'var(--p31-space-lg)', xl: 'var(--p31-space-xl)' };

/** Elevated glass surface. Use `interactive` for click-through cards. */
export function Card({ children, padding = 'md', interactive = false, className = '', onClick }: CardProps) {
  return (
    <div
      className={`glass-card ${interactive ? 'glass-card-hover' : ''} ${className}`.trim()}
      style={{ padding: PAD[padding], cursor: interactive ? 'pointer' : undefined }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
