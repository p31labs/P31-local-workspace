import { useEffect } from 'react';
import { useAdaptiveStore } from '@p31ca/ui/adaptive/adaptiveStore';

export default function AdaptiveRoot() {
  const setDecision = useAdaptiveStore((s) => s.setDecision);

  useEffect(() => {
    const spoons = parseInt(typeof window !== 'undefined' ? (localStorage.getItem('p31:spoons') || '3') : '3', 10);
    setDecision({ spoons: spoons as 0 | 1 | 2 | 3 | 4 | 5 });
  }, [setDecision]);

  return null;
}
