import type { ReactNode, CSSProperties } from 'react';

export interface LayoutPageProps {
  children: ReactNode;
  headerSlot?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function LayoutPage({ children, headerSlot, className, style }: LayoutPageProps) {
  return (
    <div
      className={`flex flex-col ${className || ''}`}
      style={{
        maxWidth: 'var(--p31-max-width-lg)',
        margin: '0 auto',
        paddingLeft: 'var(--p31-space-md)',
        paddingRight: 'var(--p31-space-md)',
        gap: 'var(--p31-space-lg)',
        ...style,
      }}
    >
      {headerSlot && <div className="flex-shrink-0">{headerSlot}</div>}
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  );
}

export default LayoutPage;
