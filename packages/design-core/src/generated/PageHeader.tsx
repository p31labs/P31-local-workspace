/**
 * @file PageHeader — Inner-page hero: mono eyebrow, gradient title, lede.
 * Auto-generated from components.yml.
 */

import type { ReactNode, CSSProperties } from 'react';

export interface PageHeaderProps {
  eyebrow: string;
  title: string;
  lede?: string;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function PageHeader({ eyebrow, title, lede, children, className = '', style }: PageHeaderProps) {
  return (
    <header className={`page-header-route ${className}`.trim()} style={style}>
      <span className="hero-eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {lede && <p className="page-lede">{lede}</p>}
      {children && <div className="page-actions">{children}</div>}
    </header>
  );
}

export default PageHeader;
