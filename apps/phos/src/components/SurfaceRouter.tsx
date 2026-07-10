import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { SURFACE_IDS } from '../config/surfaces';
import PHOSWorkspace from './PHOSWorkspace';

const SURFACE_PATHS: Record<string, string> = {
  CHAT: '/',
  DASHBOARD: '/dashboard',
  ADAPTIVE: '/adaptive',
  QUANTUM_BRAIN_DUMP: '/brain-dump',
  THE_BUFFER: '/buffer',
  ARCHIVE: '/archive',
  HEARTH: '/hearth',
  VAULT: '/vault',
  LEDGER: '/ledger',
  OPEN_LEDGER: '/open-ledger',
  BARTER: '/barter',
  GOVERNANCE: '/governance',
  PASSPORT: '/passport',
  FEEDBACK: '/feedback',
  SANCTUARY: '/sanctuary',
  ATTEST: '/attest',
  SETTINGS: '/settings',
  ARCADE: '/arcade',
  BONDING: '/bonding',
  GRID: '/grid',
  COMPASS: '/compass',
  NODE_ZERO: '/node-zero',
  WAREHOUSE: '/warehouse',
  DISPUTE: '/dispute',
  LOVE: '/love',
  IGNITION: '/ignition',
};

const PATH_TO_SURFACE: Record<string, string> = {};
for (const [surface, path] of Object.entries(SURFACE_PATHS)) {
  PATH_TO_SURFACE[path.replace(/\/$/, '') || ''] = surface;
}

function useSurfaceRouting() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const pathToSurface = (): string | null => {
    const legacy = searchParams.get('surface');
    if (legacy && SURFACE_IDS.includes(legacy.toUpperCase())) return legacy.toUpperCase();
    const cleanPath = location.pathname.replace(/\/+$/, '');
    return PATH_TO_SURFACE[cleanPath] || null;
  };

  const navigateToSurface = (surface: string) => {
    const path = SURFACE_PATHS[surface] || '/';
    navigate(path, { replace: true });
  };

  return { pathToSurface, navigateToSurface, currentPath: location.pathname };
}

const RoutingCtx = React.createContext<ReturnType<typeof useSurfaceRouting> | null>(null);

export function useRouting() {
  return React.useContext(RoutingCtx) ?? { pathToSurface: () => null, navigateToSurface: () => {}, currentPath: '/' };
}

export function PhosApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<RoutingLayer />} />
      </Routes>
    </BrowserRouter>
  );
}

function RoutingLayer() {
  const routing = useSurfaceRouting();
  return (
    <RoutingCtx.Provider value={routing}>
      <PHOSWorkspace />
    </RoutingCtx.Provider>
  );
}

export { Link };
