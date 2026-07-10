import React, { lazy } from 'react';
import type { UigRole } from './uig';
import { samplePhosViewData } from './uig';

import { DashboardSurface } from '../surfaces/DashboardSurface';
import { GreetingSurface } from '../surfaces/GreetingSurface';
import { IgnitionSurface } from '../surfaces/IgnitionSurface';
import { BondingSurface } from '../surfaces/BondingSurface';
import { CompassSurface } from '../surfaces/CompassSurface';
import { SettingsSurface } from '../surfaces/SettingsSurface';
import { RetroVaultSurface } from '../surfaces/RetroVaultSurface';
import { LedgerSurface } from '../surfaces/LedgerSurface';
import { OpenLedgerSurface } from '../surfaces/OpenLedgerSurface';
import { NodeZeroSurface } from '../surfaces/NodeZeroSurface';
import { HearthSurface } from '../surfaces/HearthSurface';
import { DisputeSurface } from '../surfaces/DisputeSurface';
import { SanctuarySurface } from '../surfaces/SanctuarySurface';
import { AttestSurface } from '../surfaces/AttestSurface';
import { QuantumBrainDumpSurface } from '../surfaces/QuantumBrainDumpSurface';
import { ArchiveSurface } from '../surfaces/ArchiveSurface';
import { BarterMarketplace } from '../surfaces/BarterMarketplace';
import { GovernanceSurface } from '../surfaces/GovernanceSurface';
import { FeedbackSurface } from '../surfaces/FeedbackSurface';
import { PassportSurface } from '../surfaces/PassportSurface';

const ArcadeSurface = lazy(() =>
  import('../surfaces/ArcadeSurface').then(m => ({ default: m.ArcadeSurface })),
);
const ChaosIngest = lazy(() =>
  import('../surfaces/ChaosIngest').then(m => ({ default: m.ChaosIngest })),
);
const ConnectionGridSurface = lazy(() =>
  import('../surfaces/ConnectionGridSurface').then(m => ({ default: m.ConnectionGridSurface })),
);
const ShakeStream = lazy(() =>
  import('../surfaces/ShakeStream').then(m => ({ default: m.ShakeStream })),
);
const WarehouseSurface = lazy(() =>
  import('../surfaces/WarehouseSurface').then(m => ({ default: m.WarehouseSurface })),
);

export type SurfaceMode = 'widgets' | 'component' | 'none';

export interface SurfaceEntry {
  mode: SurfaceMode;
  // Present for 'component' mode surfaces (rendered inside the adaptive shell).
  Component?: React.ComponentType<any> | React.LazyExoticComponent<React.ComponentType<any>>;
  // Present for 'widgets' mode surfaces; supplies the payload that drives UIG widgets.
  // Live data wiring is a per-surface follow-up; samples demonstrate the engine.
  viewData?: (spoons: number, role: UigRole) => Record<string, any>;
}

// Static sample payloads for widget-mode surfaces. Replace with real fetched
// view data per surface as the migration deepens.
const sample = (data: Record<string, any>) => () => data;

export const SURFACE_REGISTRY: Record<string, SurfaceEntry> = {
  CHAT: { mode: 'none' },

  // ---- widget-mode (fully UIG-rendered) ----
  DASHBOARD: { mode: 'widgets', viewData: (_s, r) => (r === 'coordinator' ? samplePhosViewData('DASHBOARD') : { sessions_count: 0 }) },
  GREETING: { mode: 'widgets', viewData: sample({ name: 'Friend', spoons_note: 'Welcome back.' }) },
  IGNITION: { mode: 'widgets', viewData: sample({ status: 'ready', signal: 'nominal' }) },
  SETTINGS: { mode: 'widgets', viewData: sample({ theme: 'void', motion: 'on', contrast: 'standard' }) },
  LEDGER: { mode: 'widgets', viewData: sample({ total_love: '12,480', pending: 2, members: 3, days_until_aug1: 22 }) },
  OPEN_LEDGER: { mode: 'widgets', viewData: sample({ flows: 9, transparent: true, anchored: 'love-ledger' }) },
  PASSPORT: { mode: 'widgets', viewData: sample({ credentials: 5, attestations: 3, did: 'did:key:…', role: 'Guest' }) },
  FEEDBACK: { mode: 'widgets', viewData: sample({ responses: 12, avg_rating: 4.2, open: 1 }) },
  ARCHIVE: { mode: 'widgets', viewData: sample({ entries: 48, last_access: '2026-07-01', pinned: 3 }) },
  ATTEST: { mode: 'widgets', viewData: sample({ pending: 2, issued: 7, revoked: 0 }) },
  SANCTUARY: { mode: 'widgets', viewData: sample({ sessions: 3, state: 'calm', breath: '4-7-8' }) },
  HEARTH: { mode: 'widgets', viewData: sample({ members: 5, warmth: 'high', shared: 2 }) },
  ADAPTIVE: { mode: 'widgets', viewData: (_s, r) => (r === 'coordinator' ? samplePhosViewData('DASHBOARD') : { sessions_count: 0 }) },
  ONBOARDING: { mode: 'none' },

  // ---- component-mode (existing UI inside the adaptive shell) ----
  QUANTUM_BRAIN_DUMP: { mode: 'component', Component: QuantumBrainDumpSurface },
  BONDING: { mode: 'component', Component: BondingSurface },
  COMPASS: { mode: 'component', Component: CompassSurface },
  NODE_ZERO: { mode: 'component', Component: NodeZeroSurface },
  VAULT: { mode: 'component', Component: RetroVaultSurface },
  GRID: { mode: 'component', Component: ConnectionGridSurface },
  THE_BUFFER: { mode: 'component', Component: ChaosIngest },
  DISPUTE: { mode: 'component', Component: DisputeSurface },
  ARCADE: { mode: 'component', Component: ArcadeSurface },
  BARTER: { mode: 'component', Component: BarterMarketplace },
  GOVERNANCE: { mode: 'component', Component: GovernanceSurface },
  WAREHOUSE: { mode: 'component', Component: WarehouseSurface },
  SHAKESTREAM: { mode: 'component', Component: ShakeStream },
};

export function getSurfaceEntry(id: string): SurfaceEntry | undefined {
  return SURFACE_REGISTRY[id];
}
