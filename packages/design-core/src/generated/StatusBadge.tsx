/**
 * @file StatusBadge — Status indicator badge.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export type Status = 'online' | 'offline' | 'busy' | 'away';

export interface StatusBadgeProps {
  status: Status;
  label?: string;
  className?: string;
}

const STATUS_CLASS: Record<Status, string> = {
  online: 'badge-success',
  offline: 'badge-error',
  busy: 'badge-warning',
  away: 'badge-info',
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span className={`badge ${STATUS_CLASS[status]} ${className || ''}`}>
      <span className="status-dot" data-status={status} />
      {label || status}
    </span>
  );
}

export default StatusBadge;
