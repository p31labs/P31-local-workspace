import React from 'react';
import type { ReactNode, CSSProperties } from 'react';

export interface GlassCardProps {
  children?: ReactNode;
  className?: string;
  /** Use stronger glass opacity (spec). */
  strong?: boolean;
  style?: CSSProperties;
  /** @deprecated use <GlassCard strong> with a wrapping <a> instead */
  href?: string;
  /** @deprecated use wrapping element onClick instead */
  onClick?: () => void;
}

export function GlassCard({ children, className = '', strong = false, style, href, onClick }: GlassCardProps) {
  const classes = [
    strong ? 'glass-strong' : 'glass-card',
    className,
  ].filter(Boolean).join(' ');

  if (href) {
    return (
      <a href={href} className={classes} style={style} onClick={onClick as any}>
        {children}
      </a>
    );
  }

  return <div className={classes} style={style}>{children}</div>;
}

export default GlassCard;
