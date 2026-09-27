import React from 'react';
import type { CSSProperties, ReactNode } from 'react';

export interface CandyHeaderProps {
  eyebrow?: ReactNode;
  title?: ReactNode;
  lede?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * CandyHeader — a page header in a candy-rounded glass pill. Eyebrow + title
 * + lede, on the `.candy-header` recipe (large-radius, glass surface).
 */
export function CandyHeader({ eyebrow, title, lede, className = '', style }: CandyHeaderProps) {
  return (
    <header className={`candy-header ${className}`.trim()} style={style}>
      {eyebrow && <p className="candy-header__eyebrow">{eyebrow}</p>}
      <h2 className="candy-header__title">{title}</h2>
      {lede && <p className="candy-header__lede">{lede}</p>}
    </header>
  );
}

export default CandyHeader;