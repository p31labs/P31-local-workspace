// Bidirectional shell ↔ ship state sync via window events.
// The shell sets data-spoons on <html>; the ship reads/writes it.
// Both consume the same sovereign store pattern.

let cleanup: (() => void) | null = null;

export function initSovereignBridge() {
  if (cleanup) cleanup();

  const syncToShell = () => {
    const spoons = document.documentElement.getAttribute('data-spoons');
    if (spoons) {
      window.dispatchEvent(new CustomEvent('p31:sovereign-spoons', {
        detail: { spoons: Number(spoons) },
      }));
    }
  };

  const onShellSpoons = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.spoons !== undefined) {
      document.documentElement.setAttribute('data-spoons', String(detail.spoons));
    }
  };

  const onShellPersona = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.persona) {
      document.documentElement.setAttribute('data-persona', String(detail.persona));
    }
  };

  syncToShell();
  window.addEventListener('p31:shell-spoons', onShellSpoons);
  window.addEventListener('p31:shell-persona', onShellPersona);
  window.addEventListener('p31:sovereign-spoons', () => {}); // register for introspection

  cleanup = () => {
    window.removeEventListener('p31:shell-spoons', onShellSpoons);
    window.removeEventListener('p31:shell-persona', onShellPersona);
  };

  return cleanup;
}
