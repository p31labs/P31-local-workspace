// Vitest setup file

// Mock performance.now if not available
if (typeof performance === 'undefined') {
  (globalThis as any).performance = {
    now: () => Date.now(),
  };
}

// Mock document.createElement if needed
if (typeof document === 'undefined') {
  (globalThis as any).document = {
    createElement: () => ({
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  };
}
