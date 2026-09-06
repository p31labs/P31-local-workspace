import { type ReactNode } from 'react';

export interface A2DataCardMetric {
  label: string;
  value: string | number;
  color?: string;
}

export interface A2DataCardAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'danger';
}

export interface A2DataCardProps {
  title?: ReactNode;
  subtitle?: string;
  variant?: 'default' | 'port' | 'node' | 'metrics';
  status?: { label: string; state: 'online' | 'offline' | 'warning' | 'error' | 'info' };
  metrics?: A2DataCardMetric[];
  actions?: A2DataCardAction[];
  onClose?: () => void;
  children?: ReactNode;
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  online:  { bg: 'var(--p31-status-online)',   text: 'var(--p31-text)' },
  offline: { bg: 'var(--p31-status-offline)',  text: 'var(--p31-text)' },
  warning: { bg: 'var(--p31-status-warning)',  text: 'var(--p31-text)' },
  error:   { bg: 'var(--p31-status-error)',    text: 'var(--p31-text)' },
  info:    { bg: 'var(--p31-status-info)',     text: 'var(--p31-text)' },
};

export default function A2DataCard({ title, subtitle, variant = 'default', status, metrics, actions, onClose, children }: A2DataCardProps) {
  return (
    <div className={`a2-data-card a2-data-card--${variant}`}>
      {(title || onClose) && (
        <div className="a2-data-card-header">
          <div className="a2-data-card-title-row">
            {title && <span className="a2-data-card-title">{title}</span>}
            {status && (
              <span className="a2-data-card-status" style={{ background: STATUS_STYLES[status.state]?.bg, color: STATUS_STYLES[status.state]?.text }}>
                {status.label}
              </span>
            )}
          </div>
          {subtitle && <div className="a2-data-card-subtitle">{subtitle}</div>}
          {onClose && (
            <button className="a2-data-card-close" onClick={onClose} aria-label="Close">✕</button>
          )}
        </div>
      )}
      {metrics && metrics.length > 0 && (
        <div className="a2-data-card-metrics">
          {metrics.map((m, i) => (
            <div key={i} className="a2-data-card-metric">
              <span className="a2-data-card-metric-label">{m.label}</span>
              <span className="a2-data-card-metric-value" style={m.color ? { color: m.color } : undefined}>{m.value}</span>
            </div>
          ))}
        </div>
      )}
      {children && <div className="a2-data-card-body">{children}</div>}
      {actions && actions.length > 0 && (
        <div className="a2-data-card-actions">
          {actions.map((a, i) => (
            <button
              key={i}
              className={`a2-data-card-action a2-data-card-action--${a.variant ?? 'primary'}`}
              onClick={a.onClick}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
