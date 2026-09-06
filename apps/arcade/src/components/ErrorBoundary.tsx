import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Arcade ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 32, minHeight: 200, fontFamily: 'monospace',
          background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(251,113,133,0.3)',
        }}>
          <div style={{ color: '#FB7185', fontSize: 14, marginBottom: 8 }}>Game crashed</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 16, textAlign: 'center', maxWidth: 400 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </div>
          <button
            onClick={this.handleReset}
            style={{
              padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.3)',
              background: 'rgba(0,240,255,0.1)', color: '#00F0FF', cursor: 'pointer',
              fontSize: 12, fontFamily: 'monospace',
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
