import { useEffect } from 'react';
import CognitivePassportSchema from '@p31/design-core/manifest.json';
import { useAdaptiveStore } from './adaptiveStore';

export interface CognitivePassport {
  did: string;
  identity: {
    displayName: string;
    pronouns: string;
    orcid: string;
  };
  cognition: {
    processingStyle: 'visual' | 'verbal' | 'sequential' | 'holistic';
  };
  accessibility: {
    screenComfort: number;
    motionPreference: 'full' | 'reduced' | 'none';
    contrastPreference: 'standard' | 'high';
    fontSize: number;
    density: 'compact' | 'comfortable' | 'spacious';
  };
}

export interface GreyRockProps {
  passport: CognitivePassport | null;
  spoons?: number;
  sizeClass?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * GreyRock — the adaptive renderer.
 *
 * Reads the CognitivePassport and applies all adaptive attributes to the root
 * element. This is the single point where user state becomes DOM attributes,
 * and every downstream component reads from those attributes.
 *
 * Sets:
 *   data-spoons        → motion scale (0–5)
 *   data-size-class    → layout density (compact/regular/medium/expanded)
 *   data-theme         → accent color (from passport or default quantum-cyan)
 *   data-contrast      → contrast level (standard/high)
 *   data-density       → spacing multiplier (low/medium/high)
 *   data-motion        → motion preference (full/reduced/none)
 */
export function GreyRock({
  passport,
  spoons,
  sizeClass,
  children,
  className = '',
}: GreyRockProps): JSX.Element {
  const store = useAdaptiveStore();
  const motionPref = passport?.accessibility?.motionPreference ?? store.motion;
  const contrastPref = passport?.accessibility?.contrastPreference ?? store.contrast;
  const densityPref = passport?.accessibility?.density ?? store.density;
  const fontSize = passport?.accessibility?.fontSize ?? 16;
  const effectiveSpoons = spoons ?? store.spoons;
  const effectiveSizeClass = sizeClass ?? store.sizeClass;

  const densityMap: Record<string, string> = {
    compact: 'low',
    comfortable: 'medium',
    spacious: 'high',
  };

  const attrs = {
    'data-spoons': String(effectiveSpoons),
    'data-size-class': effectiveSizeClass,
    'data-theme': document.documentElement.dataset.theme || 'quantum-cyan',
    'data-contrast': contrastPref,
    'data-density': densityMap[densityPref] ?? 'medium',
    'data-motion': motionPref,
    style: { fontSize: `${fontSize}px` },
    className: `grey-rock ${className}`.trim(),
  };

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.spoons = String(effectiveSpoons);
    root.dataset.sizeClass = effectiveSizeClass;
    root.dataset.theme = root.dataset.theme || 'quantum-cyan';
    root.dataset.contrast = contrastPref;
    root.dataset.density = densityMap[densityPref] ?? 'medium';
    root.dataset.motion = motionPref;
    root.style.fontSize = `${fontSize}px`;
  }, [effectiveSpoons, effectiveSizeClass, contrastPref, densityMap[densityPref ?? 'medium'], motionPref, fontSize]);

  return <div {...attrs}>{children}</div>;
}

export default GreyRock;
