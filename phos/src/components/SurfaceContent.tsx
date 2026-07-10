import React, { Suspense } from 'react';
import { UIGSurface } from './UIGSurface';
import { generatePhosInterface, phosRoleFromIdentity, samplePhosViewData } from '../lib/uig';
import { getSurfaceEntry } from '../lib/uigViews';

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
}

// Data-driven dispatch: the previous 27-case switch is replaced by SURFACE_REGISTRY.
// Every surface flows through generatePhosInterface → UIGSurface (adaptive shell,
// crisis overlay at spoons 0). Widget-mode surfaces render UIG widgets; component-mode
// surfaces keep their existing UI inside the adaptive shell.
export function SurfaceContent({ currentSurface, spoons }: SurfaceProps) {
  const role = phosRoleFromIdentity();
  const entry = getSurfaceEntry(currentSurface);
  if (!entry || entry.mode === 'none') return null;

  const viewData = entry.viewData ? entry.viewData(spoons, role) : samplePhosViewData(currentSurface);
  const description = generatePhosInterface(currentSurface, { spoons, role, viewData });

  const body =
    entry.mode === 'component' && entry.Component ? (
      <Suspense fallback={<SurfaceSkeleton />}>
        <entry.Component />
      </Suspense>
    ) : null;

  return (
    <UIGSurface description={description} surfaceId={currentSurface} spoons={spoons} viewData={viewData}>
      {body}
    </UIGSurface>
  );
}

export default SurfaceContent;
