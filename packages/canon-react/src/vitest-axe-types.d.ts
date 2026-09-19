/**
 * vitest-axe 0.1.0 augments the legacy `namespace Vi { interface Assertion }`,
 * which Vitest 3 removed. The runtime matcher (`expect.extend(matchers)` in
 * test-setup.ts) still works; only the TYPES are stale. Augment the Vitest 3
 * assertion surface directly — same pattern @testing-library/jest-dom uses in
 * its types/vitest.d.ts.
 */
import 'vitest';
import type { AxeMatchers } from 'vitest-axe';

declare module 'vitest' {
  interface Assertion<T = any> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}