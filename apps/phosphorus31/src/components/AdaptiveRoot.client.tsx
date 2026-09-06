import { useEffect } from 'react';
import { useAdaptiveStore } from '@p31/ui/adaptive/adaptiveStore';
import { useNeuroAdapter } from '@p31/ui/adaptive/NeuroAdapter';

export default function AdaptiveRoot() {
  useNeuroAdapter({ emitInterval: 2000 });
  const { spoons, sizeClass, contrast, motion, density } = useAdaptiveStore();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.spoons = String(spoons);
    root.dataset.sizeClass = sizeClass;
    root.dataset.contrast = contrast;
    root.dataset.motion = motion;
    root.dataset.density = density;
  }, [spoons, sizeClass, contrast, motion, density]);

  return null;
}
