// Vitest setup file

// Mock performance.now if not available
if (typeof performance === 'undefined') {
  (globalThis as any).performance = {
    now: () => Date.now(),
  };
}

// Mock window.matchMedia for theme store
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }),
  });
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
