export interface NavAtom {
  id: string;
  label: string;
  href: string;
  act: 'to' | 'in' | 'through';
  index: number;
}

export interface LabItem {
  id: string;
  label: string;
  href: string;
  description: string;
}

export type ActId = 'to' | 'in' | 'through';

export const ACT_NAMES: Record<ActId, { name: string; label: string }> = {
  to: { name: 'Act I', label: 'Invitation' },
  in: { name: 'Act II', label: 'Immersion' },
  through: { name: 'Act III', label: 'Action' },
};

export const NAV_ATOMS: NavAtom[] = [
  { id: 'home', label: 'Home', href: '/', act: 'to', index: 1 },
  { id: 'about', label: 'About', href: '/about', act: 'to', index: 2 },
  { id: 'stack', label: 'Stack', href: '/stack', act: 'to', index: 3 },
  { id: 'cli', label: 'CLI', href: '/cli', act: 'to', index: 4 },
  { id: 'love', label: 'LOVE', href: '/love', act: 'in', index: 1 },
  { id: 'research', label: 'Research', href: '/research', act: 'in', index: 2 },
  { id: 'docs', label: 'Docs', href: '/docs', act: 'in', index: 3 },
  { id: 'tools', label: 'Tools', href: '/tools', act: 'through', index: 1 },
  { id: 'ask', label: 'Ask', href: '/ask', act: 'through', index: 2 },
  { id: 'scene', label: 'Scene', href: '/scene', act: 'through', index: 3 },
  { id: 'monetization', label: 'Monetization', href: '/monetization', act: 'through', index: 4 },
];

export const LAB_ITEMS: LabItem[] = [
  { id: 'system', label: 'System', href: '/system', description: 'Fleet health dashboard' },
  { id: 'treasury', label: 'Treasury', href: '/treasury', description: 'Public treasury ledger' },
  { id: 'arcade', label: 'Arcade', href: '/arcade', description: 'Game hub' },
];
