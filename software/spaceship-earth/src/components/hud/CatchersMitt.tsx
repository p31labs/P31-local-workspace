/**
 * @file CatchersMitt.tsx — Inbound batching HUD component
 * 
 * Visualizes buffered signals from the Catcher's Mitt temporal window.
 * Displays gentle pulsing indicator instead of flashing incoming data.
 * 
 * CWP-JITTERBUG-11: The Catcher's Mitt
 */
import { useEffect, useState } from 'react';
import { useNotificationStore, startCatchersMittTimer, stopCatchersMittTimer } from '../../store/notificationStore';

export function CatchersMitt() {
  const pendingCount = useNotificationStore((s) => s.pendingQueue.length);
  const activeDisplay = useNotificationStore((s) => s.activeDisplay);
  const lastFlush = useNotificationStore((s) => s.lastFlush);
  const isManualOverride = useNotificationStore((s) => s.isManualOverride);
  const flushBuffer = useNotificationStore((s) => s.flushBuffer);
  const [pulsePhase, setPulsePhase] = useState(0);

  // Start auto-flush timer on mount
  useEffect(() => {
    startCatchersMittTimer();
    return () => stopCatchersMittTimer();
  }, []);

  // Gentle pulse animation for buffered count
  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase((p) => (p + 0.1) % (Math.PI * 2));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Don't render if nothing buffered
  if (pendingCount === 0 && activeDisplay.length === 0) {
    return null;
  }

  const timeSinceFlush = Date.now() - lastFlush;
  const secondsUntilFlush = Math.max(0, 60 - Math.floor(timeSinceFlush / 1000));

  // Pulse intensity based on pending count
  const pulseOpacity = 0.4 + Math.sin(pulsePhase) * 0.2 + (Math.min(pendingCount, 10) / 10) * 0.4;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '20px',
        zIndex: 100,
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#4db8a8',
        background: 'rgba(5, 5, 11, 0.85)',
        border: '1px solid rgba(77, 184, 168, 0.3)',
        borderRadius: '8px',
        padding: '12px 16px',
        backdropFilter: 'blur(8px)',
        boxShadow: `0 0 12px rgba(77, 184, 168, ${pulseOpacity * 0.3})`,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header with pulse indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: pendingCount > 0 ? '#cda852' : '#4db8a8',
            boxShadow: `0 0 ${4 + pendingCount * 2}px ${pendingCount > 0 ? '#cda852' : '#4db8a8'}`,
            opacity: pendingCount > 0 ? 0.6 + Math.sin(pulsePhase) * 0.4 : 0.8,
          }}
        />
        <span style={{ fontWeight: 600, letterSpacing: '0.5px' }}>
          CATCHER'S MITT
        </span>
      </div>

      {/* Buffer count */}
      <div style={{ marginBottom: '4px' }}>
        <span style={{ color: pendingCount > 0 ? '#cda852' : '#666' }}>
          {pendingCount} Signal{pendingCount !== 1 ? 's' : ''} Buffered
        </span>
      </div>

      {/* Timer countdown */}
      <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px' }}>
        Auto-flush in {secondsUntilFlush}s
      </div>

      {/* Manual flush button */}
      <button
        onClick={flushBuffer}
        disabled={isManualOverride || pendingCount === 0}
        style={{
          background: 'transparent',
          border: '1px solid rgba(77, 184, 168, 0.4)',
          borderRadius: '4px',
          color: '#4db8a8',
          fontSize: '10px',
          padding: '4px 8px',
          cursor: pendingCount > 0 ? 'pointer' : 'default',
          opacity: pendingCount > 0 ? 1 : 0.4,
          transition: 'all 0.2s ease',
        }}
      >
        FLUSH NOW
      </button>

      {/* Recent active signals (last 3) */}
      {activeDisplay.length > 0 && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(77, 184, 168, 0.15)' }}>
          <div style={{ fontSize: '9px', color: '#555', marginBottom: '4px' }}>
            RECENT:
          </div>
          {activeDisplay.slice(-3).reverse().map((signal) => (
            <div
              key={signal.id}
              style={{
                fontSize: '9px',
                color: '#888',
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '2px',
              }}
            >
              <span>{signal.type}</span>
              <span style={{ color: '#555' }}>
                {new Date(signal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}