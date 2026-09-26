import React from 'react';
import { badgeClassForStatus } from './statusUtils';
import type { CSSProperties } from 'react';

export type StatusBadgeStatus = 'online' | 'offline' | 'busy' | 'away';

export interface StatusBadgeProps {
  status?: StatusBadgeStatus;
  /** @deprecated use status="online" */
  variant?: 'live' | 'beta' | 'research';
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export const STATUS_LABELS: Record<StatusBadgeStatus, string> = {
  online: 'Online',
  offline: 'Offline',
  busy: 'Busy',
  away: 'Away',
};

export function StatusBadge({ status = 'online', variant, label, className = '', style }: StatusBadgeProps) {
  const resolved: StatusBadgeStatus = variant
    ? ({ live: 'online', beta: 'away', research: 'offline' }[variant] as StatusBadgeStatus)
    : status;
  const text = label || STATUS_LABELS[resolved];
  const cls = `badge ${badgeClassForStatus(resolved)} ${className}`.trim();

  return (
    <span className={cls} style={style}>
      <span className="status-dot" data-status={resolved} aria-hidden="true" />
      {text}
    </span>
  );
}

export default StatusBadge;
