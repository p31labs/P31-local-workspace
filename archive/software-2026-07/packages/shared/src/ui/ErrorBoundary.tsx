// ErrorBoundary — render-prop pattern. Catches React render errors.
// Style is injected by the consumer via the `fallback` prop.
//
// Usage:
//   <ErrorBoundary fallback={(error, reset) => <MyErrorUI error={error} onReset={reset} />}>
//     <App />
//   </ErrorBoundary>

import type { ReactNode, ErrorInfo } from 'react';
import { Component } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Render function called when an error is caught. */
  fallback: (error: Error, reset: () => void) => ReactNode;
  /** Optional callback when an error is caught (e.g. for telemetry). */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error, this.reset);
    }
    return this.props.children;
  }
}
