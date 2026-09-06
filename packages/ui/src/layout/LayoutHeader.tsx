import type { ReactNode, CSSProperties } from 'react';

export interface LayoutHeaderProps {
  brandSlot: ReactNode;
  navSlot?: ReactNode;
  actionsSlot?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function LayoutHeader({ brandSlot, navSlot, actionsSlot, className, style }: LayoutHeaderProps) {
  return (
    <header
      className={`flex items-center justify-between ${className || ''}`}
      style={{
        height: 'var(--p31-header-h)',
        paddingTop: 'var(--p31-space-xs)',
        paddingBottom: 'var(--p31-space-xs)',
        gap: 'var(--p31-space-sm)',
        maxWidth: 'var(--p31-max-width-xl)',
        margin: '0 auto',
        ...style,
      }}
    >
      <div style={{ flex: '0 0 auto' }}>{brandSlot}</div>
      {navSlot && (
        <nav style={{ flex: '1 1 auto', display: 'flex', justifyContent: 'center' }}>
          {navSlot}
        </nav>
      )}
      <div style={{ flex: '0 0 auto' }}>{actionsSlot}</div>
    </header>
  );
}

export default LayoutHeader;
