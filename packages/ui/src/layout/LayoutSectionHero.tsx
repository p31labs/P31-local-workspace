import type { ReactNode, CSSProperties } from 'react';

export interface LayoutSectionHeroProps {
  children: ReactNode;
  title?: string;
  className?: string;
  style?: CSSProperties;
}

export function LayoutSectionHero({ children, title, className, style }: LayoutSectionHeroProps) {
  return (
    <section
      className={`flex flex-col ${className || ''}`}
      style={{
        maxWidth: 'var(--p31-max-width-lg)',
        margin: '0 auto',
        paddingLeft: 'var(--p31-space-md)',
        paddingRight: 'var(--p31-space-md)',
        paddingTop: '11px',
        paddingBottom: '48px',
        gap: 'var(--p31-space-md)',
        ...style,
      }}
    >
      {title && (
        <h2 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--p31-text, #F5F5F7)', lineHeight: '1.2' }}>
          {title}
        </h2>
      )}
      <div>{children}</div>
    </section>
  );
}

export default LayoutSectionHero;
