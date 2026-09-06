import type { ReactNode } from 'react';

export interface TetrahedronGridProps {
  cols?: 2 | 3 | 4;
  gap?: string;
  children: ReactNode;
}

export function TetrahedronGrid({ cols = 4, gap = 'var(--p31-tetra-overlap, 0.333rem)', children }: TetrahedronGridProps) {
  const gridTemplateColumns = {
    2: 'repeat(2, 1fr)',
    3: 'repeat(3, 1fr)',
    4: 'repeat(4, 1fr)',
  }[cols];

  return (
    <div
      className="tetra-grid"
      style={{
        display: 'grid',
        gridTemplateColumns,
        gap,
      }}
    >
      {children}
    </div>
  );
}
