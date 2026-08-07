/**
 * sovereignBridge.ts — bidirectional store bridge
 * Links spaceship-earth's useSovereignStore → shell's useAppStore/useShellStore
 * via custom window events (cross-package, no shared module imports needed).
 */

import { useSovereignStore } from '../sovereign/useSovereignStore';

let _cleanup: (() => void) | null = null;

export function initSovereignBridge(): () => void {
  if (_cleanup) _cleanup();

  // Push sovereign → shell on every state change
  const unsub = useSovereignStore.subscribe((state) => {
    window.dispatchEvent(new CustomEvent('p31:sovereign-spoons', { detail: state.spoons }));
    if (state.didKey) window.dispatchEvent(new CustomEvent('p31:sovereign-did', { detail: state.didKey }));
    if (state.love != null) window.dispatchEvent(new CustomEvent('p31:sovereign-love', { detail: state.love }));
    if (state.tier) window.dispatchEvent(new CustomEvent('p31:sovereign-tier', { detail: state.tier }));
    if (state.coherence != null) window.dispatchEvent(new CustomEvent('p31:sovereign-coherence', { detail: state.coherence }));
  });

  // Listen for shell → sovereign pushes
  const onSpoons = ((e: CustomEvent) => { useSovereignStore.setState({ spoons: e.detail }); }) as EventListener;
  const onPersona = ((e: CustomEvent) => { window.localStorage.setItem('p31-active-persona', e.detail); }) as EventListener;

  window.addEventListener('p31:shell-spoons', onSpoons);
  window.addEventListener('p31:shell-persona', onPersona);

  _cleanup = () => {
    unsub();
    window.removeEventListener('p31:shell-spoons', onSpoons);
    window.removeEventListener('p31:shell-persona', onPersona);
    _cleanup = null;
  };

  return _cleanup;
}
