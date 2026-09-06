// Sovereign Bridge — bidirectional shell ↔ ship state sync via window events.
// Each surface calls initSovereignBridge() with callbacks that apply incoming
// state from the other surface.  Each surface is responsible for dispatching
// its own outbound events (p31:shell-* or p31:sovereign-*).

let cleanup: (() => void) | null = null;

export interface BridgeCallbacks {
  onSpoonsChange: (spoons: number) => void;
  onPersonaChange?: (persona: string) => void;
  onCoherenceChange?: (coherence: number) => void;
}

const listeners: [string, EventListener][] = [];

function add(event: string, handler: EventListener) {
  window.addEventListener(event, handler);
  listeners.push([event, handler]);
}

export function initSovereignBridge(callbacks: BridgeCallbacks): () => void {
  if (cleanup) cleanup();

  add('p31:shell-spoons', (e: Event) => {
    const detail = (e as CustomEvent<{ spoons: number }>).detail;
    if (detail?.spoons !== undefined) callbacks.onSpoonsChange(detail.spoons);
  });

  add('p31:shell-persona', (e: Event) => {
    const detail = (e as CustomEvent<{ persona: string }>).detail;
    if (detail?.persona && callbacks.onPersonaChange) callbacks.onPersonaChange(detail.persona);
  });

  add('p31:sovereign-spoons', (e: Event) => {
    const detail = (e as CustomEvent<{ spoons: number }>).detail;
    if (detail?.spoons !== undefined) callbacks.onSpoonsChange(detail.spoons);
  });

  add('p31:sovereign-persona', (e: Event) => {
    const detail = (e as CustomEvent<{ persona: string }>).detail;
    if (detail?.persona && callbacks.onPersonaChange) callbacks.onPersonaChange(detail.persona);
  });

  add('p31:sovereign-coherence', (e: Event) => {
    const detail = (e as CustomEvent<{ coherence: number }>).detail;
    if (detail?.coherence !== undefined && callbacks.onCoherenceChange) callbacks.onCoherenceChange(detail.coherence);
  });

  cleanup = () => {
    for (const [event, handler] of listeners) {
      window.removeEventListener(event, handler);
    }
    listeners.length = 0;
  };

  return cleanup;
}

// ─── Outbound dispatchers (each surface calls these when its own state changes) ─

export function dispatchShellSpoons(spoons: number) {
  window.dispatchEvent(new CustomEvent('p31:shell-spoons', { detail: { spoons } }));
}

export function dispatchShellPersona(persona: string) {
  window.dispatchEvent(new CustomEvent('p31:shell-persona', { detail: { persona } }));
}

export function dispatchSovereignSpoons(spoons: number) {
  window.dispatchEvent(new CustomEvent('p31:sovereign-spoons', { detail: { spoons } }));
}

export function dispatchSovereignCoherence(coherence: number) {
  window.dispatchEvent(new CustomEvent('p31:sovereign-coherence', { detail: { coherence } }));
}

export function dispatchSovereignPersona(persona: string) {
  window.dispatchEvent(new CustomEvent('p31:sovereign-persona', { detail: { persona } }));
}
