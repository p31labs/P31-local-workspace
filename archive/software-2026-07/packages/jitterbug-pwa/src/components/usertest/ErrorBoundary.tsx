import React from 'react';

export class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode; label?: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; label?: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel p-4 text-cloud text-sm" role="alert">
          {this.props.label || 'This view'} could not be displayed.
        </div>
      );
    }
    return this.props.children;
  }
}
