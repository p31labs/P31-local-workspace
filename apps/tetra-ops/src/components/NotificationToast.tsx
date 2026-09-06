import { useNotificationStore, type Notification, type Severity } from '../state/notificationStore';

const SEV: Record<Severity, { accent: string; icon: string; label: string }> = {
  info: { accent: 'var(--p31-accent)', icon: 'fa-circle-info', label: 'INFO' },
  success: { accent: 'var(--p31-accent-green)', icon: 'fa-circle-check', label: 'OK' },
  warning: { accent: 'var(--p31-accent-gold)', icon: 'fa-triangle-exclamation', label: 'WARN' },
  error: { accent: 'var(--p31-accent-red)', icon: 'fa-circle-xmark', label: 'ERR' },
};

export function NotificationToast({ n }: { n: Notification }) {
  const dismiss = useNotificationStore((s) => s.dismissNotification);
  const sev = SEV[n.severity];

  return (
    <div
      role="status"
      aria-live={n.severity === 'error' ? 'assertive' : 'polite'}
      className="glass-panel"
      style={{
        display: 'flex',
        gap: 9,
        alignItems: 'flex-start',
        padding: '9px 11px',
        borderRadius: 'var(--p31-radius-lg)',
        borderColor: sev.accent,
        boxShadow: `0 0 18px ${sev.accent}22`,
        minWidth: 240,
        maxWidth: 340,
      }}
    >
      <i className={`fa-solid ${sev.icon}`} style={{ color: sev.accent, fontSize: 12, marginTop: 1 }} aria-hidden="true" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--p31-text-primary)', letterSpacing: '0.02em' }}>
          {n.title}
        </div>
        {n.message && (
          <div style={{ fontSize: 10, color: 'var(--p31-text-secondary)', marginTop: 2, lineHeight: 1.45 }}>{n.message}</div>
        )}
      </div>
      <button
        onClick={() => dismiss(n.id)}
        aria-label="Dismiss notification"
        className="abtn"
        style={{ minHeight: 0, minWidth: 0, padding: '0 6px', height: 22, fontSize: 10, flexShrink: 0 }}
      >
        ✕
      </button>
    </div>
  );
}
