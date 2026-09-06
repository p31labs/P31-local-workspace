/**
 * @file NotificationToast — Token-styled toast for a single alert.
 */

import { useAlertStore, type Alert } from './alertStore';

const TYPE_STYLES: Record<Alert['type'], { border: string; glow: string; icon: string }> = {
  info: { border: 'border-quantum-cyan/40', glow: 'var(--p31-glow-cyan, 0 0 12px rgba(0,255,255,0.35))', icon: 'ℹ' },
  success: { border: 'border-quantum-green/40', glow: '0 0 12px rgba(0,255,136,0.35)', icon: '✓' },
  warning: { border: 'border-quantum-gold/40', glow: '0 0 12px rgba(255,215,0,0.35)', icon: '⚠' },
  error: { border: 'border-quantum-rose/40', glow: '0 0 12px rgba(255,107,107,0.35)', icon: '✕' },
};

export function NotificationToast({ alert }: { alert: Alert }) {
  const dismiss = useAlertStore((s) => s.dismiss);
  const style = TYPE_STYLES[alert.type];

  return (
    <div
      role={alert.type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={`ui-chrome pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl bg-void/90 backdrop-blur-xl border ${style.border} text-ink font-mono-tech text-sm`}
      style={{ boxShadow: style.glow, maxWidth: 360 }}
    >
      <span aria-hidden="true" className="mt-0.5">{style.icon}</span>
      <span className="flex-1 leading-snug">{alert.message}</span>
      <button
        onClick={() => dismiss(alert.id)}
        aria-label="Dismiss notification"
        className="text-mist hover:text-ink transition-colors text-xs px-1"
      >
        ✕
      </button>
    </div>
  );
}
