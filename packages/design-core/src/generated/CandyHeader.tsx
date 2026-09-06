/**
 * @file CandyHeader — Canonical P31 candy-pill header bar.
 * Auto-generated from components.yml.
 *
 * @a2ui-component CandyHeader
 * @a2ui-props children ReactNode - Header contents
 * @a2ui-example {"component":"CandyHeader","children":[{"component":"Crown","brand":"p31ca"}]}
 */

import type { ReactNode } from 'react';

export interface CandyHeaderProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function CandyHeader({ children, className, style }: CandyHeaderProps) {
  const cls = `fixed top-3 left-0 right-0 z-40 ${className || ''}`;
  return (
    <header className={cls} style={style}>
      <div className="max-w-[1440px] mx-auto px-4 py-1 rounded-2xl border border-cyan/80 bg-[rgba(57,255,20,0.12)] backdrop-blur-md shadow-[0_0_30px_rgba(0,240,255,0.25),inset_0_0_20px_rgba(57,255,20,0.15)]">
        {children}
      </div>
    </header>
  );
}

export default CandyHeader;
