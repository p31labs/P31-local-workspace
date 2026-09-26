/**
 * Learning loop — DOM-event based usage telemetry (canon §II AffirmButton
 * pattern). Zero network by default; hosts forward events wherever they like.
 */
export type P31DesignEvent =
  | { type: 'earn-love'; amount: number; recipient?: string[]; component: string }
  | { type: 'component-used'; component: string; spoons: number }
  | { type: 'crisis-entered'; component?: string };

export function emitDesignEvent(event: P31DesignEvent): void {
  document.dispatchEvent(new CustomEvent(`p31:${event.type}`, { detail: event, bubbles: true }));
}

export function onDesignEvent<T = unknown>(
  type: P31DesignEvent['type'],
  handler: (detail: P31DesignEvent & T) => void
): () => void {
  const listener = (e: Event) => handler((e as CustomEvent).detail);
  document.addEventListener(`p31:${type}`, listener);
  return () => document.removeEventListener(`p31:${type}`, listener);
}

/** Current spoon level as reported by the host document. */
export function currentSpoons(): number {
  const v = document.documentElement.getAttribute('data-spoons');
  const n = v === null ? NaN : parseInt(v, 10);
  return Number.isFinite(n) ? n : 3;
}
