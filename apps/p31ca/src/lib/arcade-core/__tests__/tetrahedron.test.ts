import { describe, it, expect } from 'vitest';
import { generateId } from '../../tetrahedron/db';

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateId()).toBe('string');
    expect(generateId().length).toBeGreaterThan(0);
  });

  it('generates unique ids on successive calls', () => {
    const ids = new Set([generateId(), generateId(), generateId(), generateId(), generateId()]);
    expect(ids.size).toBe(5);
  });

  it('generates ids that never collide over many calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) ids.add(generateId());
    expect(ids.size).toBe(100);
  });
});

// NOTE: IndexedDB CRUD integration tests (saveVisitLog / getVisitLogs / deleteVisitLog)
// require a fully-blocking fake-IDB implementation. The `fake-indexeddb` package
// does not synchronously fire `onsuccess`/`oncomplete` in this jsdom/vitest version,
// which causes every async test to time out.
//
// Recommended next step: add a playwright E2E test
// (`tests/e2e/tetrahedron.spec.ts`) that runs in a real Chromium context where
// IndexedDB is fully functional.
//
// Until then, CRUD is exercised end-to-end through the `/ada` route in the browser.
