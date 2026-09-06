/**
 * @file StatusBadge — Zephyr catalog metadata
 */

export const catalog = {
  id: 'status-badge',
  name: 'StatusBadge',
  description: 'Status indicator badge with online/offline/busy/away variants',
  framework: 'zephyr',
  path: 'zephyr/StatusBadge/StatusBadge.zephyr.html',
  variants: [
    { value: 'online',  label: 'Online',  color: 'var(--p31-accent-green, #34d399)' },
    { value: 'offline', label: 'Offline', color: 'var(--p31-accent-red, #fb7185)' },
    { value: 'busy',    label: 'Busy',    color: 'var(--p31-accent-gold, #fbbf24)' },
    { value: 'away',    label: 'Away',    color: 'var(--p31-text-tertiary, #94a3b8)' },
  ],
  mcp: {
    tool: 'statusBadge',
    type: 'status',
    target: 'status-badge',
  },
} as const;

export type StatusBadgeVariant = (typeof catalog.variants)[number]['value'];
