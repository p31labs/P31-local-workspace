/**
 * @file OverlayErrorBoundary — React error boundary for full-screen room overlays.
 *
 * Wraps each overlay in SovereignShell. Catches unhandled render/lifecycle
 * errors from overlay components (LLM responses, Three.js FFTs, Babel eval)
 * without taking down the entire app — user can still navigate away.
 *
 * Error reporting: captured to localStorage under "p31-errors" (ring buffer,
 * max 20 entries) with timestamp, overlay name, message, and stack.
 * No external network call — sovereignty stays intact.
 *
 * Usage:
 *   <OverlayErrorBoundary name="COPILOT">
 *     <BrainOverlay />
 *   </OverlayErrorBoundary>
 */

import React from 'react';

interface Props {
  name: string;
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

const NEON  = '#00FFFF';
const ROSE  = '#FF3355';
const VOID  = '#030308';
const MAX_LOG_ENTRIES = 20;

function logError(name: string, error: Error): void {
  try {
    const existing: unknown[] = JSON.parse(localStorage.getItem('p31-errors') ?? '[]');
    const entry = {
      ts: new Date().toISOString(),
      overlay: name,
      message: error.message,
      stack: error.stack?.slice(0, 800) ?? '',
    };
    const updated = [entry, ...existing].slice(0, MAX_LOG_ENTRIES);
    localStorage.setItem('p31-errors', JSON.stringify(updated));
  } catch {
    // localStorage may be unavailable (private mode, quota)
  }
}

export class OverlayErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    logError(this.props.name, error);
    console.error(`[OverlayErrorBoundary] ${this.props.name}:`, error, info.componentStack);
  }

  handleReset = (): void => {
    this.setState({ error: null });
  };

  override render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: VOID,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 32, gap: 16,
        fontFamily: "'Space Mono', monospace",
      }}>
        <div style={{ fontSize: 28, color: ROSE }}>⚠</div>
        <div style={{ fontSize: 14, color: ROSE, letterSpacing: 2, textTransform: 'uppercase' }}>
          {this.props.name} ERROR
        </div>
        <div style={{
          fontSize: 11, color: 'rgba(255,255,255,0.4)',
          maxWidth: 420, textAlign: 'center', lineHeight: 1.6,
        }}>
          {/* Suppress implementation details in production — OWASP A09 */}
          {import.meta.env.DEV ? error.message : 'An unexpected error occurred in this module.'}
        </div>
        {import.meta.env.DEV && (
          <div style={{
            fontSize: 10, color: 'rgba(255,255,255,0.2)',
            maxWidth: 420, textAlign: 'center', lineHeight: 1.5,
            overflow: 'hidden', maxHeight: 80,
          }}>
            {error.stack?.split('\n').slice(1, 4).join(' · ')}
          </div>
        )}
        <button
          type="button"
          onClick={this.handleReset}
          style={{
            marginTop: 8,
            background: 'transparent',
            border: `1px solid ${NEON}44`,
            color: NEON,
            padding: '10px 20px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12,
            letterSpacing: 1.5,
            fontFamily: 'inherit',
          }}
        >
          RETRY
        </button>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', letterSpacing: 1 }}>
          Error logged to localStorage → p31-errors
        </div>
      </div>
    );
  }
}
