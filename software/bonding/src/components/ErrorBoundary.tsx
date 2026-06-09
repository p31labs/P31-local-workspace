// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// ErrorBoundary: catches unhandled React errors
//
// WCD-CC03: Wraps <App /> in main.tsx. Shows a friendly
// "Something came loose" fallback instead of a white screen.
// ═══════════════════════════════════════════════════════

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[BONDING] Unhandled error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#000000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            fontFamily: 'JetBrains Mono, monospace',
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          <p style={{ fontSize: 48, margin: 0 }}>{'\u2697\uFE0F'}</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
            Something came loose
          </p>
          <p style={{ fontSize: 13, opacity: 0.4, margin: 0 }}>
            The molecule engine hit an unexpected state.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            style={{
              marginTop: 16,
              padding: '12px 32px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12,
              color: 'rgba(255,255,255,0.7)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
