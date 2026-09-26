import React from 'react';
import type { ReactNode, CSSProperties } from 'react';

export interface MetricBadgeProps {
  icon?: ReactNode;
  value: string | number;
  label?: string;
  clickable?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function MetricBadge({ icon, value, label, clickable = false, className = '', style }: MetricBadgeProps) {
  const cls = `metric-badge${clickable ? ' clickable' : ''} ${className}`.trim();

  return (
    <div className={cls} style={style}>
      {icon && <span className="status-dot">{icon}</span>}
      <span className="value">{value}</span>
      {label && <span className="label">{label}</span>}
    </div>
  );
}

export default MetricBadge;
