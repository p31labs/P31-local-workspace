export const crownMeta = {
  tag: 'z-badge',
  variant: 'crown',
  name: 'Crown',
  description: 'Sovereignty/status badge — crown icon with role label and tooltip',
  slots: ['icon', 'label', 'tooltip'] as const,
  mcp: {
    tool: 'crownDisplay',
    state: 'active' as const,
    target: 'crown-badge',
  },
  tokens: {
    badgeBg: '--p31-glass-bg',
    badgeBorder: '--p31-glass-border',
    badgeRadius: '--p31-radius-full',
    badgeColor: '--p31-accent-violet',
    textColor: '--p31-text-primary',
  },
} as const;

export type CrownVariant = typeof crownMeta.variant;
export type CrownSlots = (typeof crownMeta.slots)[number];
