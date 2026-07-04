import { getSpoonStore } from './spoonStore';
import { emit } from './eventBus';

let syncInterval: ReturnType<typeof setInterval> | null = null;

export async function syncSpoonFromPHOS() {
  try {
    const res = await fetch('/api/phos/cognitive-state', {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return;
    const data = await res.json();
    const level = data.spoons ?? data.level ?? data.spoonLevel ?? 4;
    const num = Number.parseInt(String(level), 10);
    if (!Number.isFinite(num)) return;

    const store = getSpoonStore();
    if (store.state.level !== num) {
      store.setLevel(Math.max(0, Math.min(12, num)), 'phos');
      emit('p31:spoon:changed', { level: num, source: 'phos' });
    }
  } catch {
    // offline / no endpoint — silent
  }
}

export function startSpoonSync(intervalMs = 30000): () => void {
  syncSpoonFromPHOS();
  syncInterval = setInterval(syncSpoonFromPHOS, intervalMs);
  return () => {
    if (syncInterval) clearInterval(syncInterval);
  };
}

export function stopSpoonSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}
