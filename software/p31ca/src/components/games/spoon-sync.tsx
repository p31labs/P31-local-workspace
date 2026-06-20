import { useEffect } from 'react';
import { startSpoonSync } from '../../lib/arcade-core/spoonSync';

export function SpoonSync() {
  useEffect(() => {
    const cleanup = startSpoonSync(30000);
    return cleanup;
  }, []);

  return null;
}
