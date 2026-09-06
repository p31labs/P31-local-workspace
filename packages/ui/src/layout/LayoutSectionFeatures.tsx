import type { ReactNode, CSSProperties } from 'react';

export interface LayoutSectionFeaturesProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  columns?: number;
}

export function LayoutSectionFeatures({ children, className, style, columns }: LayoutSectionFeaturesProps) {
  return (
    <section
      className={`grid ${className || ''}`}
      style={{
        maxWidth: 'var(--p31-max-width-lg)',
        margin: '0 auto',
        paddingLeft: 'var(--p31-space-md)',
        paddingRight: 'var(--p31-space-md)',
        paddingTop: 'var(--p31-space-xl)',
        paddingBottom: 'var(--p31-space-xl)',
        gap: 'var(--p31-space-md)',
        gridTemplateColumns: columns ? `repeat(${columns}, 1fr)` : 'repeat(auto-fill, minmax(280px, 1fr))',
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export default LayoutSectionFeatures;
