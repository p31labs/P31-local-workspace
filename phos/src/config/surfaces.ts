export interface SurfaceNavItem {
  id: string;
  label: string;
  icon: string;
  group: 'primary' | 'secondary';
  href?: string;
}

export const SURFACE_NAV: SurfaceNavItem[] = [
  { id: 'CHAT', label: 'Gateway', icon: '✨', group: 'primary' },
  { id: 'DASHBOARD', label: 'Dashboard', icon: '⊞', group: 'primary' },
  { id: 'QUANTUM_BRAIN_DUMP', label: 'Brain Dump', icon: '🧠', group: 'primary' },
  { id: 'THE_BUFFER', label: 'Buffer', icon: '✎', group: 'primary' },
  { id: 'ARCHIVE', label: 'Archive', icon: '⚯', group: 'primary' },
  { id: 'HEARTH', label: 'Hearth', icon: '◈', group: 'primary' },
  { id: 'VAULT', label: 'Vault', icon: '◉', group: 'primary' },
  { id: 'LEDGER', label: 'Ledger', icon: '⊜', group: 'primary' },
  { id: 'OPEN_LEDGER', label: 'Open Ledger', icon: '◬', group: 'primary' },
  { id: 'BARTER', label: 'Barter', icon: '🔄', group: 'primary' },
  { id: 'GOVERNANCE', label: 'Governance', icon: '⚖️', group: 'primary' },
  { id: 'PASSPORT', label: 'Passport', icon: '🪪', group: 'primary' },
  { id: 'ADAPTIVE', label: 'Adaptive', icon: '❋', group: 'primary' },
  { id: 'FEEDBACK', label: 'Feedback', icon: '⚑', group: 'primary' },
  { id: 'SANCTUARY', label: 'Sanctuary', icon: '◈', group: 'primary' },
  { id: 'ATTEST', label: 'Attest', icon: '⚮', group: 'primary' },
  { id: 'SETTINGS', label: 'Settings', icon: '⚙', group: 'secondary' },
  { id: 'ARCADE', label: 'Arcade', icon: '◇', group: 'secondary' },
  { id: 'BONDING', label: 'Bonding', icon: '⚛', group: 'secondary' },
  { id: 'GRID', label: 'Grid', icon: '⌗', group: 'secondary' },
  { id: 'COMPASS', label: 'Compass', icon: '⌖', group: 'secondary' },
  { id: 'NODE_ZERO', label: 'Node Zero', icon: '⊙', group: 'secondary' },
  { id: 'WAREHOUSE', label: 'Warehouse', icon: '▣', group: 'secondary' },
  { id: 'ONBOARDING', label: 'Docs & Onboarding', icon: '📘', group: 'primary', href: '/onboarding' },
];

export const SURFACE_IDS = SURFACE_NAV.map(s => s.id);
