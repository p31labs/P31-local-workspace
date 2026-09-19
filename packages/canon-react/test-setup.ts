import { expect } from 'vitest';
import * as jestDomMatchers from '@testing-library/jest-dom/matchers';
import * as axeMatchers from 'vitest-axe/matchers';

// Register against the runner's OWN expect instance. jest-dom's
// `@testing-library/jest-dom/vitest` side-effect imports `expect` from a
// 'vitest' that the pnpm store resolves to a different instance than the
// runner's — matchers silently never register. Manual extend against the
// imported instance (below) is the fix; vitest-axe proves the pattern works.

expect.extend(jestDomMatchers);
expect.extend(axeMatchers);

// jsdom doesn't implement matchMedia; axe-core needs it.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}