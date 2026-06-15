import React from 'react';
import { getBiologicalTheme } from './PHOSShell';
import { GreetingSurface } from '../surfaces/GreetingSurface';
import { IgnitionSurface } from '../surfaces/IgnitionSurface';
import { BondingSurface } from '../surfaces/BondingSurface';
import { CompassSurface } from '../surfaces/CompassSurface';
import { SettingsSurface } from '../surfaces/SettingsSurface';
import { ChaosIngest } from '../surfaces/ChaosIngest';
import { RetroVaultSurface } from '../surfaces/RetroVaultSurface';
import { LedgerSurface } from '../surfaces/LedgerSurface';
import { ArcadeSurface } from '../surfaces/ArcadeSurface';
import { NodeZeroSurface } from '../surfaces/NodeZeroSurface';
import { ConnectionGridSurface } from '../surfaces/ConnectionGridSurface';
import { HearthSurface } from '../surfaces/HearthSurface';
import { ShakeStream } from '../surfaces/ShakeStream';
import { WarehouseSurface } from '../surfaces/WarehouseSurface';
import { WillowSurface } from '../surfaces/WillowSurface';
import { StarBuilderSurface } from '../surfaces/StarBuilderSurface';
import { ArcadeOS } from '../surfaces/ArcadeOS';
import { ArcadeMasterRuntime } from '../surfaces/ArcadeMasterRuntime';

interface SurfaceProps {
  currentSurface: string;
  theme?: Record<string, string>;
  setSurface: (surf: string) => void;
  spoons: number;
}

export function SurfaceContent({ currentSurface, setSurface, spoons, theme: externalTheme }: SurfaceProps) {
  const computedTheme = externalTheme || getBiologicalTheme(spoons, false);
  const theme = computedTheme;

  switch (currentSurface) {
    case 'GREETING':
      return <GreetingSurface theme={theme} spoons={spoons} />;

    case 'IGNITION':
      return <IgnitionSurface theme={theme} spoons={spoons} />;

    case 'BONDING':
      return <BondingSurface theme={theme} spoons={spoons} />;

    case 'COMPASS':
      return <CompassSurface theme={theme} spoons={spoons} />;

    case 'SETTINGS':
      return <SettingsSurface theme={theme} spoons={spoons} />;

    case 'THE_BUFFER':
      return <ChaosIngest theme={theme} spoons={spoons} />;

    case 'VAULT':
      return <RetroVaultSurface theme={theme} spoons={spoons} />;

    case 'GRID':
      return <ConnectionGridSurface theme={theme} spoons={spoons} />;

    case 'NODE_ZERO':
      return <NodeZeroSurface theme={theme} spoons={spoons} />;

    case 'LEDGER':
    case 'LOVE':
      return <LedgerSurface theme={theme} spoons={spoons} />;

    case 'HEARTH':
      return <HearthSurface theme={theme} spoons={spoons} />;

    case 'ARCADE':
      return <ArcadeSurface theme={theme} spoons={spoons} />;

    case 'ARCHIVE':
      return (
        <div className="space-y-4">
          <h3 className="text-sm font-mono uppercase tracking-widest opacity-60">Sovereign Archive Search</h3>
          <ShakeStream theme={theme} initialQuery="" spoons={spoons} />
        </div>
      );

    case 'WAREHOUSE':
      return <WarehouseSurface theme={theme} spoons={spoons} />;
    case 'WILLOW':
      return <WillowSurface />;
    case 'STAR_BUILDER':
      return <StarBuilderSurface />;
    case 'ARCADE_OS':
      return <ArcadeOS onClose={() => setSurface('IGNITION')} />;
    case 'ARCADE_MASTER':
      return <ArcadeMasterRuntime onClose={() => setSurface('IGNITION')} />;
    default:
      return (
        <div className="p-4 border border-dashed border-red-900/40 text-red-400 font-mono text-xs uppercase tracking-widest rounded-lg">
          ERR_SURFACE_NOT_BOUND // {currentSurface}
        </div>
      );
  }
}
