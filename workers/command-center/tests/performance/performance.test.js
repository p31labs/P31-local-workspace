/**
 * Performance Test Suite
 * Validates latency and throughput requirements
 */

describe('Performance: API Latency', () => {
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8787';

  test('PERF-01: GET /api/status responds within 100ms (cold cache)', async () => {
    const start = Date.now();
    const response = await fetch(`${BASE_URL}/api/status`);
    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(100);
  });

  test('PERF-02: GET /api/status responds within 50ms (warm cache)', async () => {
    // Warm the cache first
    await fetch(`${BASE_URL}/api/status`);
    
    const start = Date.now();
    const response = await fetch(`${BASE_URL}/api/status`);
    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(50);
  });

  test('PERF-03: GET /api/whoami responds within 50ms', async () => {
    const start = Date.now();
    const response = await fetch(`${BASE_URL}/api/whoami`);
    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(50);
  });

  test('PERF-04: POST /api/status responds within 100ms', async () => {
    const statusToken = process.env.STATUS_TOKEN;
    if (!statusToken) {
      console.warn('Skipping PERF-04: No STATUS_TOKEN for write test');
      return;
    }

    const status = {
      workers: [{ name: 'perf-test', status: 'online', url: 'https://example.com' }],
      legal: { case: 'Test', status: 'pending' },
      financial: { operating_buffer: '$0' },
      research: { deployed_workers: 1 },
      dates: [],
    };

    const start = Date.now();
    const response = await fetch(`${BASE_URL}/api/status`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${statusToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(status),
    });
    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(100);
  });

  test('PERF-05: Dashboard HTML loads within 500ms', async () => {
    const start = Date.now();
    const response = await fetch(`${BASE_URL}/`);
    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(500);
  });
});

describe('Performance: D1 Query Performance', () => {
  test('PERF-06: D1 SELECT count(*) executes within 20ms', async () => {
    if (!globalThis.__D1_TEST_DB) {
      console.warn('Skipping PERF-06: No test DB');
      return;
    }

    const db = globalThis.__D1_TEST_DB;
    const start = Date.now();
    const result = await db.prepare('SELECT COUNT(*) as count FROM events').first();
    const duration = Date.now() - start;

    expect(result).toBeDefined();
    expect(duration).toBeLessThan(20);
  });

  test('PERF-07: D1 SELECT with ORDER BY executes within 30ms', async () => {
    if (!globalThis.__D1_TEST_DB) {
      console.warn('Skipping PERF-07: No test DB');
      return;
    }

    const db = globalThis.__D1_TEST_DB;
    const start = Date.now();
    const result = await db.prepare(
      'SELECT * FROM events ORDER BY ts DESC LIMIT 10'
    ).all();
    const duration = Date.now() - start;

    expect(result.results).toBeDefined();
    expect(duration).toBeLessThan(30);
  });

  test('PERF-08: D1 INSERT executes within 20ms', async () => {
    if (!globalThis.__D1_TEST_DB) {
      console.warn('Skipping PERF-08: No test DB');
      return;
    }

    const db = globalThis.__D1_TEST_DB;
    const start = Date.now();
    const result = await db.prepare(
      'INSERT INTO fleet_status (key, value, updated) VALUES (?, ?, ?)'
    ).bind(`perf-test-${Date.now()}`, JSON.stringify({ test: true }), new Date().toISOString()).run();
    const duration = Date.now() - start;

    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(20);

    // Cleanup
    await db.prepare(
      'DELETE FROM fleet_status WHERE key LIKE "perf-test-%"'
    ).run();
  });
});

describe('Performance: Concurrent Requests', () => {
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8787';

  test('PERF-09: 10 concurrent GET /api/status requests complete within 500ms', async () => {
    const promises = [];
    const count = 10;
    for (let i = 0; i < count; i++) {
      promises.push(fetch(`${BASE_URL}/api/status`));
    }

    const start = Date.now();
    const results = await Promise.allSettled(promises);
    const duration = Date.now() - start;

    const fulfilled = results.filter(r => r.status === 'fulfilled').length;
    expect(fulfilled).toBe(count);
    expect(duration).toBeLessThan(500);
  });

  test('PERF-10: Sequential requests maintain low latency', async () => {
    const iterations = 5;
    const durations = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      const response = await fetch(`${BASE_URL}/api/status`);
      const duration = Date.now() - start;
      durations.push(duration);
      expect(response.status).toBe(200);
    }

    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    expect(avgDuration).toBeLessThan(100);
  });
});

describe('Performance: R2 Operations', () => {
  test('PERF-11: R2 PUT executes within 100ms', async () => {
    if (typeof globalThis.__R2_HOT === 'undefined') {
      console.warn('Skipping PERF-11: No R2 binding');
      return;
    }

    const key = `perf-${Date.now()}.txt`;
    const start = Date.now();
    await globalThis.__R2_HOT.put(key, 'test data', {
      httpMetadata: { contentType: 'text/plain' },
    });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);

    await globalThis.__R2_HOT.delete(key);
  });

  test('PERF-12: R2 GET executes within 50ms', async () => {
    if (typeof globalThis.__R2_HOT === 'undefined') {
      console.warn('Skipping PERF-12: No R2 binding');
      return;
    }

    const key = `perf-${Date.now()}.txt`;
    await globalThis.__R2_HOT.put(key, 'test data', {
      httpMetadata: { contentType: 'text/plain' },
    });

    const start = Date.now();
    const object = await globalThis.__R2_HOT.get(key);
    const duration = Date.now() - start;

    expect(object).toBeDefined();
    expect(duration).toBeLessThan(50);

    await globalThis.__R2_HOT.delete(key);
  });
});
