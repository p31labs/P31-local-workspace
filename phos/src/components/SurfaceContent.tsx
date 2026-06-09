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
      return <ChaosIngest theme={theme} />;

    case 'VAULT':
      return <RetroVaultSurface theme={theme} spoons={spoons} />;

    case 'GRID':
      return <ConnectionGridSurface theme={theme} spoons={spoons} />;

    case 'NODE_ZERO':
      return <NodeZeroSurface theme={theme} spoons={spoons} />;

    case 'LEDGER':
    case 'LOVE':
      return <LedgerSurface theme={theme} />;

    case 'HEARTH':
      return <HearthSurface theme={theme} spoons={spoons} />;

    case 'ARCADE':
      return <ArcadeSurface theme={theme} spoons={spoons} />;

    case 'ARCHIVE':
      return (
        <div className="space-y-4">
          <h3 className="text-sm font-mono uppercase tracking-widest opacity-60">Sovereign Archive Search</h3>
          <ShakeStream theme={theme} initialQuery="" />
        </div>
      );

    case 'WAREHOUSE':
      return <WarehouseSurface theme={theme} spoons={spoons} />;

    default:
      return (
        <div className="p-4 border border-dashed border-red-900/40 text-red-400 font-mono text-xs uppercase tracking-widest rounded-lg">
          ERR_SURFACE_NOT_BOUND // {currentSurface}
        </div>
      );
  }
}
