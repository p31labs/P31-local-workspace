import type { ReactNode, CSSProperties } from 'react';

export interface LayoutFooterProps {
  children?: ReactNode;
  copyright?: string;
  className?: string;
  style?: CSSProperties;
}

export function LayoutFooter({ children, copyright, className, style }: LayoutFooterProps) {
  return (
    <footer
      className={`flex flex-col ${className || ''}`}
      style={{
        maxWidth: 'var(--p31-max-width-xl)',
        margin: '0 auto',
        paddingLeft: 'var(--p31-space-md)',
        paddingRight: 'var(--p31-space-md)',
        paddingTop: 'var(--p31-space-md)',
        paddingBottom: 'var(--p31-space-md)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        ...style,
      }}
    >
      {children && <div className="flex-1">{children}</div>}
      {copyright && (
        <div
          className="mt-6 pt-4 text-xs"
          style={{
            color: 'var(--p31-text-tertiary, rgba(245,245,247,0.3))',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {copyright}
        </div>
      )}
    </footer>
  );
}

export default LayoutFooter;
