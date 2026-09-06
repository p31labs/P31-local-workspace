/**
 * @file apps.ts — Static registry of all P31 ecosystem apps.
 * Categories: vertex (primary surfaces), tool (utility apps), infra (infrastructure).
 */

export interface AppEntry {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: 'vertex' | 'tool' | 'infra' | 'design';
  url: string;
  telemetrySiteId?: string;
  status: 'live' | 'beta' | 'staging';
}

export const APPS: AppEntry[] = [
  {
    id: 'phos',
    name: 'PHOS',
    slug: 'phos',
    description: 'Phosphorus Human Operating Surface — ambient workspace for neurodivergent adults.',
    icon: '⬦',
    category: 'vertex',
    url: 'https://phos.p31ca.org',
    telemetrySiteId: 'phos',
    status: 'live',
  },
  {
    id: 'willow',
    name: 'WILLOW',
    slug: 'willow',
    description: 'Neurodivergent child companion app — voice, draw, mood, family connections.',
    icon: '🌿',
    category: 'vertex',
    url: 'https://willow.p31ca.org',
    telemetrySiteId: 'willow',
    status: 'live',
  },
  {
    id: 'p31ca',
    name: 'P31 Technical Hub',
    slug: 'p31ca',
    description: 'Sovereign, quantum-safe infrastructure for neurodivergent families.',
    icon: '🧬',
    category: 'vertex',
    url: 'https://p31ca.org',
    status: 'live',
  },
  {
    id: 'phosphorus31',
    name: 'Phosphorus31',
    slug: 'phosphorus31',
    description: 'Georgia nonprofit corporation — free, open-source assistive technology.',
    icon: '⨁',
    category: 'vertex',
    url: 'https://phosphorus31.org',
    status: 'live',
  },
  {
    id: 'bonding',
    name: 'BONDING',
    slug: 'bonding',
    description: 'Care bond attestation surface — mint soulbound LOVE tokens on Base Sepolia.',
    icon: '🔗',
    category: 'tool',
    url: 'https://bonding.p31ca.org',
    status: 'live',
  },
  {
    id: 'tetra-ops',
    name: 'TETRA Ops',
    slug: 'tetra-ops',
    description: 'God-view operator dashboard — K4 topology, telemetry, and ecosystem health.',
    icon: '🔷',
    category: 'tool',
    url: 'https://hub.p31ca.org',
    status: 'live',
  },
  {
    id: 'counterscale',
    name: 'Counterscale',
    slug: 'counterscale',
    description: 'Self-hosted analytics engine — no PII, no tracking, open source.',
    icon: '📊',
    category: 'infra',
    url: 'https://analytics.p31ca.org',
    status: 'live',
  },
  {
    id: 'gateway',
    name: 'API Gateway',
    slug: 'gateway',
    description: 'Central API gateway — PHOS AI, care proofs, love-ledger, and FHIR endpoints.',
    icon: '🌐',
    category: 'infra',
    url: 'https://gateway.p31ca.org',
    status: 'live',
  },
  {
    id: 'willow-preview',
    name: 'WILLOW Preview',
    slug: 'willow-preview',
    description: 'Preview deployment of the next WILLOW — draw, music, quests, and companion.',
    icon: '🪴',
    category: 'vertex',
    url: 'https://willow-preview.pages.dev',
    status: 'beta',
  },
  {
    id: 'design-core',
    name: 'P31 Design Core',
    slug: 'design-core',
    description: 'Design tokens, glass, motion, typography, and starfield — the canonical visual system.',
    icon: '🎨',
    category: 'design',
    url: 'https://github.com/p31labs/P31-local-workspace/tree/main/packages/design-core',
    status: 'live',
  },
  {
    id: 'ui',
    name: 'P31 UI',
    slug: 'ui',
    description: 'Shared React component library — AppNav, SiteNav, SpoonDial, GlassCard, GlowButton, and 12+ more.',
    icon: '🧩',
    category: 'design',
    url: 'https://github.com/p31labs/P31-local-workspace/tree/main/packages/ui',
    status: 'live',
  },
];

export function getAppsByCategory(): Record<string, AppEntry[]> {
  const cats: Record<string, AppEntry[]> = {};
  for (const app of APPS) {
    (cats[app.category] ??= []).push(app);
  }
  return cats;
}

export function searchApps(query: string): AppEntry[] {
  const q = query.toLowerCase();
  return APPS.filter(a => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
}
