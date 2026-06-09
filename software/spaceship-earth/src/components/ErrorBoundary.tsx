// spaceship-earth/src/components/ErrorBoundary.tsx
// Thin wrapper around @p31/shared ErrorBoundary with project-specific styling.
import type { ComponentType, ReactNode } from 'react';
import { ErrorBoundary as SharedErrorBoundaryImpl } from '@p31/shared/ui';

// React 19 strict typing requires `refs` on class components; cast to functional-compatible type.
const SharedErrorBoundary = SharedErrorBoundaryImpl as unknown as ComponentType<{
  fallback: (error: Error) => ReactNode;
  children: ReactNode;
}>;

function ErrorFallback(error: Error) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000000',
      color: '#d8ffd8',
      fontFamily: "'JetBrains Mono', monospace",
      gap: 16,
      padding: 32,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 32 }}>&#x26A0;</div>
      <h1 style={{ fontSize: 16, letterSpacing: 2, color: '#ff4466' }}>
        SYSTEM ERROR
      </h1>
      <p style={{ fontSize: 12, color: '#3a7a3a', maxWidth: 360, lineHeight: 1.6 }}>
        {error.message}
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: 8,
          padding: '10px 24px',
          background: 'rgba(0, 255, 255, 0.08)',
          border: '1px solid rgba(0, 255, 255, 0.3)',
          borderRadius: 6,
          color: '#00FFFF',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          letterSpacing: 1,
          cursor: 'pointer',
          minHeight: 48,
        }}
      >
        RELOAD
      </button>
    </div>
  );
}

export function ErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <SharedErrorBoundary fallback={ErrorFallback}>
      {children}
    </SharedErrorBoundary>
  );
}
