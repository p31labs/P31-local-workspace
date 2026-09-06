import { TetrahedronGrid } from './TetrahedronGrid';

export interface TetraSectionProps {
  header?: string;
  className?: string;
  children: React.ReactNode;
}

export function TetraSection({ header, className = '', children }: TetraSectionProps) {
  return (
    <div className={className}>
      {header && (
        <div style={{
          fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase'
        }}>
          {header}
        </div>
      )}
      <TetrahedronGrid cols={4} gap="0.333rem">
        {children}
      </TetrahedronGrid>
    </div>
  );
}
