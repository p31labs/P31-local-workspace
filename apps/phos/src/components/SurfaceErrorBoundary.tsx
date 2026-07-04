import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  surfaceName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SurfaceErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[PHOS:ErrorBoundary] ${this.props.surfaceName || 'unknown'}:`, error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="p-6 border border-dashed border-amber-900/40 bg-amber-950/10 rounded-xl text-center space-y-3" role="alert">
          <p className="font-mono text-xs text-amber-400 uppercase tracking-widest">
            SURFACE_ERROR // {this.props.surfaceName || 'UNKNOWN'}
          </p>
          <p className="font-mono text-[10px] text-amber-500/70 max-w-xs mx-auto">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-1.5 text-[10px] font-mono border border-amber-800/40 text-amber-400 rounded hover:bg-amber-900/20 uppercase tracking-widest"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
