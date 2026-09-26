/**
 * @file Card — Generic glass card used across portals for content containers.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ children, className, style }: CardProps) {
  return <div className={className} style={style}>{children}</div>;
}

export default Card;
