/**
 * @file BrandMark — Shared P31 brand glyph for all app headers.
 * Gradient rounded square + "P31 <appName>" + optional tagline.
 * Visual contract across PHOS / WILLOW / phosphorus31 / p31ca.
 */

import type { CSSProperties } from 'react';

export interface BrandMarkProps {
  appName: string;
  tagline?: string;
  icon?: string;
  className?: string;
  style?: CSSProperties;
}

export function BrandMark({ appName, tagline, icon = '⬦', className = '', style }: BrandMarkProps) {
  return (
    <span className={`flex items-center gap-3 group ${className}`} style={{ textDecoration: 'none', ...style }}>
      <span
        className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm text-void shrink-0"
        style={{
          background: 'linear-gradient(135deg, var(--p31-accent-gold, #FBBF24), var(--p31-accent, #00F0FF))',
          boxShadow: 'var(--p31-glow-cyan, 0 0 12px rgba(0,255,255,0.4))',
        }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="leading-none">
        <span className="text-base font-bold text-ink tracking-tight">
          P31 <span className="text-quantum-violet">{(appName || '').toUpperCase()}</span>
        </span>
        {tagline && (
          <span className="hidden lg:block text-mist text-[9px] font-mono tracking-[0.14em] mt-0.5">
            {tagline}
          </span>
        )}
      </span>
    </span>
  );
}

export default BrandMark;
