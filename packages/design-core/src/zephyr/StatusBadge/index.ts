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
    { value: 'online',  label: 'Online',  color: 'var(--p31-accent-green, oklch(0.773 0.153 163))' },
    { value: 'offline', label: 'Offline', color: 'var(--p31-accent-red, oklch(0.719 0.169 13))' },
    { value: 'busy',    label: 'Busy',    color: 'var(--p31-accent-gold, oklch(0.837 0.164 84))' },
    { value: 'away',    label: 'Away',    color: 'var(--p31-text-tertiary, oklch(0.628 0.020 260))' },
  ],
  mcp: {
    tool: 'statusBadge',
    type: 'status',
    target: 'status-badge',
  },
} as const;

export type StatusBadgeVariant = (typeof catalog.variants)[number]['value'];
