export type ArcadeEventType =
  | 'p31:arcade-highscore'
  | 'p31:spoon:changed'
  | 'p31:freezeBreakComplete'
  | 'p31:nutrientBurst'
  | 'p31:pidAction'
  | 'p31:groundingWireDrop'
  | 'game:started'
  | 'game:completed'
  | 'game:paused'
  | 'game:resumed'
  | 'spoon:requested'
  | 'p31:bashball:atbat'
  | 'p31:bashball:inningEnd'
  | 'p31:gridiron:playResult'
  | 'p31:gridiron:driveEnd'
  | 'p31:cards:moveMade'
  | 'p31:cards:gameComplete';

export type ArcadeEventListener = (detail: unknown) => void;

const listeners = new Map<ArcadeEventType, Set<ArcadeEventListener>>();

export function on(event: ArcadeEventType, fn: ArcadeEventListener): () => void {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event)!.add(fn);
  return () => listeners.get(event)?.delete(fn);
}

export function emit(event: ArcadeEventType, detail?: unknown): void {
  listeners.get(event)?.forEach(fn => {
    try { fn(detail); } catch { /* noop */ }
  });
  window.dispatchEvent(new CustomEvent(event, { detail }));
}

export function once(event: ArcadeEventType, fn: ArcadeEventListener): () => void {
  const wrapper: ArcadeEventListener = (d) => {
    fn(d);
    cleanup();
  };
  const cleanup = on(event, wrapper);
  return cleanup;
}
