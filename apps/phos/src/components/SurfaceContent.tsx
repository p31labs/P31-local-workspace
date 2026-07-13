import React, { Suspense, lazy } from 'react';
import { UIGSurface } from './UIGSurface';
import { generatePhosInterface, phosRoleFromIdentity, samplePhosViewData } from '../lib/uig';
import { generateInterfaceFromIntent } from '@p31/interface-generator';
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
import { PQCKeygenSurface } from '../surfaces/PQCKeygenSurface';

const ArcadeSurface = lazy(() =>
  import('../surfaces/ArcadeSurface').then(m => ({ default: m.ArcadeSurface }))
);
const ChaosIngest = lazy(() =>
  import('../surfaces/ChaosIngest').then(m => ({ default: m.ChaosIngest }))
);
const ConnectionGridSurface = lazy(() =>
  import('../surfaces/ConnectionGridSurface').then(m => ({ default: m.ConnectionGridSurface }))
);
const ShakeStream = lazy(() =>
  import('../surfaces/ShakeStream').then(m => ({ default: m.ShakeStream }))
);
const WarehouseSurface = lazy(() =>
  import('../surfaces/WarehouseSurface').then(m => ({ default: m.WarehouseSurface }))
);

function SurfaceSkeleton() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--phos-border)', borderTopColor: 'var(--phos-primary)' }} />
    </div>
  );
}

interface SurfaceProps {
  currentSurface: string;
  setSurface: (surf: string) => void;
  spoons: number;
  theme?: Record<string, string>;
  isGuest?: boolean;
  isGenerative?: boolean;
  intentPrompt?: string;
}

export function SurfaceContent({ currentSurface, setSurface, spoons, isGuest, isGenerative, intentPrompt }: SurfaceProps) {
  switch (currentSurface) {
    case 'CHAT':
      return null;
    case 'QUANTUM_BRAIN_DUMP':
      return <QuantumBrainDumpSurface />;

    case 'DASHBOARD':
      return <DashboardSurface onNavigate={setSurface} />;

    case 'GREETING':
      return <GreetingSurface />;

    case 'IGNITION':
      return <IgnitionSurface />;

    case 'BONDING':
      return <BondingSurface />;

    case 'COMPASS':
      return <CompassSurface />;

    case 'SETTINGS':
      return <SettingsSurface />;

    case 'THE_BUFFER':
      return (
        <Suspense fallback={<SurfaceSkeleton />}>
          <ChaosIngest />
        </Suspense>
      );

    case 'VAULT':
      return <RetroVaultSurface spoons={spoons} />;

    case 'GRID':
      return (
        <Suspense fallback={<SurfaceSkeleton />}>
          <ConnectionGridSurface spoons={spoons} />
        </Suspense>
      );

    case 'NODE_ZERO':
      return <NodeZeroSurface theme={undefined} spoons={spoons} />;

    case 'LEDGER':
    case 'LOVE':
      return <LedgerSurface />;

    case 'OPEN_LEDGER':
      return <OpenLedgerSurface spoons={spoons} />;

    case 'DISPUTE':
      return <DisputeSurface />;

    case 'SANCTUARY':
      return <SanctuarySurface spoons={spoons} />;

    case 'ATTEST':
    case 'ATTESTATION':
      return <AttestSurface spoons={spoons} />;

    case 'HEARTH':
      return <HearthSurface spoons={spoons} />;

    case 'ARCADE':
      return (
        <Suspense fallback={<SurfaceSkeleton />}>
          <ArcadeSurface spoons={spoons} />
        </Suspense>
      );

    case 'ARCHIVE':
      return <ArchiveSurface spoons={spoons} />;

    case 'BARTER':
      return <BarterMarketplace />;

    case 'GOVERNANCE':
      return <GovernanceSurface />;

    case 'PASSPORT':
      return <PassportSurface />;

    case 'PQC_KEYS':
      return <PQCKeygenSurface />;

    case 'FEEDBACK':
      return <FeedbackSurface isGuest={isGuest} spoons={spoons} />;

    case 'WAREHOUSE':
      return (
        <Suspense fallback={<SurfaceSkeleton />}>
          <WarehouseSurface spoons={spoons} />
        </Suspense>
      );

    // UIG (additive): ADAPTIVE is rendered through the InterfaceRenderer /
    // UIGSurface adaptive shell, including the CrisisOverlay at spoons 0.
    // Existing component-mode surfaces above remain on the unchanged switch.
    case 'ADAPTIVE': {
      const role = phosRoleFromIdentity();
      const viewData = samplePhosViewData('DASHBOARD');
      let description;
      if (isGenerative && intentPrompt) {
        description = generateInterfaceFromIntent({ prompt: intentPrompt, spoons, role });
      } else {
        description = generatePhosInterface('ADAPTIVE', { spoons, role, viewData });
      }
      return <UIGSurface description={description} surfaceId="ADAPTIVE" spoons={spoons} viewData={viewData} intentPrompt={isGenerative ? (intentPrompt ?? '') : undefined} />;
    }

    default:
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-xs font-mono opacity-30">ERR_SURFACE_NOT_BOUND</div>
            <div className="text-[10px] font-mono opacity-20 mt-1">{currentSurface}</div>
          </div>
        </div>
      );
  }
}
