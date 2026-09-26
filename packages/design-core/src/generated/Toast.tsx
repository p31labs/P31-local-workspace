/**
 * @file Toast — Transient notification toast for portal feedback.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface ToastProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Toast({ children, className, style }: ToastProps) {
  return <div className={className} style={style}>{children}</div>;
}

export default Toast;
