import React from 'react';
import type { CSSProperties, ReactNode } from 'react';

export type CardPadding = 'sm' | 'md' | 'lg';

export interface CardProps {
  title?: ReactNode;
  description?: ReactNode;
  /** Container padding scale. */
  padding?: CardPadding;
  /** Interactive affordance (hover lift + accent border — gated by the canon hover rule). */
  interactive?: boolean;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * Card — generic surface card on the `.glass-card` recipe. Optional
 * title/description header + free children. `interactive` enables the
 * glass-card hover lift (accent border + shadow).
 */
export function Card({ title, description, padding = 'md', interactive = false, children, className = '', style }: CardProps) {
  return (
    <div className={`glass-card card card--p-${padding}${interactive ? ' card--interactive' : ''} ${className}`.trim()} style={style}>
      {title && <h3 className="card__title">{title}</h3>}
      {description && <p className="card__desc">{description}</p>}
      {children}
    </div>
  );
}

export default Card;